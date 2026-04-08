import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Get a normalized stock quote for the given symbol.
 * @param {string} symbol - Stock ticker symbol (e.g., "AAPL", "SAP.DE")
 * @returns {Promise<object>} Normalized quote object
 */
export async function getQuote(symbol) {
  const quote = await yahooFinance.quote(symbol);
  return {
    symbol: quote.symbol,
    name: quote.shortName || quote.longName,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    peRatio: quote.trailingPE,
    high52: quote.fiftyTwoWeekHigh,
    low52: quote.fiftyTwoWeekLow,
    currency: quote.currency,
  };
}

/**
 * Get historical OHLC chart data for a stock.
 * @param {string} symbol - Stock ticker symbol
 * @param {string} [range='6mo'] - Time range: '1d', '5d', '1mo', '3mo', '6mo', '1y'
 * @returns {Promise<Array<{time: number, open: number, high: number, low: number, close: number}>>}
 */
export async function getStockChart(symbol, range = '6mo') {
  const interval = range === '1d' ? '5m' : range === '5d' ? '15m' : '1d';
  const period1 = getStartDate(range);

  const result = await yahooFinance.chart(symbol, { period1, interval });

  return result.quotes
    .filter((q) => q.open != null && q.high != null && q.low != null && q.close != null)
    .map((q) => ({
      time: Math.floor(new Date(q.date).getTime() / 1000),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
    }));
}

/**
 * Get quotes for multiple symbols in parallel.
 * @param {string[]} symbols - Array of stock ticker symbols
 * @returns {Promise<Array<object>>} Array of normalized quote objects
 */
export async function getMultiQuote(symbols) {
  const results = await Promise.allSettled(
    symbols.map((sym) => getQuote(sym))
  );
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
}

/**
 * Convert a range string to a start Date.
 * @param {string} range
 * @returns {Date}
 */
function getStartDate(range) {
  const now = new Date();
  const offsets = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
  now.setDate(now.getDate() - (offsets[range] || 180));
  return now;
}
