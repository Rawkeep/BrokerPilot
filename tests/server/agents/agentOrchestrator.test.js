import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks
const { mockRelayAIRequest, mockGetQuote, mockGetCryptoMarkets } = vi.hoisted(() => ({
  mockRelayAIRequest: vi.fn(),
  mockGetQuote: vi.fn(),
  mockGetCryptoMarkets: vi.fn(),
}));

vi.mock('../../../server/services/aiProxy.js', () => ({
  relayAIRequest: mockRelayAIRequest,
}));

vi.mock('../../../server/services/yahooFinance.js', () => ({
  getQuote: mockGetQuote,
}));

vi.mock('../../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: mockGetCryptoMarkets,
}));

import { runAgent } from '../../../server/agents/agentOrchestrator.js';

// --- Test Data ---

const validLeadQualifierOutput = {
  score: 80,
  kategorie: 'warm',
  zusammenfassung: 'Guter Lead.',
  begruendung: [{ faktor: 'Budget', bewertung: 'positiv', details: 'Solides Budget' }],
  empfohleneAktionen: ['Kontaktieren'],
  naechsterSchritt: 'Anrufen',
};

const validMarketAnalystOutput = {
  symbol: 'AAPL',
  assetName: 'Apple Inc.',
  assetType: 'aktie',
  marktdaten: { preis: 178.72, veraenderung24h: 1.33, marktkapitalisierung: 2800000000000, kgv: 29.5 },
  analyse: 'Starke Fundamentaldaten.',
  empfehlung: 'kaufen',
  konfidenz: 'hoch',
  risiken: ['Bewertung'],
  chancen: ['AI-Wachstum'],
};

const validSwotOutput = {
  titel: 'SWOT-Analyse',
  zusammenfassung: 'Zusammenfassung.',
  staerken: [{ punkt: 'Staerke', details: 'Details' }],
  schwaechen: [{ punkt: 'Schwaeche', details: 'Details' }],
  chancen: [{ punkt: 'Chance', details: 'Details' }],
  risiken: [{ punkt: 'Risiko', details: 'Details' }],
  handlungsempfehlung: 'Empfehlung.',
};

const aiConfig = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test-key' };

