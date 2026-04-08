const BASE_URL = 'https://api.coingecko.com/api/v3';

/**
 * Build request headers, optionally including the CoinGecko demo API key.
 * @returns {object} Headers object
 */
function getHeaders() {
  const headers = { 'Accept': 'application/json' };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }
  return headers;
}

/**
 * Fetch top crypto market data from CoinGecko.
 * @param {string} [vsCurrency='eur'] - Fiat currency for prices
 * @param {number} [perPage=25] - Number of coins to return
 * @returns {Promise<Array<object>>} Normalized array of coin objects
 */
export async function getCryptoMarkets(vsCurrency = 'eur', perPage = 25) {
  const url = `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`;

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    throw Object.assign(new Error('CoinGecko API error'), { status: res.status });
  }

  const coins = await res.json();
  return coins.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    change24h: c.price_change_percentage_24h,
    rank: c.market_cap_rank,
  }));
}

/**
 * Fetch OHLC candlestick data for a specific coin.
 * @param {string} coinId - CoinGecko coin ID (e.g., "bitcoin")
 * @param {string} [vsCurrency='eur'] - Fiat currency
 * @param {number} [days=30] - Number of days of data
 * @returns {Promise<Array<{time: number, open: number, high: number, low: number, close: number}>>}
 */
export async function getCryptoOHLC(coinId, vsCurrency = 'eur', days = 30) {
  const url = `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`;

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    throw Object.assign(new Error('CoinGecko OHLC error'), { status: res.status });
  }

  const raw = await res.json();
  return raw.map(([ts, open, high, low, close]) => ({
    time: Math.floor(ts / 1000),
    open,
    high,
    low,
    close,
  }));
}
