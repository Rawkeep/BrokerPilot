/**
 * Frontend API client for /api/market/* endpoints.
 * Each function fetches from the server-side proxy which caches upstream data.
 */

/**
 * Fetch stock overview (curated watchlist with indices & top stocks).
 * @returns {Promise<Array<object>>} Array of normalized quote objects
 */
export async function fetchStockOverview() {
  const res = await fetch('/api/market/stocks/overview');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/**
 * Fetch quotes for a custom list of symbols (watchlist).
 * @param {string[]} symbols - Array of stock ticker symbols
 * @returns {Promise<Array<object>>} Array of normalized quote objects
 */
export async function fetchStockBatch(symbols) {
  const res = await fetch('/api/market/stocks/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/**
 * Fetch a stock quote by ticker symbol.
 * @param {string} symbol - Stock ticker (e.g., "AAPL", "SAP.DE")
 * @returns {Promise<object>} Normalized quote object
 */
export async function fetchStockQuote(symbol) {
  const res = await fetch(`/api/market/stocks/${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/**
 * Fetch historical OHLC chart data for a stock.
 * @param {string} symbol - Stock ticker
 * @param {string} [range='6mo'] - Time range: '1d', '5d', '1mo', '3mo', '6mo', '1y'
 * @returns {Promise<Array<{time: number, open: number, high: number, low: number, close: number}>>}
 */
export async function fetchStockChart(symbol, range = '6mo') {
  const res = await fetch(`/api/market/stocks/${encodeURIComponent(symbol)}/chart?range=${encodeURIComponent(range)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/**
 * Fetch top crypto market data.
 * @param {string} [currency='eur'] - Fiat currency for prices
 * @param {number} [perPage=25] - Number of coins
 * @returns {Promise<Array<object>>} Array of normalized coin objects
 */
export async function fetchCryptoMarkets(currency = 'eur', perPage = 100) {
  const res = await fetch(`/api/market/crypto?currency=${encodeURIComponent(currency)}&perPage=${perPage}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/**
 * Fetch OHLC chart data for a specific crypto coin.
 * @param {string} coinId - CoinGecko coin ID (e.g., "bitcoin")
 * @param {string} [currency='eur'] - Fiat currency
 * @param {number} [days=30] - Number of days
 * @returns {Promise<Array<{time: number, open: number, high: number, low: number, close: number}>>}
 */
export async function fetchCryptoChart(coinId, currency = 'eur', days = 30) {
  const res = await fetch(`/api/market/crypto/${encodeURIComponent(coinId)}/chart?currency=${encodeURIComponent(currency)}&days=${days}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}
