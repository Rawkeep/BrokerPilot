import { getQuote, getMultiQuote, getStockChart } from './yahooFinance.js';
import { getCryptoMarkets } from './coinGecko.js';

/**
 * Index definitions by broker type.
 * Each type tracks indices and blue-chip symbols relevant to that vertical.
 */
const BROKER_INDICES = {
  immobilien: {
    indices: ['^GDAXI', '^STOXX50E', '^GSPC', '^DJI'],
    stocks: ['VNQ', 'IYR', 'LEG.DE', 'VNA.DE', 'ADJ.DE', 'SAP.DE', 'SIE.DE', 'ALV.DE'],
  },
  finanz: {
    indices: ['^GDAXI', '^GSPC', '^DJI', '^STOXX50E', '^FTSE'],
    stocks: ['DBK.DE', 'CBK.DE', 'ALV.DE', 'MUV2.DE', 'JPM', 'GS', 'BLK', 'MS'],
  },
  versicherung: {
    indices: ['^GDAXI', '^STOXX50E', '^GSPC'],
    stocks: ['ALV.DE', 'MUV2.DE', 'HNR1.DE', 'DTE.DE', 'AIG', 'MET', 'PRU'],
  },
  investment: {
    indices: ['^GDAXI', '^GSPC', '^DJI', '^IXIC', '^STOXX50E', '^FTSE', '^N225'],
    stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'SAP.DE', 'SIE.DE', 'BLK'],
  },
  krypto: {
    indices: ['^GSPC', '^IXIC'],
    stocks: ['COIN', 'MSTR', 'MARA', 'RIOT'],
  },
};

const DEFAULT_TYPE = 'investment';

/**
 * Get the symbol set for a given broker type.
 */
function getSymbolSet(brokerType) {
  return BROKER_INDICES[brokerType] || BROKER_INDICES[DEFAULT_TYPE];
}

/**
 * Classify a quote's trend based on change percentage.
 * @param {number} changePercent
 * @returns {'up' | 'down' | 'sideways'}
 */
function classifyTrend(changePercent) {
  if (changePercent > 0.3) return 'up';
  if (changePercent < -0.3) return 'down';
  return 'sideways';
}

/**
 * Detect consecutive direction days from chart data.
 * @param {Array} chartData - OHLC data sorted by time ascending
 * @returns {{ consecutiveUp: number, consecutiveDown: number }}
 */
function detectConsecutiveDays(chartData) {
  if (!chartData || chartData.length < 2) return { consecutiveUp: 0, consecutiveDown: 0 };

  let consecutiveUp = 0;
  let consecutiveDown = 0;

  // Walk backward from most recent
  for (let i = chartData.length - 1; i > 0; i--) {
    const change = chartData[i].close - chartData[i - 1].close;
    if (i === chartData.length - 1) {
      if (change > 0) consecutiveUp = 1;
      else if (change < 0) consecutiveDown = 1;
      else break;
    } else {
      if (change > 0 && consecutiveUp > 0) consecutiveUp++;
      else if (change < 0 && consecutiveDown > 0) consecutiveDown++;
      else break;
    }
  }

  return { consecutiveUp, consecutiveDown };
}

/**
 * Detect if price is near 52-week high or low.
 * @param {object} quote - Normalized quote object
 * @returns {Array<object>} Array of detected patterns
 */
function detectBreakouts(quote) {
  const patterns = [];
  if (!quote || !quote.high52 || !quote.low52 || !quote.price) return patterns;

  const range = quote.high52 - quote.low52;
  if (range === 0) return patterns;

  const pctFromHigh = ((quote.high52 - quote.price) / quote.high52) * 100;
  const pctFromLow = ((quote.price - quote.low52) / quote.low52) * 100;

  if (pctFromHigh < 3) {
    patterns.push({
      type: 'near_52w_high',
      label: 'Nahe 52-Wochen-Hoch',
      symbol: quote.symbol,
      detail: `${pctFromHigh.toFixed(1)}% unter dem 52-Wochen-Hoch`,
    });
  }

  if (pctFromLow < 5) {
    patterns.push({
      type: 'near_52w_low',
      label: 'Nahe 52-Wochen-Tief',
      symbol: quote.symbol,
      detail: `${pctFromLow.toFixed(1)}% ueber dem 52-Wochen-Tief`,
    });
  }

  return patterns;
}

