/**
 * Trading Routes
 *
 * API endpoints for autonomous trading:
 * - Portfolio management (create, get, summary)
 * - Auto-trader control (start, stop, status, manual cycle)
 * - Position management (open, close)
 * - Market scanning and signals
 * - Commodity data
 */

import { Router } from 'express';
import { cache } from '../index.js';
import {
  createPortfolio,
  getPortfolio,
  loadPortfolio,
  getPortfolioSummary,
  openPosition,
  closePosition,
  deletePortfolio,
} from '../services/paperTrading.js';
import {
  getAutoTraderStatus,
  startAutoTrader,
  stopAutoTrader,
  runTradingCycle,
} from '../services/autoTrader.js';
import {
  getCommodityOverview,
  getCommodityQuote,
  getCommodityChart,
  groupByCategory,
  ALL_COMMODITY_TICKERS,
  COMMODITY_SYMBOLS,
} from '../services/commodities.js';
import { scanMarkets, pickTopCandidates } from '../agents/tradingAgent.js';

export const tradingRouter = Router();

// --- Portfolio Endpoints ---

/**
 * POST /trading/portfolio
 * Create a new paper trading portfolio.
 * Body: { initialCapital?: number }
 */
tradingRouter.post('/trading/portfolio', (req, res) => {
  const { initialCapital } = req.body || {};
  const capital = typeof initialCapital === 'number' && initialCapital > 0
    ? initialCapital
    : 10000;

  const portfolio = createPortfolio(capital);
  res.status(201).json(portfolio);
});

/**
 * POST /trading/portfolio/load
 * Load a portfolio from client state (localStorage).
 * Body: { ...serialized portfolio }
 */
tradingRouter.post('/trading/portfolio/load', (req, res) => {
  const data = req.body;
  if (!data?.id) {
    return res.status(400).json({ error: 'Portfolio-Daten mit id erforderlich' });
  }
  const portfolio = loadPortfolio(data);
  res.json(portfolio);
});

/**
 * GET /trading/portfolio/:id
 * Get portfolio by ID.
 */
tradingRouter.get('/trading/portfolio/:id', (req, res) => {
  const portfolio = getPortfolio(req.params.id);
  if (!portfolio) return res.status(404).json({ error: 'Portfolio nicht gefunden' });
  res.json(portfolio);
});

/**
 * GET /trading/portfolio/:id/summary
 * Get portfolio summary with P&L.
 */
tradingRouter.get('/trading/portfolio/:id/summary', (req, res) => {
  const summary = getPortfolioSummary(req.params.id);
  if (!summary) return res.status(404).json({ error: 'Portfolio nicht gefunden' });
  res.json(summary);
});

/**
 * DELETE /trading/portfolio/:id
 */
tradingRouter.delete('/trading/portfolio/:id', (req, res) => {
  const deleted = deletePortfolio(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Portfolio nicht gefunden' });
  res.json({ success: true });
});

// --- Position Endpoints ---

/**
 * POST /trading/portfolio/:id/positions
 * Open a new position manually.
 * Body: { symbol, assetName, assetClass, price, quantity, stopLoss, takeProfit, signal, begruendung? }
 */
tradingRouter.post('/trading/portfolio/:id/positions', (req, res) => {
  const { symbol, assetName, assetClass, price, quantity, stopLoss, takeProfit, signal, begruendung } = req.body || {};

  if (!symbol || !price || !quantity) {
    return res.status(400).json({ error: 'symbol, price, quantity erforderlich' });
  }

  const result = openPosition(req.params.id, {
    symbol,
    assetName: assetName || symbol,
    assetClass: assetClass || 'aktie',
    price,
    quantity,
    stopLoss: stopLoss || price * 0.95,
    takeProfit: takeProfit || price * 1.10,
    signal: signal || 'kaufen',
    begruendung,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json(result);
});

/**
 * POST /trading/portfolio/:id/positions/:positionId/close
 * Close a position.
 * Body: { exitPrice, reason? }
 */
tradingRouter.post('/trading/portfolio/:id/positions/:positionId/close', (req, res) => {
  const { exitPrice, reason } = req.body || {};
  if (!exitPrice) {
    return res.status(400).json({ error: 'exitPrice erforderlich' });
  }

  const result = closePosition(req.params.id, req.params.positionId, exitPrice, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// --- Auto-Trader Endpoints ---

/**
 * GET /trading/auto-trader/status
 */
tradingRouter.get('/trading/auto-trader/status', (_req, res) => {
  res.json(getAutoTraderStatus());
});

/**
 * POST /trading/auto-trader/start
 * Body: { portfolioId, aiConfig: { provider, model, apiKey }, interval? }
 */
tradingRouter.post('/trading/auto-trader/start', (req, res) => {
  const { portfolioId, aiConfig, interval } = req.body || {};
  const result = startAutoTrader({ portfolioId, aiConfig, interval });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

/**
 * POST /trading/auto-trader/stop
 */
tradingRouter.post('/trading/auto-trader/stop', (_req, res) => {
  res.json(stopAutoTrader());
});

/**
 * POST /trading/auto-trader/cycle
 * Run a single trading cycle manually.
 */
tradingRouter.post('/trading/auto-trader/cycle', async (req, res) => {
  try {
    const result = await runTradingCycle();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Market Scan Endpoints ---

/**
 * GET /trading/scan
 * Scan all markets and return top opportunities.
 */
tradingRouter.get('/trading/scan', async (_req, res) => {
  const cacheKey = 'trading:scan';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const scanResults = await scanMarkets();
    const topCandidates = pickTopCandidates(scanResults, 20);
    const result = {
      candidates: topCandidates,
      stats: {
        stocksScanned: scanResults.stocks.length,
        cryptoScanned: scanResults.crypto.length,
        commoditiesScanned: scanResults.commodities.length,
      },
      scannedAt: scanResults.scannedAt,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Commodity Endpoints ---

/**
 * GET /trading/commodities
 * Get overview of all tracked commodities.
 */
tradingRouter.get('/trading/commodities', async (_req, res) => {
  const cacheKey = 'commodities:overview';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const quotes = await getCommodityOverview();
    const grouped = groupByCategory(quotes);
    const result = { commodities: quotes, grouped, symbols: COMMODITY_SYMBOLS };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /trading/commodities/:symbol
 * Get a single commodity quote.
 */
tradingRouter.get('/trading/commodities/:symbol', async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  if (!ALL_COMMODITY_TICKERS.includes(symbol)) {
    return res.status(400).json({ error: 'Unbekanntes Rohstoff-Symbol' });
  }

  const cacheKey = `commodity:${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getCommodityQuote(symbol);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /trading/commodities/:symbol/chart
 * Get OHLC chart data for a commodity.
 */
tradingRouter.get('/trading/commodities/:symbol/chart', async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  if (!ALL_COMMODITY_TICKERS.includes(symbol)) {
    return res.status(400).json({ error: 'Unbekanntes Rohstoff-Symbol' });
  }

  const range = req.query.range || '6mo';
  const cacheKey = `commodity:chart:${symbol}:${range}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getCommodityChart(symbol, range);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});
