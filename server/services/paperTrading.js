/**
 * Paper Trading Portfolio Service
 *
 * Simulated portfolio management for the autonomous trading agent.
 * All state is in-memory (persisted to client via API responses,
 * stored in localStorage on the frontend — no DB in v1).
 *
 * Features:
 * - Virtual portfolio with configurable starting capital
 * - Position management (open, close, partial close)
 * - P&L tracking per position and overall
 * - Trade history log
 * - Risk checks before execution
 */

import { v4 as uuid } from 'uuid';

/** @typedef {'open' | 'closed'} PositionStatus */

/**
 * @typedef {object} Position
 * @property {string} id
 * @property {string} symbol
 * @property {string} assetName
 * @property {string} assetClass
 * @property {number} quantity
 * @property {number} entryPrice
 * @property {number} [currentPrice]
 * @property {number} stopLoss
 * @property {number} takeProfit
 * @property {PositionStatus} status
 * @property {string} openedAt
 * @property {string} [closedAt]
 * @property {number} [exitPrice]
 * @property {number} [realizedPnl]
 * @property {string} signal - 'kaufen' | 'verkaufen'
 */

/**
 * @typedef {object} Portfolio
 * @property {string} id
 * @property {number} initialCapital
 * @property {number} capital - Current cash balance
 * @property {Position[]} positions
 * @property {Array<object>} tradeHistory
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** In-memory portfolio store keyed by portfolio ID */
const portfolios = new Map();

/**
 * Create a new paper trading portfolio.
 * @param {number} [initialCapital=10000] - Starting capital in EUR
 * @returns {Portfolio}
 */
