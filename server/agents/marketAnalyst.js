/**
 * Market Analyst Agent (AGT-02)
 *
 * Analyzes market assets (stocks, crypto) by enriching prompts
 * with live data from Yahoo Finance or CoinGecko before calling AI.
 */

import { MarketAnalystOutputSchema } from '../../shared/agentSchemas.js';
import { getMarketAnalystPrompt } from './systemPrompts.js';
import { parseJSONFromAI } from './parseHelper.js';
import { getQuote } from '../services/yahooFinance.js';
import { getCryptoMarkets } from '../services/coinGecko.js';

/**
 * Enrich data by fetching live market information.
 * @param {{ symbol: string, assetType: 'aktie' | 'krypto' }} params
 * @returns {Promise<object>} Normalized market data
 */
export async function enrichData({ symbol, assetType }) {
  if (assetType === 'aktie') {
    const quote = await getQuote(symbol);
    return {
      symbol: quote.symbol,
      name: quote.name,
      preis: quote.price,
      veraenderung: quote.change,
      veraenderungProzent: quote.changePercent,
      volumen: quote.volume,
      marktkapitalisierung: quote.marketCap,
      kgv: quote.peRatio,
      hoch52: quote.high52,
      tief52: quote.low52,
      waehrung: quote.currency,
    };
  }

  if (assetType === 'krypto') {
    const markets = await getCryptoMarkets('eur', 50);
    const coin = markets.find(
      (c) =>
        c.id === symbol.toLowerCase() ||
        c.symbol === symbol.toUpperCase()
    );

    if (!coin) {
      throw new Error(`Kryptowaehrung "${symbol}" nicht gefunden`);
    }

    return {
      symbol: coin.symbol,
      name: coin.name,
      preis: coin.price,
      veraenderung24h: coin.change24h,
      marktkapitalisierung: coin.marketCap,
      volumen24h: coin.volume24h,
      rang: coin.rank,
    };
  }

  throw new Error(`Unbekannter Asset-Typ: ${assetType}`);
}

/**
 * Build the messages array for the Market Analyst AI call.
 * @param {{ symbol: string, assetType: string, query?: string }} params - Query parameters
 * @param {object} marketData - Enriched market data from enrichData()
 * @returns {Array<{role: string, content: string}>}
 */
export function buildPrompt({ symbol, assetType, query }, marketData) {
  const systemPrompt = getMarketAnalystPrompt(assetType);

  const userContent = [
    `Bitte erstelle eine Marktanalyse fuer ${symbol}.`,
    query ? `\nZusaetzliche Frage: ${query}` : '',
    `\nAktuelle Marktdaten:\n${JSON.stringify(marketData, null, 2)}`,
  ].join('');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];
}

/**
 * Parse and validate AI response for Market Analyst.
 * @param {string} aiContent - Raw AI response content
 * @returns {object} Validated MarketAnalystOutput
 */
export function parseResponse(aiContent) {
  return parseJSONFromAI(aiContent, MarketAnalystOutputSchema);
}

export const schema = MarketAnalystOutputSchema;
