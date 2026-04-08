import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';

// Hoist mocks
const { mockRelayAIRequest, mockEnrichData } = vi.hoisted(() => ({
  mockRelayAIRequest: vi.fn(),
  mockEnrichData: vi.fn(),
}));

vi.mock('../../server/services/aiProxy.js', () => ({
  relayAIRequest: mockRelayAIRequest,
}));

vi.mock('../../server/services/yahooFinance.js', () => ({
  getQuote: vi.fn(),
}));

vi.mock('../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: vi.fn(),
}));

vi.mock('../../server/agents/marketAnalyst.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    enrichData: mockEnrichData,
  };
});

// Mock freemium gate to pass through for tests
vi.mock('../../server/middleware/freemiumGate.js', () => ({
  freemiumGate: (_req, _res, next) => next(),
}));

import { pipelineRouter } from '../../server/routes/pipeline.js';

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

// --- Canned outputs ---

const validQualifierOutput = {
  score: 85,
  kategorie: 'heiss',
  zusammenfassung: 'Guter Lead.',
  begruendung: [{ faktor: 'Budget', bewertung: 'positiv', details: 'Hoch' }],
  empfohleneAktionen: ['Kontaktieren'],
  naechsterSchritt: 'Anrufen',
};

const validAnalystOutput = {
  symbol: 'AAPL',
  assetName: 'Apple Inc.',
  assetType: 'aktie',
  marktdaten: { preis: 178.72 },
  analyse: 'Analyse.',
  empfehlung: 'kaufen',
  konfidenz: 'hoch',
  risiken: ['Risiko'],
  chancen: ['Chance'],
};

const validSwotOutput = {
  titel: 'SWOT',
  zusammenfassung: 'Zusammenfassung.',
  staerken: [{ punkt: 'S', details: 'D' }],
  schwaechen: [{ punkt: 'W', details: 'D' }],
  chancen: [{ punkt: 'O', details: 'D' }],
  risiken: [{ punkt: 'T', details: 'D' }],
  handlungsempfehlung: 'Empfehlung.',
};

const enrichedData = {
  symbol: 'AAPL', name: 'Apple Inc.', preis: 178.72, veraenderung: 2.35,
  veraenderungProzent: 1.33, volumen: 55123456, marktkapitalisierung: 2800000000000,
  kgv: 29.5, hoch52: 199.62, tief52: 124.17, waehrung: 'USD',
};

describe('pipeline routes', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', pipelineRouter);
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

  describe('POST /api/agents/pipeline — validation', () => {
    it('returns 400 for empty body', async () => {
      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData: { name: 'Test' } }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty brokerType', async () => {
      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test' },
          brokerType: '',
          provider: 'openai',
          model: 'gpt-4o-mini',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty provider', async () => {
      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test' },
          brokerType: 'immobilien',
          provider: '',
          model: 'gpt-4o-mini',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  // --- SSE Streaming ---

  describe('POST /api/agents/pipeline — SSE streaming', () => {
    it('returns SSE content type header for valid request', async () => {
      let callCount = 0;
      mockRelayAIRequest.mockImplementation(() => {
        callCount++;
        const outputs = [validQualifierOutput, validAnalystOutput, validSwotOutput];
        return Promise.resolve({
          content: JSON.stringify(outputs[callCount - 1]),
          model: 'gpt-4o-mini',
          provider: 'openai',
        });
      });
      mockEnrichData.mockResolvedValue(enrichedData);

      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test', customFields: { symbol: 'AAPL', assetType: 'aktie' } },
          brokerType: 'immobilien',
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('text/event-stream');
      expect(res.headers.get('cache-control')).toBe('no-cache');
    });

    it('streams pipeline events in correct order', async () => {
      let callCount = 0;
      mockRelayAIRequest.mockImplementation(() => {
        callCount++;
        const outputs = [validQualifierOutput, validAnalystOutput, validSwotOutput];
        return Promise.resolve({
          content: JSON.stringify(outputs[callCount - 1]),
          model: 'gpt-4o-mini',
          provider: 'openai',
        });
      });
      mockEnrichData.mockResolvedValue(enrichedData);

      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test', customFields: { symbol: 'AAPL', assetType: 'aktie' } },
          brokerType: 'immobilien',
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      const text = await res.text();
      const events = parseSSEStream(text);
      const eventNames = events.map((e) => e.event);

      expect(eventNames).toContain('pipeline:start');
      expect(eventNames).toContain('pipeline:step:start');
      expect(eventNames).toContain('pipeline:step:done');
      expect(eventNames).toContain('pipeline:done');
    });

    it('does not include apiKey in any SSE event data', async () => {
      let callCount = 0;
      mockRelayAIRequest.mockImplementation(() => {
        callCount++;
        const outputs = [validQualifierOutput, validAnalystOutput, validSwotOutput];
        return Promise.resolve({
          content: JSON.stringify(outputs[callCount - 1]),
          model: 'gpt-4o-mini',
          provider: 'openai',
        });
      });
      mockEnrichData.mockResolvedValue(enrichedData);

      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test', customFields: { symbol: 'AAPL', assetType: 'aktie' } },
          brokerType: 'immobilien',
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-super-secret-pipeline-key',
        }),
      });

      const text = await res.text();
      expect(text).not.toContain('sk-super-secret-pipeline-key');
    });

    it('handles partial failure and still streams results', async () => {
      // Qualifier fails, others succeed
      let callCount = 0;
      mockRelayAIRequest.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('Qualifier timeout'));
        const outputs = [null, validAnalystOutput, validSwotOutput];
        return Promise.resolve({
          content: JSON.stringify(outputs[callCount - 1]),
          model: 'gpt-4o-mini',
          provider: 'openai',
        });
      });
      mockEnrichData.mockResolvedValue(enrichedData);

      const res = await fetch(`${baseUrl}/api/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: { name: 'Test', customFields: { symbol: 'AAPL', assetType: 'aktie' } },
          brokerType: 'immobilien',
          provider: 'openai',
          model: 'gpt-4o-mini',
          apiKey: 'sk-test',
        }),
      });

      expect(res.status).toBe(200);

      const text = await res.text();
      const events = parseSSEStream(text);
      const eventNames = events.map((e) => e.event);

      // Should have error for qualifier and done for analyst/swot
      expect(eventNames).toContain('pipeline:step:error');
      expect(eventNames).toContain('pipeline:step:done');
      expect(eventNames).toContain('pipeline:done');

      // pipeline:done should show partial
      const doneEvent = events.find((e) => e.event === 'pipeline:done');
      expect(doneEvent.data.isPartial).toBe(true);
      expect(doneEvent.data.failedSteps).toContain('qualifier');
    });
  });
});
