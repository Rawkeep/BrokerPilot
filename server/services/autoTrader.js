/**
 * Auto-Trader Service
 *
 * Autonomous trading loop that periodically:
 * 1. Scans markets via the Trading Agent
 * 2. Gets AI-generated signals
 * 3. Executes paper trades based on signals
 * 4. Monitors open positions (stop-loss / take-profit)
 *
 * The loop runs on a configurable interval (default: 5 min).
 * All trades are paper trades — no real money involved.
 */

import { scanMarkets, pickTopCandidates, buildPrompt, parseResponse } from '../agents/tradingAgent.js';
import { relayAIRequest } from './aiProxy.js';
import {
  getPortfolio,
  getPortfolioSummary,
  openPosition,
  updatePrices,
} from './paperTrading.js';
import { getMultiQuote } from './yahooFinance.js';

/** @typedef {{ enabled: boolean, portfolioId: string|null, interval: number, aiConfig: object|null, lastScanAt: string|null, lastSignals: Array, recentActions: Array, errors: Array }} AutoTraderState */

/** In-memory auto-trader state */
const state = {
  enabled: false,
  portfolioId: null,
  interval: 5 * 60 * 1000, // 5 minutes
  aiConfig: null,
  lastScanAt: null,
  lastSignals: [],
  recentActions: [],
  errors: [],
  /** @type {ReturnType<typeof setInterval>|null} */
  _timer: null,
};

const MAX_RECENT_ACTIONS = 100;
const MAX_ERRORS = 50;

/**
 * Get the current auto-trader status (safe to serialize).
 * @returns {object}
 */
export function getAutoTraderStatus() {
  return {
    enabled: state.enabled,
    portfolioId: state.portfolioId,
    interval: state.interval,
    lastScanAt: state.lastScanAt,
    lastSignals: state.lastSignals,
    recentActions: state.recentActions.slice(-20),
    errorCount: state.errors.length,
    lastError: state.errors.length > 0 ? state.errors[state.errors.length - 1] : null,
  };
}

/**
 * Configure and start the auto-trader.
 * @param {object} config
 * @param {string} config.portfolioId - Portfolio to trade on
 * @param {{ provider: string, model: string, apiKey: string }} config.aiConfig
 * @param {number} [config.interval] - Scan interval in ms (default 5 min)
 * @returns {{ success: boolean, error?: string }}
 */
export function startAutoTrader(config) {
  if (!config.portfolioId) return { success: false, error: 'portfolioId erforderlich' };
  if (!config.aiConfig?.provider || !config.aiConfig?.model) {
    return { success: false, error: 'aiConfig mit provider und model erforderlich' };
  }

  const portfolio = getPortfolio(config.portfolioId);
  if (!portfolio) return { success: false, error: 'Portfolio nicht gefunden' };

  // Stop existing timer if running
  if (state._timer) clearInterval(state._timer);

  state.enabled = true;
  state.portfolioId = config.portfolioId;
  state.aiConfig = config.aiConfig;
  state.interval = config.interval || 5 * 60 * 1000;

  // Run immediately, then on interval
  runTradingCycle().catch((err) => recordError(err));
  state._timer = setInterval(() => {
    runTradingCycle().catch((err) => recordError(err));
  }, state.interval);

  recordAction('auto-trader gestartet', { portfolioId: config.portfolioId, interval: state.interval });
  return { success: true };
}

/**
 * Stop the auto-trader.
 * @returns {{ success: boolean }}
 */
export function stopAutoTrader() {
  if (state._timer) {
    clearInterval(state._timer);
    state._timer = null;
  }
  state.enabled = false;
  recordAction('auto-trader gestoppt', {});
  return { success: true };
}

/**
 * Run a single trading cycle manually (also used by the loop).
 * @returns {Promise<object>} Cycle result
 */
