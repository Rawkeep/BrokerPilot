import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAnalystOutputSchema } from '../../../shared/agentSchemas.js';
import { FINANCIAL_GLOSSARY } from '../../../server/agents/systemPrompts.js';

// Hoist mocks
const { mockGetQuote, mockGetCryptoMarkets } = vi.hoisted(() => ({
  mockGetQuote: vi.fn(),
  mockGetCryptoMarkets: vi.fn(),
}));

vi.mock('../../../server/services/yahooFinance.js', () => ({
  getQuote: mockGetQuote,
}));

vi.mock('../../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: mockGetCryptoMarkets,
}));

import { enrichData, buildPrompt, parseResponse } from '../../../server/agents/marketAnalyst.js';

// --- Schema Validation Tests ---

describe('MarketAnalystOutputSchema', () => {
  const validOutput = {
    symbol: 'AAPL',
    assetName: 'Apple Inc.',
    assetType: 'aktie',
    marktdaten: {
      preis: 178.72,
      veraenderung24h: 2.35,
      marktkapitalisierung: 2800000000000,
      kgv: 29.5,
    },
    analyse: 'Apple zeigt eine starke Marktposition mit soliden Fundamentaldaten.',
    empfehlung: 'kaufen',
    konfidenz: 'hoch',
    risiken: ['Hohe Bewertung', 'Regulatorische Risiken in China'],
    chancen: ['Starkes Servicegeschaeft', 'AI-Integration'],
  };

  it('parses valid output successfully', () => {
    const result = MarketAnalystOutputSchema.parse(validOutput);
    expect(result.symbol).toBe('AAPL');
    expect(result.empfehlung).toBe('kaufen');
    expect(result.konfidenz).toBe('hoch');
  });

  it('accepts all valid empfehlung values', () => {
    for (const emp of ['kaufen', 'halten', 'verkaufen']) {
      const result = MarketAnalystOutputSchema.parse({ ...validOutput, empfehlung: emp });
      expect(result.empfehlung).toBe(emp);
    }
  });

  it('accepts all valid konfidenz values', () => {
    for (const k of ['hoch', 'mittel', 'niedrig']) {
      const result = MarketAnalystOutputSchema.parse({ ...validOutput, konfidenz: k });
      expect(result.konfidenz).toBe(k);
    }
  });

  it('accepts all valid assetType values', () => {
    for (const t of ['aktie', 'krypto', 'immobilie']) {
      const result = MarketAnalystOutputSchema.parse({ ...validOutput, assetType: t });
      expect(result.assetType).toBe(t);
    }
  });

  it('rejects invalid empfehlung', () => {
    expect(() =>
      MarketAnalystOutputSchema.parse({ ...validOutput, empfehlung: 'warten' })
    ).toThrow();
  });

  it('accepts optional marktdaten fields', () => {
    const result = MarketAnalystOutputSchema.parse({
      ...validOutput,
      marktdaten: { preis: 100 },
    });
    expect(result.marktdaten.preis).toBe(100);
    expect(result.marktdaten.kgv).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    expect(() =>
      MarketAnalystOutputSchema.parse({ symbol: 'AAPL' })
    ).toThrow();
  });
});

// --- Data Enrichment Tests ---

