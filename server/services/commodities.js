/**
 * Commodities Data Service
 *
 * Fetches commodity futures data via Yahoo Finance.
 * Symbols: GC=F (Gold), CL=F (Oil), NG=F (Nat Gas), SI=F (Silver),
 *          HG=F (Copper), PL=F (Platinum), PA=F (Palladium),
 *          ZW=F (Wheat), ZC=F (Corn), ZS=F (Soybeans), KC=F (Coffee)
 */

import { getQuote, getStockChart, getMultiQuote } from './yahooFinance.js';

/** Commodity symbol registry with metadata */
export const COMMODITY_SYMBOLS = {
  // Precious metals
  'GC=F':  { name: 'Gold',      category: 'edelmetalle', unit: 'USD/oz' },
  'SI=F':  { name: 'Silber',    category: 'edelmetalle', unit: 'USD/oz' },
  'PL=F':  { name: 'Platin',    category: 'edelmetalle', unit: 'USD/oz' },
  'PA=F':  { name: 'Palladium', category: 'edelmetalle', unit: 'USD/oz' },

  // Energy
  'CL=F':  { name: 'Rohoel (WTI)',  category: 'energie', unit: 'USD/bbl' },
  'BZ=F':  { name: 'Rohoel (Brent)', category: 'energie', unit: 'USD/bbl' },
  'NG=F':  { name: 'Erdgas',         category: 'energie', unit: 'USD/MMBtu' },
  'HO=F':  { name: 'Heizoel',        category: 'energie', unit: 'USD/gal' },

  // Industrial metals
  'HG=F':  { name: 'Kupfer',    category: 'industriemetalle', unit: 'USD/lb' },

  // Agriculture
  'ZW=F':  { name: 'Weizen',    category: 'agrar', unit: 'USc/bu' },
  'ZC=F':  { name: 'Mais',      category: 'agrar', unit: 'USc/bu' },
  'ZS=F':  { name: 'Sojabohnen', category: 'agrar', unit: 'USc/bu' },
  'KC=F':  { name: 'Kaffee',    category: 'agrar', unit: 'USc/lb' },
  'CT=F':  { name: 'Baumwolle', category: 'agrar', unit: 'USc/lb' },
};

/** All commodity ticker symbols */
export const ALL_COMMODITY_TICKERS = Object.keys(COMMODITY_SYMBOLS);

/**
 * Fetch quotes for all tracked commodities.
 * @returns {Promise<Array<object>>} Normalized commodity quotes with metadata
 */
export async function getCommodityOverview() {
  const quotes = await getMultiQuote(ALL_COMMODITY_TICKERS);

  return quotes.map((q) => {
    const meta = COMMODITY_SYMBOLS[q.symbol] || {};
    return {
      ...q,
      displayName: meta.name || q.name,
      category: meta.category || 'sonstige',
      unit: meta.unit || '',
    };
  });
}

/**
 * Fetch a single commodity quote with metadata.
 * @param {string} symbol - Futures symbol (e.g. "GC=F")
 * @returns {Promise<object>}
 */
export async function getCommodityQuote(symbol) {
  const quote = await getQuote(symbol);
  const meta = COMMODITY_SYMBOLS[symbol] || {};
  return {
    ...quote,
    displayName: meta.name || quote.name,
    category: meta.category || 'sonstige',
    unit: meta.unit || '',
  };
}

/**
 * Fetch OHLC chart data for a commodity.
 * @param {string} symbol - Futures symbol
 * @param {string} [range='6mo'] - Time range
 * @returns {Promise<Array>}
 */
export async function getCommodityChart(symbol, range = '6mo') {
  return getStockChart(symbol, range);
}

/**
 * Group commodity quotes by category.
 * @param {Array<object>} quotes - Commodity quotes from getCommodityOverview
 * @returns {Record<string, Array<object>>}
 */
export function groupByCategory(quotes) {
  const groups = {};
  for (const q of quotes) {
    const cat = q.category || 'sonstige';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(q);
  }
  return groups;
}
