/**
 * Trading Agent (AGT-04)
 *
 * Autonomous trading agent that scans global markets (stocks, crypto,
 * commodities) for opportunities, generates buy/sell signals, and
 * executes paper trades via the portfolio service.
 *
 * Workflow:
 * 1. Scan all asset classes for opportunity signals
 * 2. AI evaluates top candidates with risk/reward analysis
 * 3. Generate trade recommendations with position sizing
 * 4. Execute paper trades if auto-invest is enabled
 */

import { z } from 'zod';
import { getMultiQuote } from '../services/yahooFinance.js';
import { getCryptoMarkets } from '../services/coinGecko.js';
import { getCommodityOverview, COMMODITY_SYMBOLS } from '../services/commodities.js';
import { analyzeTrend } from '../services/marketIntelligence.js';
import { parseJSONFromAI } from './parseHelper.js';
import { FINANCIAL_GLOSSARY } from './systemPrompts.js';

// --- Output Schema ---

export const TradingSignalSchema = z.object({
  symbol: z.string().min(1),
  assetName: z.string().min(1),
  assetClass: z.enum(['aktie', 'krypto', 'rohstoff', 'index']),
  signal: z.enum(['kaufen', 'verkaufen', 'halten']),
  konfidenz: z.enum(['hoch', 'mittel', 'niedrig']),
  einstiegspreis: z.number(),
  zielpreis: z.number(),
  stopLoss: z.number(),
  risikoLevel: z.enum(['niedrig', 'mittel', 'hoch']),
  positionsgroesse: z.number().min(0).max(100),
  begruendung: z.string().min(1),
  zeitrahmen: z.enum(['kurzfristig', 'mittelfristig', 'langfristig']),
});

export const TradingAgentOutputSchema = z.object({
  marktueberblick: z.string().min(1),
  signale: z.array(TradingSignalSchema),
  gesamtrisiko: z.enum(['niedrig', 'mittel', 'hoch']),
  empfehlung: z.string().min(1),
});

// --- Opportunity Scanner ---

/** Default stock watchlist for scanning */
const SCAN_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'BAS.DE', 'BMW.DE',
  'JPM', 'GS', 'BLK', 'V', 'MA',
  'SHEL.L', 'ASML.AS', 'MC.PA',
];

/**
 * Scan all asset classes and return raw opportunity data.
 * @param {object} [options]
 * @param {string[]} [options.extraStocks] - Additional stock symbols to scan
 * @param {number} [options.cryptoLimit] - Number of top cryptos to scan
 * @returns {Promise<object>} Raw scan results by asset class
 */