describe('marketAnalyst.enrichData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getQuote for aktie type and returns normalized data', async () => {
    mockGetQuote.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 178.72,
      change: 2.35,
      changePercent: 1.33,
      volume: 55123456,
      marketCap: 2800000000000,
      peRatio: 29.5,
      high52: 199.62,
      low52: 124.17,
      currency: 'USD',
    });

    const data = await enrichData({ symbol: 'AAPL', assetType: 'aktie' });

    expect(mockGetQuote).toHaveBeenCalledWith('AAPL');
    expect(data.symbol).toBe('AAPL');
    expect(data.name).toBe('Apple Inc.');
    expect(data.preis).toBe(178.72);
    expect(data.marktkapitalisierung).toBe(2800000000000);
    expect(data.kgv).toBe(29.5);
  });

  it('calls getCryptoMarkets for krypto type and filters for the coin', async () => {
    mockGetCryptoMarkets.mockResolvedValue([
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62345, change24h: 2.45, marketCap: 1200000000000, volume24h: 30000000000, rank: 1 },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3456, change24h: -1.23, marketCap: 400000000000, volume24h: 15000000000, rank: 2 },
    ]);

    const data = await enrichData({ symbol: 'bitcoin', assetType: 'krypto' });

    expect(mockGetCryptoMarkets).toHaveBeenCalledWith('eur', 50);
    expect(data.name).toBe('Bitcoin');
    expect(data.preis).toBe(62345);
    expect(data.veraenderung24h).toBe(2.45);
  });

  it('matches crypto by uppercase symbol', async () => {
    mockGetCryptoMarkets.mockResolvedValue([
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62345, change24h: 2.45, marketCap: 1200000000000, volume24h: 30000000000, rank: 1 },
    ]);

    const data = await enrichData({ symbol: 'BTC', assetType: 'krypto' });
    expect(data.name).toBe('Bitcoin');
  });

  it('throws when crypto coin is not found', async () => {
    mockGetCryptoMarkets.mockResolvedValue([
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62345, change24h: 2.45, marketCap: 1200000000000, volume24h: 30000000000, rank: 1 },
    ]);

    await expect(
      enrichData({ symbol: 'nonexistent', assetType: 'krypto' })
    ).rejects.toThrow('nicht gefunden');
  });

  it('throws for unknown asset type', async () => {
    await expect(
      enrichData({ symbol: 'TEST', assetType: 'unknown' })
    ).rejects.toThrow('Unbekannter Asset-Typ');
  });
});

// --- Prompt Building Tests ---

describe('marketAnalyst.buildPrompt', () => {
  const mockMarketData = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    preis: 178.72,
    marktkapitalisierung: 2800000000000,
  };

  it('returns messages array with system and user roles', () => {
    const messages = buildPrompt(
      { symbol: 'AAPL', assetType: 'aktie' },
      mockMarketData
    );
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('includes asset type in system prompt', () => {
    const messages = buildPrompt(
      { symbol: 'AAPL', assetType: 'aktie' },
      mockMarketData
    );
    expect(messages[0].content).toContain('Aktien');
  });

  it('uses Kryptowaehrungen for krypto type', () => {
    const messages = buildPrompt(
      { symbol: 'BTC', assetType: 'krypto' },
      mockMarketData
    );
    expect(messages[0].content).toContain('Kryptowaehrungen');
  });

  it('includes market data in user message', () => {
    const messages = buildPrompt(
      { symbol: 'AAPL', assetType: 'aktie' },
      mockMarketData
    );
    expect(messages[1].content).toContain('178.72');
    expect(messages[1].content).toContain('AAPL');
  });

  it('includes optional query in user message', () => {
    const messages = buildPrompt(
      { symbol: 'AAPL', assetType: 'aktie', query: 'Ist jetzt ein guter Zeitpunkt?' },
      mockMarketData
    );
    expect(messages[1].content).toContain('Ist jetzt ein guter Zeitpunkt?');
  });

  it('includes financial glossary in system prompt', () => {
    const messages = buildPrompt(
      { symbol: 'AAPL', assetType: 'aktie' },
      mockMarketData
    );
    for (const term of Object.keys(FINANCIAL_GLOSSARY)) {
      expect(messages[0].content).toContain(term);
    }
  });
});

// --- Response Parsing Tests ---

describe('marketAnalyst.parseResponse', () => {
  const validJSON = JSON.stringify({
    symbol: 'AAPL',
    assetName: 'Apple Inc.',
    assetType: 'aktie',
    marktdaten: { preis: 178.72, veraenderung24h: 1.33, marktkapitalisierung: 2800000000000, kgv: 29.5 },
    analyse: 'Solide Fundamentaldaten.',
    empfehlung: 'halten',
    konfidenz: 'mittel',
    risiken: ['Bewertungsrisiko'],
    chancen: ['AI-Wachstum'],
  });

  it('parses valid JSON response', () => {
    const result = parseResponse(validJSON);
    expect(result.symbol).toBe('AAPL');
    expect(result.empfehlung).toBe('halten');
  });

  it('handles markdown code fences', () => {
    const wrapped = '```json\n' + validJSON + '\n```';
    const result = parseResponse(wrapped);
    expect(result.symbol).toBe('AAPL');
  });

  it('throws on invalid response', () => {
    expect(() => parseResponse('invalid')).toThrow();
  });
});