/**
 * Generate a daily market report for the given broker type.
 * @param {string} [brokerType='investment'] - Broker vertical
 * @returns {Promise<object>} Structured daily report
 */
export async function generateDailyReport(brokerType = DEFAULT_TYPE) {
  const symbolSet = getSymbolSet(brokerType);
  const allSymbols = [...symbolSet.indices, ...symbolSet.stocks];

  // Fetch all quotes in parallel
  const quotes = await getMultiQuote(allSymbols);

  // Separate indices from stocks
  const indices = quotes.filter((q) => q.symbol.startsWith('^'));
  const stocks = quotes.filter((q) => !q.symbol.startsWith('^'));

  // Sort for gainers / losers (by changePercent)
  const sorted = [...stocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
  const topGainers = sorted.slice(0, 5).filter((q) => (q.changePercent || 0) > 0);
  const topLosers = sorted.slice(-5).reverse().filter((q) => (q.changePercent || 0) < 0);

  // Detect trends for indices
  const trends = [];
  for (const idx of indices) {
    const trend = classifyTrend(idx.changePercent || 0);
    trends.push({
      symbol: idx.symbol,
      name: idx.name,
      price: idx.price,
      change: idx.change,
      changePercent: idx.changePercent,
      trend,
    });
  }

  // Detect breakout patterns
  const breakouts = [];
  for (const q of quotes) {
    breakouts.push(...detectBreakouts(q));
  }

  // Build alerts from notable moves
  const alerts = [];
  for (const q of quotes) {
    if (Math.abs(q.changePercent || 0) >= 5) {
      alerts.push({
        type: 'significant_move',
        severity: Math.abs(q.changePercent) >= 8 ? 'critical' : 'warning',
        title: `${q.symbol}: ${q.changePercent > 0 ? '+' : ''}${q.changePercent?.toFixed(2)}%`,
        description: `${q.name || q.symbol} hat sich um ${q.changePercent?.toFixed(2)}% bewegt (${q.price} ${q.currency || ''})`,
        symbols: [q.symbol],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Generate text summary
  const marketDirection = indices.length > 0
    ? indices.reduce((sum, i) => sum + (i.changePercent || 0), 0) / indices.length
    : 0;

  const directionLabel = marketDirection > 0.3 ? 'positiv' : marketDirection < -0.3 ? 'negativ' : 'seitwaerts';

  const summary = `Die Maerkte tendieren heute ${directionLabel} (Durchschnitt: ${marketDirection > 0 ? '+' : ''}${marketDirection.toFixed(2)}%). ${topGainers.length > 0 ? `Top Gewinner: ${topGainers[0].symbol} (+${topGainers[0].changePercent?.toFixed(2)}%).` : ''} ${topLosers.length > 0 ? `Groesster Verlierer: ${topLosers[0].symbol} (${topLosers[0].changePercent?.toFixed(2)}%).` : ''}`;

  return {
    date: new Date().toISOString().split('T')[0],
    brokerType,
    indices: indices.map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      trend: classifyTrend(q.changePercent || 0),
    })),
    topGainers: topGainers.map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
    })),
    topLosers: topLosers.map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
    })),
    trends,
    breakouts,
    alerts,
    summary,
  };
}

/**
 * Check for notable alerts on a watchlist of symbols and optional leads.
 * @param {string[]} watchlist - Array of stock symbols
 * @param {Array<object>} [leads=[]] - Optional array of lead objects with interests
 * @returns {Promise<Array<object>>} Array of alert objects
 */
