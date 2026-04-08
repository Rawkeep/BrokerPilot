import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import express from 'express';

// Mock relayAIRequest before importing the route
vi.mock('../../server/services/aiProxy.js', () => ({
  relayAIRequest: vi.fn(),
  AIResponseSchema: {
    parse: (v) => v,
  },
}));

// Import after mock setup
const { relayAIRequest } = await import('../../server/services/aiProxy.js');
const { aiRouter } = await import('../../server/routes/ai.js');
const { _resetCounters } = await import(
  '../../server/middleware/freemiumGate.js'
);

describe('POST /api/ai/chat', () => {
  let server;
  let baseUrl;

  const app = express();
  app.use(express.json());
  app.use('/api', aiRouter);

  const startServer = () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

  beforeEach(async () => {
    if (!server) await startServer();
    _resetCounters();
    vi.clearAllMocks();
  });

  afterAll(() => {
    if (server) server.close();
  });

  const validBody = {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
    apiKey: 'sk-test',
  };

  it('returns 200 with normalized response for valid request', async () => {
    relayAIRequest.mockResolvedValue({
      content: 'Hi there!',
      model: 'gpt-4o',
      provider: 'openai',
      usage: { inputTokens: 10, outputTokens: 5 },
    });

    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe('Hi there!');
    expect(body.model).toBe('gpt-4o');
    expect(body.provider).toBe('openai');
    expect(body.cached).toBe(false);
    expect(body.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });

  it('returns 400 when provider is missing', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when messages is missing', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', model: 'gpt-4o' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when messages is empty array', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', model: 'gpt-4o', messages: [] }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown provider', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'fakeprovider',
        model: 'x',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 502 when relayAIRequest throws', async () => {
    relayAIRequest.mockRejectedValue(new Error('Provider openai returned 500: Internal error'));

    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('Provider openai');
  });

  it('returns 503 when circuit breaker is open (after 3 consecutive failures)', async () => {
    relayAIRequest.mockRejectedValue(new Error('Provider error'));

    // Trigger 3 failures to trip the circuit breaker
    for (let i = 0; i < 3; i++) {
      await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });
    }

    // 4th request should get 503
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('temporarily unavailable');
  });

  it('passes apiKey to relayAIRequest', async () => {
    // Use anthropic provider to avoid circuit breaker state from other tests
    relayAIRequest.mockResolvedValue({
      content: 'ok',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    });

    const body = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hello' }],
      apiKey: 'sk-ant-test',
    };

    await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(relayAIRequest).toHaveBeenCalledWith(
      'anthropic',
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: 'Hello' }],
      'sk-ant-test'
    );
  });

  it('does not include apiKey in error responses', async () => {
    relayAIRequest.mockRejectedValue(new Error('Something failed'));

    const body = {
      provider: 'mistral',
      model: 'mistral-large',
      messages: [{ role: 'user', content: 'Hello' }],
      apiKey: 'sk-test',
    };

    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const resBody = await res.json();
    expect(JSON.stringify(resBody)).not.toContain('sk-test');
  });

  it('enforces freemium limit when no apiKey is provided', async () => {
    relayAIRequest.mockResolvedValue({
      content: 'ok',
      model: 'gemini-2.0-flash',
      provider: 'google',
    });

    const bodyNoKey = {
      provider: 'google',
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: 'hi' }],
    };

    // Make 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyNoKey),
      });
      expect(res.status).toBe(200);
    }

    // 6th request should be rate-limited
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyNoKey),
    });
    expect(res.status).toBe(429);
  });
});