describe('agentOrchestrator.runAgent', () => {
  let emittedEvents;
  let emit;

  beforeEach(() => {
    vi.clearAllMocks();
    emittedEvents = [];
    emit = (type, data) => emittedEvents.push({ type, data });
  });

  // --- Lead Qualifier ---

  describe('leadQualifier', () => {
    it('emits correct event sequence: start -> thinking -> result -> done', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
        usage: { inputTokens: 500, outputTokens: 200 },
      });

      const payload = {
        leadData: { name: 'Test Lead', email: 'test@example.com', dealValue: 100000 },
        brokerType: 'immobilien',
      };

      const result = await runAgent('leadQualifier', payload, aiConfig, emit);

      expect(result.score).toBe(80);

      const eventTypes = emittedEvents.map((e) => e.type);
      expect(eventTypes).toEqual([
        'agent:start',
        'agent:thinking',
        'agent:result',
        'agent:done',
      ]);
    });

    it('emits agent:start with agentType', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      await runAgent(
        'leadQualifier',
        { leadData: { name: 'Test' }, brokerType: 'immobilien' },
        aiConfig,
        emit
      );

      expect(emittedEvents[0].data.agentType).toBe('leadQualifier');
    });

    it('includes result output and model info in agent:result event', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
        usage: { inputTokens: 500, outputTokens: 200 },
      });

      await runAgent(
        'leadQualifier',
        { leadData: { name: 'Test' }, brokerType: 'immobilien' },
        aiConfig,
        emit
      );

      const resultEvent = emittedEvents.find((e) => e.type === 'agent:result');
      expect(resultEvent.data.output.score).toBe(80);
      expect(resultEvent.data.model).toBe('gpt-4o-mini');
      expect(resultEvent.data.provider).toBe('openai');
    });

    it('includes duration in agent:done event', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      await runAgent(
        'leadQualifier',
        { leadData: { name: 'Test' }, brokerType: 'immobilien' },
        aiConfig,
        emit
      );

      const doneEvent = emittedEvents.find((e) => e.type === 'agent:done');
      expect(typeof doneEvent.data.duration).toBe('number');
      expect(doneEvent.data.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // --- Market Analyst ---

  describe('marketAnalyst', () => {
    it('emits enriching events before thinking (stock)', async () => {
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

      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validMarketAnalystOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      const payload = { symbol: 'AAPL', assetType: 'aktie' };
      await runAgent('marketAnalyst', payload, aiConfig, emit);

      const eventTypes = emittedEvents.map((e) => e.type);
      expect(eventTypes).toContain('agent:enriching');

      const enrichIdx = eventTypes.indexOf('agent:enriching');
      const thinkIdx = eventTypes.indexOf('agent:thinking');
      expect(enrichIdx).toBeLessThan(thinkIdx);
    });

    it('calls getQuote for stock enrichment', async () => {
      mockGetQuote.mockResolvedValue({
        symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.35,
        changePercent: 1.33, volume: 55123456, marketCap: 2800000000000,
        peRatio: 29.5, high52: 199.62, low52: 124.17, currency: 'USD',
      });

      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validMarketAnalystOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      await runAgent('marketAnalyst', { symbol: 'AAPL', assetType: 'aktie' }, aiConfig, emit);
      expect(mockGetQuote).toHaveBeenCalledWith('AAPL');
    });

    it('calls getCryptoMarkets for crypto enrichment', async () => {
      mockGetCryptoMarkets.mockResolvedValue([
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62345, change24h: 2.45, marketCap: 1200000000000, volume24h: 30000000000, rank: 1 },
      ]);

      const cryptoOutput = {
        ...validMarketAnalystOutput,
        symbol: 'BTC',
        assetName: 'Bitcoin',
        assetType: 'krypto',
      };

      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(cryptoOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      await runAgent('marketAnalyst', { symbol: 'bitcoin', assetType: 'krypto' }, aiConfig, emit);
      expect(mockGetCryptoMarkets).toHaveBeenCalledWith('eur', 50);
    });
  });

  // --- SWOT Strategist ---

  describe('swotStrategist', () => {
    it('emits correct event sequence without enriching', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validSwotOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      const payload = {
        dealData: { name: 'Test Deal', company: 'Test GmbH', dealValue: 500000 },
        brokerType: 'immobilien',
      };

      await runAgent('swotStrategist', payload, aiConfig, emit);

      const eventTypes = emittedEvents.map((e) => e.type);
      expect(eventTypes).toEqual([
        'agent:start',
        'agent:thinking',
        'agent:result',
        'agent:done',
      ]);
      // No enriching event for SWOT
      expect(eventTypes).not.toContain('agent:enriching');
    });
  });

  // --- Error Handling ---

  describe('error handling', () => {
    it('emits agent:error when AI call fails', async () => {
      mockRelayAIRequest.mockRejectedValue(new Error('Provider timeout'));

      const payload = {
        leadData: { name: 'Test' },
        brokerType: 'immobilien',
      };

      await expect(runAgent('leadQualifier', payload, aiConfig, emit)).rejects.toThrow(
        'Provider timeout'
      );

      const errorEvent = emittedEvents.find((e) => e.type === 'agent:error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.message).toBe('Provider timeout');
    });

    it('emits agent:error when output validation fails', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify({ invalid: 'output' }),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      await expect(
        runAgent(
          'leadQualifier',
          { leadData: { name: 'Test' }, brokerType: 'immobilien' },
          aiConfig,
          emit
        )
      ).rejects.toThrow();

      const errorEvent = emittedEvents.find((e) => e.type === 'agent:error');
      expect(errorEvent).toBeDefined();
    });

    it('throws for unknown agent type', async () => {
      await expect(runAgent('unknown', {}, aiConfig, emit)).rejects.toThrow(
        'Unknown agent type'
      );
    });

    it('includes duration in error event', async () => {
      mockRelayAIRequest.mockRejectedValue(new Error('Fail'));

      await expect(
        runAgent(
          'leadQualifier',
          { leadData: { name: 'Test' }, brokerType: 'immobilien' },
          aiConfig,
          emit
        )
      ).rejects.toThrow();

      const errorEvent = emittedEvents.find((e) => e.type === 'agent:error');
      expect(typeof errorEvent.data.duration).toBe('number');
    });
  });
});
