import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';

// Hoist mocks
const { mockRelayAIRequest, mockGetQuote, mockGetCryptoMarkets } = vi.hoisted(() => ({
  mockRelayAIRequest: vi.fn(),
  mockGetQuote: vi.fn(),
  mockGetCryptoMarkets: vi.fn(),
}));

vi.mock('../../server/services/aiProxy.js', () => ({
  relayAIRequest: mockRelayAIRequest,
}));

vi.mock('../../server/services/yahooFinance.js', () => ({
  getQuote: mockGetQuote,
}));

vi.mock('../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: mockGetCryptoMarkets,
}));

// Mock freemium gate to pass through for tests
vi.mock('../../server/middleware/freemiumGate.js', () => ({
  freemiumGate: (_req, _res, next) => next(),
}));

import { agentRouter } from '../../server/routes/agents.js';

// --- Helpers ---

function parseSSEStream(text) {
  const events = [];
  const blocks = text.split('\n\n').filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n');
    const eventLine = lines.find((l) => l.startsWith('event: '));
    const dataLine = lines.find((l) => l.startsWith('data: '));
    if (eventLine && dataLine) {
      events.push({
        event: eventLine.replace('event: ', ''),
        data: JSON.parse(dataLine.replace('data: ', '')),
      });
    }
  }
  return events;
}

describe('agent routes', () => {
  let server;
  let baseUrl;

  const validLeadQualifierOutput = {
    score: 80,
    kategorie: 'warm',
    zusammenfassung: 'Guter Lead.',
    begruendung: [{ faktor: 'Budget', bewertung: 'positiv', details: 'Solides Budget' }],
    empfohleneAktionen: ['Kontaktieren'],
    naechsterSchritt: 'Anrufen',
  };

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', agentRouter);
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Validation ---

  describe('POST /api/agents/run — validation', () => {
    it('returns 400 for invalid agentType', async () => {
      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'invalidAgent',
          payload: {},
          provider: 'openai',
          model: 'gpt-4o-mini',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'leadQualifier' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty provider', async () => {
      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'leadQualifier',
          payload: {},
          provider: '',
          model: 'gpt-4o-mini',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  // --- SSE Streaming ---

  describe('POST /api/agents/run — SSE streaming', () => {
    it('returns SSE content type and streams events for leadQualifier', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
        usage: { inputTokens: 500, outputTokens: 200 },
      });

      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'leadQualifier',
          payload: {
            leadData: { name: 'Test Lead', email: 'test@test.com' },
            brokerType: 'immobilien',
          },
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('text/event-stream');
      expect(res.headers.get('cache-control')).toBe('no-cache');

      const text = await res.text();
      const events = parseSSEStream(text);

      // Check event sequence
      const eventNames = events.map((e) => e.event);
      expect(eventNames).toContain('connected');
      expect(eventNames).toContain('agent:start');
      expect(eventNames).toContain('agent:thinking');
      expect(eventNames).toContain('agent:result');
      expect(eventNames).toContain('agent:done');
    });

    it('includes runId in connected event', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'leadQualifier',
          payload: { leadData: { name: 'Test' }, brokerType: 'immobilien' },
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      const text = await res.text();
      const events = parseSSEStream(text);
      const connected = events.find((e) => e.event === 'connected');
      expect(connected.data.runId).toBeDefined();
      expect(typeof connected.data.runId).toBe('string');
    });

    it('streams agent:error event when AI call fails', async () => {
      mockRelayAIRequest.mockRejectedValue(new Error('Provider error'));

      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'leadQualifier',
          payload: { leadData: { name: 'Test' }, brokerType: 'immobilien' },
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      expect(res.status).toBe(200); // SSE always starts with 200

      const text = await res.text();
      const events = parseSSEStream(text);
      const errorEvent = events.find((e) => e.event === 'agent:error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.message).toBe('Provider error');
    });

    it('includes enriching events for marketAnalyst', async () => {
      mockGetQuote.mockResolvedValue({
        symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 2.35,
        changePercent: 1.33, volume: 55123456, marketCap: 2800000000000,
        peRatio: 29.5, high52: 199.62, low52: 124.17, currency: 'USD',
      });

      const marketOutput = {
        symbol: 'AAPL',
        assetName: 'Apple Inc.',
        assetType: 'aktie',
        marktdaten: { preis: 178.72, veraenderung24h: 1.33, marktkapitalisierung: 2800000000000, kgv: 29.5 },
        analyse: 'Analyse.',
        empfehlung: 'kaufen',
        konfidenz: 'hoch',
        risiken: ['Risiko'],
        chancen: ['Chance'],
      };

      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(marketOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'marketAnalyst',
          payload: { symbol: 'AAPL', assetType: 'aktie' },
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      const text = await res.text();
      const events = parseSSEStream(text);
      const eventNames = events.map((e) => e.event);
      expect(eventNames).toContain('agent:enriching');
    });

    it('does not include apiKey in any SSE event data', async () => {
      mockRelayAIRequest.mockResolvedValue({
        content: JSON.stringify(validLeadQualifierOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

      const res = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'leadQualifier',
          payload: { leadData: { name: 'Test' }, brokerType: 'immobilien' },
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-super-secret-key',
        }),
      });

      const text = await res.text();
      expect(text).not.toContain('sk-super-secret-key');
    });
  });

  // --- AgentRunRequestSchema validation ---

  describe('AgentRunRequestSchema edge cases', () => {
    it('accepts all valid agent types', async () => {
      for (const agentType of ['leadQualifier', 'marketAnalyst', 'swotStrategist']) {
        // Mock based on agent type
        if (agentType === 'marketAnalyst') {
          mockGetQuote.mockResolvedValue({
            symbol: 'AAPL', name: 'Apple', price: 100, change: 1,
            changePercent: 1, volume: 1000, marketCap: 1000000,
            peRatio: 20, high52: 150, low52: 80, currency: 'USD',
          });
        }

        mockRelayAIRequest.mockResolvedValue({
          content: JSON.stringify(
            agentType === 'leadQualifier'
              ? validLeadQualifierOutput
              : agentType === 'marketAnalyst'
                ? {
                    symbol: 'AAPL', assetName: 'Apple', assetType: 'aktie',
                    marktdaten: { preis: 100 }, analyse: 'Test.',
                    empfehlung: 'halten', konfidenz: 'mittel',
                    risiken: ['r'], chancen: ['c'],
                  }
                : {
                    titel: 'SWOT', zusammenfassung: 'Test.',
                    staerken: [{ punkt: 'S', details: 'D' }],
                    schwaechen: [{ punkt: 'W', details: 'D' }],
                    chancen: [{ punkt: 'O', details: 'D' }],
                    risiken: [{ punkt: 'T', details: 'D' }],
                    handlungsempfehlung: 'E.',
                  }
          ),
          model: 'gpt-4o-mini',
          provider: 'openai',
        });

        const payload =
          agentType === 'leadQualifier'
            ? { leadData: { name: 'Test' }, brokerType: 'immobilien' }
            : agentType === 'marketAnalyst'
              ? { symbol: 'AAPL', assetType: 'aktie' }
              : { dealData: { name: 'Test' }, brokerType: 'immobilien' };

        const res = await fetch(`${baseUrl}/api/agents/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType,
            payload,
            provider: 'openai',
            model: 'gpt-4o-mini',
            apiKey: 'sk-test',
          }),
        });

        expect(res.status).toBe(200);
      }
    });
  });
});
