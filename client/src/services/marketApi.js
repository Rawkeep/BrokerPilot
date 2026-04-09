/**
 * Frontend API client for /api/market/* endpoints.
 * Falls back to demo data when backend is unavailable (e.g. GitHub Pages).
 */
import { API_BASE } from '../config.js';
import {
  DEMO_STOCK_OVERVIEW,
  DEMO_CRYPTO_MARKETS,
  getDemoStockChart,
  getDemoCryptoChart,
} from '../data/demoMarketData.js';

/** Try to fetch from API, return null on failure */
async function tryFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch stock overview (curated watchlist with indices & top stocks).
 */
export async function fetchStockOverview() {
  const data = await tryFetch(`${API_BASE}/api/market/stocks/overview`);
  return data || DEMO_STOCK_OVERVIEW;
}

/**
 * Fetch quotes for a custom list of symbols (watchlist).
 */
export async function fetchStockBatch(symbols) {
  const data = await tryFetch(`${API_BASE}/api/market/stocks/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  });
  if (data) return data;
  // Fallback: filter demo data by symbols
  return DEMO_STOCK_OVERVIEW.filter((s) => symbols.includes(s.symbol));
}

/**
 * Fetch a stock quote by ticker symbol.
 */
export async function fetchStockQuote(symbol) {
  const data = await tryFetch(`${API_BASE}/api/market/stocks/${encodeURIComponent(symbol)}`);
  if (data) return data;
  // Fallback: find in demo data or generate
  const match = DEMO_STOCK_OVERVIEW.find((s) => s.symbol === symbol);
  if (match) return match;
  return { symbol, name: symbol, price: 100, change: 1.23, changePercent: 1.23, currency: 'EUR' };
}

/**
 * Fetch historical OHLC chart data for a stock.
 */
export async function fetchStockChart(symbol, range = '6mo') {
  const data = await tryFetch(
    `${API_BASE}/api/market/stocks/${encodeURIComponent(symbol)}/chart?range=${encodeURIComponent(range)}`
  );
  return data || getDemoStockChart(symbol, range);
}

/**
 * Fetch top crypto market data.
 */
export async function fetchCryptoMarkets(currency = 'eur', perPage = 100) {
  const data = await tryFetch(
    `${API_BASE}/api/market/crypto?currency=${encodeURIComponent(currency)}&perPage=${perPage}`
  );
  return data || DEMO_CRYPTO_MARKETS;
}

/**
 * Fetch OHLC chart data for a specific crypto coin.
 */
export async function fetchCryptoChart(coinId, currency = 'eur', days = 30) {
  const data = await tryFetch(
    `${API_BASE}/api/market/crypto/${encodeURIComponent(coinId)}/chart?currency=${encodeURIComponent(currency)}&days=${days}`
  );
  return data || getDemoCryptoChart(coinId, days);
}