export async function detectAlerts(watchlist = [], leads = []) {
  const alerts = [];

  if (watchlist.length === 0) return alerts;

  // Fetch quotes for all watchlist symbols
  const quotes = await getMultiQuote(watchlist);

  for (const q of quotes) {
    // Stock dropped >5%
    if ((q.changePercent || 0) <= -5) {
      alerts.push({
        type: 'price_drop',
        severity: q.changePercent <= -8 ? 'critical' : 'warning',
        title: `${q.symbol} gefallen: ${q.changePercent?.toFixed(2)}%`,
        description: `${q.name || q.symbol} ist um ${Math.abs(q.changePercent || 0).toFixed(2)}% gefallen auf ${q.price} ${q.currency || ''}`,
        symbols: [q.symbol],
        timestamp: new Date().toISOString(),
      });
    }

    // Stock surged >5%
    if ((q.changePercent || 0) >= 5) {
      alerts.push({
        type: 'price_surge',
        severity: q.changePercent >= 8 ? 'critical' : 'warning',
        title: `${q.symbol} gestiegen: +${q.changePercent?.toFixed(2)}%`,
        description: `${q.name || q.symbol} ist um ${q.changePercent?.toFixed(2)}% gestiegen auf ${q.price} ${q.currency || ''}`,
        symbols: [q.symbol],
        timestamp: new Date().toISOString(),
      });
    }

    // Near 52-week boundaries
    const breakouts = detectBreakouts(q);
    for (const b of breakouts) {
      alerts.push({
        type: b.type,
        severity: 'info',
        title: `${b.symbol}: ${b.label}`,
        description: b.detail,
        symbols: [b.symbol],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check crypto for significant moves
  try {
    const crypto = await getCryptoMarkets('eur', 20);
    for (const coin of crypto) {
      if (Math.abs(coin.change24h || 0) >= 10) {
        alerts.push({
          type: 'crypto_move',
          severity: Math.abs(coin.change24h) >= 20 ? 'critical' : 'warning',
          title: `${coin.symbol}: ${coin.change24h > 0 ? '+' : ''}${coin.change24h?.toFixed(2)}%`,
          description: `${coin.name} hat sich um ${coin.change24h?.toFixed(2)}% in 24h bewegt`,
          symbols: [coin.symbol],
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Crypto alerts are optional; skip on failure
  }

  // Lead-specific alerts
  if (leads.length > 0) {
    for (const lead of leads) {
      const interests = lead.interests || lead.watchlist || [];
      for (const q of quotes) {
        if (interests.includes(q.symbol) && Math.abs(q.changePercent || 0) >= 3) {
          alerts.push({
            type: 'lead_interest',
            severity: 'info',
            title: `Lead-Interesse: ${q.symbol} bewegt sich`,
            description: `${lead.name || 'Ein Lead'} interessiert sich fuer ${q.symbol}, welches sich um ${q.changePercent?.toFixed(2)}% bewegt hat`,
            symbols: [q.symbol],
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Analyze trends for a specific symbol over a given period.
 * @param {string} symbol - Stock ticker symbol
 * @param {number} [days=30] - Number of days to analyze
 * @returns {Promise<object>} Trend analysis result
 */
export async function analyzeTrend(symbol, days = 30) {
  const range = days <= 5 ? '5d' : days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : '1y';

  const [quote, chartData] = await Promise.all([
    getQuote(symbol),
    getStockChart(symbol, range),
  ]);

  const { consecutiveUp, consecutiveDown } = detectConsecutiveDays(chartData);

  // Calculate period change
  let periodChange = null;
  let periodChangePercent = null;
  if (chartData.length >= 2) {
    const startPrice = chartData[0].close;
    const endPrice = chartData[chartData.length - 1].close;
    periodChange = endPrice - startPrice;
    periodChangePercent = ((endPrice - startPrice) / startPrice) * 100;
  }

  // Simple moving averages
  const sma20 = chartData.length >= 20
    ? chartData.slice(-20).reduce((s, d) => s + d.close, 0) / 20
    : null;

  const sma50 = chartData.length >= 50
    ? chartData.slice(-50).reduce((s, d) => s + d.close, 0) / 50
    : null;

  // Volatility (standard deviation of daily returns)
  let volatility = null;
  if (chartData.length >= 5) {
    const returns = [];
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i - 1].close !== 0) {
        returns.push((chartData[i].close - chartData[i - 1].close) / chartData[i - 1].close);
      }
    }
    if (returns.length > 0) {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
      volatility = Math.sqrt(variance) * 100;
    }
  }

  // Determine overall trend
  let overallTrend = 'sideways';
  if (periodChangePercent !== null) {
    if (periodChangePercent > 5) overallTrend = 'up';
    else if (periodChangePercent < -5) overallTrend = 'down';
  }

  // Detect patterns
  const patterns = [];
  if (consecutiveUp >= 5) {
    patterns.push({ type: 'streak', label: `${consecutiveUp} aufeinanderfolgende Gewinntage` });
  }
  if (consecutiveDown >= 5) {
    patterns.push({ type: 'streak', label: `${consecutiveDown} aufeinanderfolgende Verlusttage` });
  }
  if (sma20 && sma50 && sma20 > sma50) {
    patterns.push({ type: 'golden_cross', label: 'SMA20 ueber SMA50 (bullisch)' });
  }
  if (sma20 && sma50 && sma20 < sma50) {
    patterns.push({ type: 'death_cross', label: 'SMA20 unter SMA50 (baerisch)' });
  }

  const breakouts = detectBreakouts(quote);
  for (const b of breakouts) {
    patterns.push({ type: b.type, label: b.label, detail: b.detail });
  }

  return {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    currency: quote.currency,
    period: { days, range },
    periodChange,
    periodChangePercent,
    trend: overallTrend,
    consecutiveUp,
    consecutiveDown,
    sma20,
    sma50,
    volatility,
    high52: quote.high52,
    low52: quote.low52,
    patterns,
    dataPoints: chartData.length,
  };
}

/**
 * Generate a weekly digest with lead-specific insights.
 * @param {string} [brokerType='investment'] - Broker vertical
 * @param {Array<object>} [leads=[]] - Optional leads for personalized insights
 * @returns {Promise<object>} Weekly digest
 */
export async function generateWeeklyDigest(brokerType = DEFAULT_TYPE, leads = []) {
  const dailyReport = await generateDailyReport(brokerType);

  // Gather watchlist from leads
  const leadSymbols = new Set();
  for (const lead of leads) {
    const interests = lead.interests || lead.watchlist || [];
    interests.forEach((s) => leadSymbols.add(s));
  }

  // Fetch trend analysis for top movers
  const topSymbols = [
    ...dailyReport.topGainers.map((g) => g.symbol),
    ...dailyReport.topLosers.map((l) => l.symbol),
  ].slice(0, 6);

  const trendResults = await Promise.allSettled(
    topSymbols.map((sym) => analyzeTrend(sym, 7))
  );
  const trendAnalyses = trendResults
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);

  // Lead-specific alerts
  let leadAlerts = [];
  if (leadSymbols.size > 0) {
    leadAlerts = await detectAlerts([...leadSymbols], leads);
  }

  return {
    date: new Date().toISOString().split('T')[0],
    brokerType,
    weekStart: getWeekStart(),
    weekEnd: new Date().toISOString().split('T')[0],
    marketOverview: {
      indices: dailyReport.indices,
      summary: dailyReport.summary,
    },
    topGainers: dailyReport.topGainers,
    topLosers: dailyReport.topLosers,
    trendAnalyses,
    leadAlerts,
    totalAlerts: dailyReport.alerts.length + leadAlerts.length,
  };
}

/**
 * Get the ISO date string for the start of the current week (Monday).
 */
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split('T')[0];
}
