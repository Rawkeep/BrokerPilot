import { Router } from 'express';
import { cache } from '../index.js';
import { getQuote, getStockChart } from '../services/yahooFinance.js';
import { getCryptoMarkets, getCryptoOHLC } from '../services/coinGecko.js';

export const marketRouter = Router();

// Input validation patterns
const SYMBOL_REGEX = /^[A-Za-z0-9.]{1,10}$/;
const COIN_ID_REGEX = /^[a-z0-9-]{1,50}$/;

/**
 * GET /market/stocks/:symbol
 * Returns normalized stock quote JSON.
 */
marketRouter.get('/market/stocks/:symbol/chart', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!SYMBOL_REGEX.test(symbol)) {
    return res.status(400).json({ error: 'Invalid stock symbol' });
  }

  const range = req.query.range || '6mo';
  const cacheKey = `stock:chart:${symbol}:${range}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getStockChart(symbol, range);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

marketRouter.get('/market/stocks/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!SYMBOL_REGEX.test(symbol)) {
    return res.status(400).json({ error: 'Invalid stock symbol' });
  }

  const cacheKey = `stock:quote:${symbol}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getQuote(symbol);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /market/crypto
 * Returns array of normalized crypto market data.
 */
marketRouter.get('/market/crypto', async (req, res) => {
  const currency = req.query.currency || 'eur';
  const perPage = parseInt(req.query.perPage, 10) || 25;
  const cacheKey = `crypto:markets:${currency}:${perPage}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getCryptoMarkets(currency, perPage);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /market/crypto/:id/chart
 * Returns array of OHLC data for a specific crypto.
 */
marketRouter.get('/market/crypto/:id/chart', async (req, res) => {
  const coinId = req.params.id;
  if (!COIN_ID_REGEX.test(coinId)) {
    return res.status(400).json({ error: 'Invalid coin ID' });
  }

  const currency = req.query.currency || 'eur';
  const days = parseInt(req.query.days, 10) || 30;
  const cacheKey = `crypto:ohlc:${coinId}:${currency}:${days}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getCryptoOHLC(coinId, currency, days);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});
