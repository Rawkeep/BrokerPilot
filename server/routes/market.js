import { Router } from 'express';
import { cache } from '../index.js';
import { getQuote, getStockChart, getMultiQuote } from '../services/yahooFinance.js';
import { getCryptoMarkets, getCryptoOHLC } from '../services/coinGecko.js';

export const marketRouter = Router();

// Input validation patterns
const SYMBOL_REGEX = /^[A-Za-z0-9.^]{1,15}$/;
const COIN_ID_REGEX = /^[a-z0-9-]{1,50}$/;

/**
 * GET /market/stocks/overview
 * Returns quotes for a curated list of popular stocks & indices worldwide.
 */
marketRouter.get('/market/stocks/overview', async (req, res) => {
  const cacheKey = 'stocks:overview';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  // Curated global watchlist
  const symbols = [
    // Major Indices
    '^GDAXI', '^DJI', '^GSPC', '^IXIC', '^STOXX50E', '^FTSE', '^N225', '^HSI',
    // DE blue chips
    'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'BAS.DE', 'BMW.DE', 'MBG.DE', 'ADS.DE', 'DBK.DE', 'IFX.DE',
    // US mega caps
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'JNJ',
    // US finance & asset managers
    'BLK', 'BRK-B', 'GS', 'MS', 'C',
    // EU
    'ASML.AS', 'MC.PA', 'NESN.SW', 'OR.PA', 'SAN.PA',
    // UK
    'SHEL.L', 'HSBA.L', 'AZN.L',
    // Asia
    '7203.T', '9984.T', '005930.KS', '9988.HK', '0700.HK',
  ];

  try {
    const data = await getMultiQuote(symbols);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * POST /market/stocks/batch
 * Returns quotes for a custom list of symbols (watchlist support).
 * Body: { symbols: ["BLK", "7203.T", ...] }
 */
marketRouter.post('/market/stocks/batch', async (req, res) => {
  const { symbols } = req.body || {};
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'symbols array required' });
  }
  if (symbols.length > 50) {
    return res.status(400).json({ error: 'Max 50 symbols per request' });
  }
  const valid = symbols.filter((s) => typeof s === 'string' && SYMBOL_REGEX.test(s));
  if (valid.length === 0) {
    return res.status(400).json({ error: 'No valid symbols' });
  }

  const cacheKey = `stocks:batch:${valid.sort().join(',')}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getMultiQuote(valid);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /market/stocks/:symbol/chart
 * Returns OHLC chart data for a stock.
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
  const perPage = parseInt(req.query.perPage, 10) || 100;
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