export function createPortfolio(initialCapital = 10000) {
  const portfolio = {
    id: uuid(),
    initialCapital,
    capital: initialCapital,
    positions: [],
    tradeHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  portfolios.set(portfolio.id, portfolio);
  return portfolio;
}

/**
 * Get a portfolio by ID.
 * @param {string} id
 * @returns {Portfolio|null}
 */
export function getPortfolio(id) {
  return portfolios.get(id) || null;
}

/**
 * Load a portfolio from client state (e.g. from localStorage via API).
 * @param {object} data - Serialized portfolio
 * @returns {Portfolio}
 */
export function loadPortfolio(data) {
  const portfolio = { ...data, updatedAt: new Date().toISOString() };
  portfolios.set(portfolio.id, portfolio);
  return portfolio;
}

/**
 * List all in-memory portfolios.
 * @returns {Portfolio[]}
 */
export function listPortfolios() {
  return [...portfolios.values()];
}

// --- Risk Checks ---

const MAX_POSITION_PCT = 10; // Max 10% of portfolio per position
const MAX_TOTAL_EXPOSURE_PCT = 80; // Max 80% of capital invested

/**
 * Check if a trade passes risk rules.
 * @param {Portfolio} portfolio
 * @param {number} tradeValue - Total cost of the trade in EUR
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkRisk(portfolio, tradeValue) {
  if (tradeValue <= 0) {
    return { allowed: false, reason: 'Handelswert muss positiv sein' };
  }

  if (tradeValue > portfolio.capital) {
    return { allowed: false, reason: `Nicht genug Kapital (verfuegbar: ${portfolio.capital.toFixed(2)} EUR, benoetigt: ${tradeValue.toFixed(2)} EUR)` };
  }

  const totalValue = portfolio.initialCapital;
  const maxPerPosition = totalValue * (MAX_POSITION_PCT / 100);
  if (tradeValue > maxPerPosition) {
    return { allowed: false, reason: `Position ueberschreitet ${MAX_POSITION_PCT}% Limit (max: ${maxPerPosition.toFixed(2)} EUR)` };
  }

  const currentExposure = portfolio.positions
    .filter((p) => p.status === 'open')
    .reduce((sum, p) => sum + p.quantity * (p.currentPrice || p.entryPrice), 0);

  const maxExposure = totalValue * (MAX_TOTAL_EXPOSURE_PCT / 100);
  if (currentExposure + tradeValue > maxExposure) {
    return { allowed: false, reason: `Gesamtexposure ueberschreitet ${MAX_TOTAL_EXPOSURE_PCT}% Limit` };
  }

  return { allowed: true };
}

// --- Trade Execution ---

/**
 * Open a new position (paper trade).
 * @param {string} portfolioId
 * @param {object} trade
 * @param {string} trade.symbol
 * @param {string} trade.assetName
 * @param {string} trade.assetClass
 * @param {number} trade.price - Entry price
 * @param {number} trade.quantity
 * @param {number} trade.stopLoss
 * @param {number} trade.takeProfit
 * @param {string} trade.signal - 'kaufen' | 'verkaufen'
 * @param {string} [trade.begruendung]
 * @returns {{ success: boolean, position?: Position, error?: string }}
 */
export function openPosition(portfolioId, trade) {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return { success: false, error: 'Portfolio nicht gefunden' };

  const tradeValue = trade.price * trade.quantity;
  const riskCheck = checkRisk(portfolio, tradeValue);
  if (!riskCheck.allowed) {
    return { success: false, error: riskCheck.reason };
  }

  const position = {
    id: uuid(),
    symbol: trade.symbol,
    assetName: trade.assetName,
    assetClass: trade.assetClass,
    quantity: trade.quantity,
    entryPrice: trade.price,
    currentPrice: trade.price,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    status: 'open',
    signal: trade.signal,
    openedAt: new Date().toISOString(),
  };

  portfolio.capital -= tradeValue;
  portfolio.positions.push(position);
  portfolio.tradeHistory.push({
    type: 'open',
    positionId: position.id,
    symbol: trade.symbol,
    price: trade.price,
    quantity: trade.quantity,
    value: tradeValue,
    begruendung: trade.begruendung || '',
    timestamp: new Date().toISOString(),
  });
  portfolio.updatedAt = new Date().toISOString();

  return { success: true, position };
}

/**
 * Close a position (paper trade).
 * @param {string} portfolioId
 * @param {string} positionId
 * @param {number} exitPrice
 * @param {string} [reason]
 * @returns {{ success: boolean, position?: Position, pnl?: number, error?: string }}
 */
export function closePosition(portfolioId, positionId, exitPrice, reason) {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return { success: false, error: 'Portfolio nicht gefunden' };

  const position = portfolio.positions.find((p) => p.id === positionId && p.status === 'open');
  if (!position) return { success: false, error: 'Offene Position nicht gefunden' };

  const tradeValue = exitPrice * position.quantity;
  const entryValue = position.entryPrice * position.quantity;
  const pnl = position.signal === 'kaufen'
    ? tradeValue - entryValue
    : entryValue - tradeValue;

  position.status = 'closed';
  position.exitPrice = exitPrice;
  position.closedAt = new Date().toISOString();
  position.realizedPnl = pnl;

  portfolio.capital += tradeValue;
  portfolio.tradeHistory.push({
    type: 'close',
    positionId: position.id,
    symbol: position.symbol,
    entryPrice: position.entryPrice,
    exitPrice,
    quantity: position.quantity,
    pnl,
    reason: reason || '',
    timestamp: new Date().toISOString(),
  });
  portfolio.updatedAt = new Date().toISOString();

  return { success: true, position, pnl };
}

/**
 * Update current prices for all open positions and check stop-loss / take-profit.
 * @param {string} portfolioId
 * @param {Record<string, number>} prices - Map of symbol -> current price
 * @returns {{ updatedPositions: number, triggeredStops: Array<object> }}
 */
export function updatePrices(portfolioId, prices) {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return { updatedPositions: 0, triggeredStops: [] };

  let updatedPositions = 0;
  const triggeredStops = [];

  for (const position of portfolio.positions) {
    if (position.status !== 'open') continue;

    const currentPrice = prices[position.symbol];
    if (currentPrice == null) continue;

    position.currentPrice = currentPrice;
    updatedPositions++;

    // Check stop-loss
    if (position.signal === 'kaufen' && currentPrice <= position.stopLoss) {
      const result = closePosition(portfolioId, position.id, currentPrice, 'Stop-Loss ausgeloest');
      if (result.success) {
        triggeredStops.push({ ...result.position, triggerType: 'stop-loss' });
      }
    }

    // Check take-profit
    if (position.signal === 'kaufen' && currentPrice >= position.takeProfit) {
      const result = closePosition(portfolioId, position.id, currentPrice, 'Take-Profit erreicht');
      if (result.success) {
        triggeredStops.push({ ...result.position, triggerType: 'take-profit' });
      }
    }
  }

  if (updatedPositions > 0) {
    portfolio.updatedAt = new Date().toISOString();
  }

  return { updatedPositions, triggeredStops };
}

/**
 * Get portfolio summary with P&L calculations.
 * @param {string} portfolioId
 * @returns {object|null}
 */
export function getPortfolioSummary(portfolioId) {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return null;

  const openPositions = portfolio.positions.filter((p) => p.status === 'open');
  const closedPositions = portfolio.positions.filter((p) => p.status === 'closed');

  const unrealizedPnl = openPositions.reduce((sum, p) => {
    const current = p.currentPrice || p.entryPrice;
    const pnl = p.signal === 'kaufen'
      ? (current - p.entryPrice) * p.quantity
      : (p.entryPrice - current) * p.quantity;
    return sum + pnl;
  }, 0);

  const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);

  const openExposure = openPositions.reduce(
    (sum, p) => sum + p.quantity * (p.currentPrice || p.entryPrice),
    0
  );

  const totalValue = portfolio.capital + openExposure;
  const totalReturn = ((totalValue - portfolio.initialCapital) / portfolio.initialCapital) * 100;

  const winningTrades = closedPositions.filter((p) => (p.realizedPnl || 0) > 0).length;
  const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;

  return {
    id: portfolio.id,
    initialCapital: portfolio.initialCapital,
    capital: portfolio.capital,
    totalValue,
    totalReturn,
    unrealizedPnl,
    realizedPnl,
    openExposure,
    openPositions: openPositions.length,
    closedTrades: closedPositions.length,
    winRate,
    positions: openPositions,
    recentTrades: portfolio.tradeHistory.slice(-20),
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  };
}

/**
 * Delete a portfolio.
 * @param {string} id
 * @returns {boolean}
 */
export function deletePortfolio(id) {
  return portfolios.delete(id);
}