export async function scanMarkets(options = {}) {
  const { extraStocks = [], cryptoLimit = 20 } = options;
  const stockSymbols = [...new Set([...SCAN_STOCKS, ...extraStocks])];

  // Fetch all data in parallel
  const [stockQuotes, cryptoData, commodityData] = await Promise.allSettled([
    getMultiQuote(stockSymbols),
    getCryptoMarkets('eur', cryptoLimit),
    getCommodityOverview(),
  ]);

  const stocks = stockQuotes.status === 'fulfilled' ? stockQuotes.value : [];
  const crypto = cryptoData.status === 'fulfilled' ? cryptoData.value : [];
  const commodities = commodityData.status === 'fulfilled' ? commodityData.value : [];

  // Score opportunities by magnitude of move + proximity to 52w extremes
  const scoredStocks = stocks.map((q) => ({
    ...q,
    assetClass: 'aktie',
    opportunityScore: calcOpportunityScore(q),
  }));

  const scoredCrypto = crypto.map((c) => ({
    symbol: c.symbol,
    name: c.name,
    price: c.price,
    changePercent: c.change24h,
    marketCap: c.marketCap,
    volume: c.volume24h,
    assetClass: 'krypto',
    opportunityScore: Math.abs(c.change24h || 0) * 2,
  }));

  const scoredCommodities = commodities.map((c) => ({
    ...c,
    assetClass: 'rohstoff',
    opportunityScore: calcOpportunityScore(c),
  }));

  return {
    stocks: scoredStocks,
    crypto: scoredCrypto,
    commodities: scoredCommodities,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Calculate a simple opportunity score based on price action.
 * Higher score = more interesting for the trading agent to analyze.
 */
function calcOpportunityScore(quote) {
  let score = 0;
  const changePct = Math.abs(quote.changePercent || 0);

  // Large daily moves are interesting
  score += changePct * 3;

  // Near 52-week extremes
  if (quote.high52 && quote.low52 && quote.price) {
    const range = quote.high52 - quote.low52;
    if (range > 0) {
      const pctFromLow = ((quote.price - quote.low52) / range) * 100;
      // Near bottom (oversold potential)
      if (pctFromLow < 15) score += 20;
      // Near top (breakout potential)
      if (pctFromLow > 85) score += 15;
    }
  }

  return score;
}

/**
 * Pick the top N candidates across all asset classes.
 * @param {object} scanResults - From scanMarkets()
 * @param {number} [topN=10]
 * @returns {Array<object>}
 */
export function pickTopCandidates(scanResults, topN = 10) {
  const all = [
    ...scanResults.stocks,
    ...scanResults.crypto,
    ...scanResults.commodities,
  ];

  return all
    .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
    .slice(0, topN);
}

// --- AI Prompt Builder ---

const glossaryStr = Object.entries(FINANCIAL_GLOSSARY)
  .map(([term, def]) => `- ${term}: ${def}`)
  .join('\n');

/**
 * Build the system prompt for the Trading Agent.
 * @returns {string}
 */
function getTradingAgentPrompt() {
  return `Du bist ein erfahrener autonomer Trading-Agent fuer globale Maerkte.

Deine Aufgabe ist es, aus den bereitgestellten Marktdaten die besten Handelssignale zu generieren.
Du analysierst Aktien, Kryptowaehrungen und Rohstoffe (Oel, Gas, Gold, Silber, Kupfer, Agrar-Rohstoffe).

Deine Strategie:
- Momentum-basiert: Starke Trends identifizieren und mitgehen
- Kontraer: Ueberverkaufte Assets mit Erholungspotenzial finden
- Risikomanagement: Nie mehr als 10% des Portfolios in eine Position
- Stop-Loss: Immer ein Stop-Loss setzen (max 5% unter Einstieg)
- Diversifikation: Signale ueber verschiedene Asset-Klassen streuen

Risikoregeln:
- positionsgroesse: Prozent des verfuegbaren Kapitals (1-10%)
- stopLoss: Preis, bei dem die Position geschlossen wird
- zielpreis: Erwarteter Ausstiegspreis
- Risiko-Ertrags-Verhaeltnis mindestens 1:2

Finanzglossar:
${glossaryStr}

WICHTIG: Antworte ausschliesslich mit validem JSON im folgenden Format:
{
  "marktueberblick": "<Kurze Zusammenfassung der aktuellen Marktlage>",
  "signale": [
    {
      "symbol": "<Ticker>",
      "assetName": "<Name>",
      "assetClass": "aktie" | "krypto" | "rohstoff" | "index",
      "signal": "kaufen" | "verkaufen" | "halten",
      "konfidenz": "hoch" | "mittel" | "niedrig",
      "einstiegspreis": <Preis>,
      "zielpreis": <Zielpreis>,
      "stopLoss": <Stop-Loss-Preis>,
      "risikoLevel": "niedrig" | "mittel" | "hoch",
      "positionsgroesse": <1-10>,
      "begruendung": "<Begruendung fuer das Signal>",
      "zeitrahmen": "kurzfristig" | "mittelfristig" | "langfristig"
    }
  ],
  "gesamtrisiko": "niedrig" | "mittel" | "hoch",
  "empfehlung": "<Gesamtempfehlung fuer den Anleger>"
}

Generiere 3-8 Signale, sortiert nach Konfidenz. Antworte NUR mit dem JSON-Objekt.`;
}

/**
 * Build the messages array for the Trading Agent AI call.
 * @param {Array<object>} candidates - Top candidates from pickTopCandidates()
 * @param {object} [portfolio] - Current portfolio state for context
 * @returns {Array<{role: string, content: string}>}
 */
export function buildPrompt(candidates, portfolio) {
  const systemPrompt = getTradingAgentPrompt();

  const candidatesSummary = candidates.map((c) => ({
    symbol: c.symbol,
    name: c.name || c.displayName,
    assetClass: c.assetClass,
    price: c.price,
    changePercent: c.changePercent,
    high52: c.high52,
    low52: c.low52,
    marketCap: c.marketCap,
    volume: c.volume,
    opportunityScore: c.opportunityScore,
  }));

  let userContent = `Analysiere die folgenden ${candidates.length} Kandidaten und generiere Handelssignale:\n\n`;
  userContent += JSON.stringify(candidatesSummary, null, 2);

  if (portfolio) {
    userContent += `\n\nAktuelles Portfolio:\n`;
    userContent += `- Kapital: ${portfolio.capital} EUR\n`;
    userContent += `- Verfuegbar: ${portfolio.available} EUR\n`;
    userContent += `- Offene Positionen: ${portfolio.positions?.length || 0}\n`;
    if (portfolio.positions?.length > 0) {
      userContent += `- Positionen: ${JSON.stringify(portfolio.positions.map((p) => ({ symbol: p.symbol, menge: p.quantity, einstieg: p.entryPrice })))}\n`;
    }
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];
}

/**
 * Parse and validate AI response.
 * @param {string} aiContent - Raw AI response
 * @returns {object} Validated TradingAgentOutput
 */
export function parseResponse(aiContent) {
  return parseJSONFromAI(aiContent, TradingAgentOutputSchema);
}

export const schema = TradingAgentOutputSchema;