export async function runTradingCycle() {
  if (!state.portfolioId || !state.aiConfig) {
    throw new Error('Auto-Trader nicht konfiguriert');
  }

  const cycleStart = Date.now();
  recordAction('scan gestartet', {});

  // 1. Scan markets
  const scanResults = await scanMarkets();
  state.lastScanAt = new Date().toISOString();

  // 2. Pick top candidates
  const candidates = pickTopCandidates(scanResults, 12);

  // 3. Get portfolio context
  const summary = getPortfolioSummary(state.portfolioId);

  // 4. Build prompt and call AI
  const messages = buildPrompt(candidates, summary);
  const aiResponse = await relayAIRequest(
    state.aiConfig.provider,
    state.aiConfig.model,
    messages,
    state.aiConfig.apiKey
  );

  // 5. Parse signals
  const result = parseResponse(aiResponse.content);
  state.lastSignals = result.signale || [];

  recordAction('signale erhalten', {
    signalCount: result.signale.length,
    overview: result.marktueberblick?.substring(0, 100),
  });

  // 6. Execute buy signals automatically
  const execResults = [];
  for (const signal of result.signale) {
    if (signal.signal !== 'kaufen') continue;
    if (signal.konfidenz === 'niedrig') continue;

    const portfolio = getPortfolio(state.portfolioId);
    if (!portfolio) break;

    // Calculate quantity based on positionsgroesse (% of capital)
    const allocPct = Math.min(signal.positionsgroesse || 5, 10);
    const allocAmount = portfolio.capital * (allocPct / 100);
    const quantity = signal.einstiegspreis > 0 ? allocAmount / signal.einstiegspreis : 0;

    if (quantity <= 0) continue;

    const tradeResult = openPosition(state.portfolioId, {
      symbol: signal.symbol,
      assetName: signal.assetName,
      assetClass: signal.assetClass,
      price: signal.einstiegspreis,
      quantity,
      stopLoss: signal.stopLoss,
      takeProfit: signal.zielpreis,
      signal: signal.signal,
      begruendung: signal.begruendung,
    });

    execResults.push({
      symbol: signal.symbol,
      success: tradeResult.success,
      error: tradeResult.error,
      quantity: tradeResult.success ? quantity : 0,
    });

    if (tradeResult.success) {
      recordAction('position eroeffnet', {
        symbol: signal.symbol,
        price: signal.einstiegspreis,
        quantity: quantity.toFixed(4),
        stopLoss: signal.stopLoss,
        takeProfit: signal.zielpreis,
      });
    }
  }

  // 7. Update prices for open positions
  await refreshOpenPositionPrices();

  const duration = Date.now() - cycleStart;
  recordAction('zyklus abgeschlossen', { duration, trades: execResults.length });

  return {
    signals: result,
    executions: execResults,
    duration,
  };
}

/**
 * Refresh current prices for all open positions and trigger stops.
 * @returns {Promise<object>}
 */
async function refreshOpenPositionPrices() {
  if (!state.portfolioId) return { updatedPositions: 0, triggeredStops: [] };

  const portfolio = getPortfolio(state.portfolioId);
  if (!portfolio) return { updatedPositions: 0, triggeredStops: [] };

  const openPositions = portfolio.positions.filter((p) => p.status === 'open');
  if (openPositions.length === 0) return { updatedPositions: 0, triggeredStops: [] };

  const symbols = [...new Set(openPositions.map((p) => p.symbol))];

  try {
    const quotes = await getMultiQuote(symbols);
    const priceMap = {};
    for (const q of quotes) {
      priceMap[q.symbol] = q.price;
    }
    const result = updatePrices(state.portfolioId, priceMap);

    for (const stop of result.triggeredStops) {
      recordAction(`${stop.triggerType} ausgeloest`, {
        symbol: stop.symbol,
        exitPrice: stop.exitPrice,
        pnl: stop.realizedPnl?.toFixed(2),
      });
    }

    return result;
  } catch {
    return { updatedPositions: 0, triggeredStops: [] };
  }
}

// --- Helpers ---

function recordAction(action, details) {
  state.recentActions.push({
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  if (state.recentActions.length > MAX_RECENT_ACTIONS) {
    state.recentActions = state.recentActions.slice(-MAX_RECENT_ACTIONS);
  }
}

function recordError(err) {
  state.errors.push({
    message: err.message || String(err),
    timestamp: new Date().toISOString(),
  });
  if (state.errors.length > MAX_ERRORS) {
    state.errors = state.errors.slice(-MAX_ERRORS);
  }
}
