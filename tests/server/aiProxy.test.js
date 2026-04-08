import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PROVIDER_REGISTRY,
  AI_PROVIDERS,
  FREEMIUM_DAILY_LIMIT,
  AI_TOKEN_BUDGET,
  AI_REQUEST_TIMEOUT,
} from '../../shared/aiProviders.js';
import { relayAIRequest, AIResponseSchema } from '../../server/services/aiProxy.js';

// --- Provider Registry Tests ---

describe('shared/aiProviders.js', () => {
  it('AI_PROVIDERS contains all 6 provider keys', () => {
    expect(AI_PROVIDERS).toEqual(
      expect.arrayContaining([
        'anthropic',
        'openai',
        'google',
        'mistral',
        'groq',
        'openrouter',
      ])
    );
    expect(AI_PROVIDERS).toHaveLength(6);
  });

  it('FREEMIUM_DAILY_LIMIT equals 5', () => {
    expect(FREEMIUM_DAILY_LIMIT).toBe(5);
  });

  it('AI_TOKEN_BUDGET equals 8000', () => {
    expect(AI_TOKEN_BUDGET).toBe(8000);
  });

  it('AI_REQUEST_TIMEOUT equals 30000', () => {
    expect(AI_REQUEST_TIMEOUT).toBe(30000);
  });

  for (const provider of AI_PROVIDERS) {
    describe(`PROVIDER_REGISTRY['${provider}']`, () => {
      const entry = PROVIDER_REGISTRY[provider];

      it('has a baseUrl string', () => {
        expect(typeof entry.baseUrl).toBe('string');
        expect(entry.baseUrl).toMatch(/^https:\/\//);
      });

      it('has buildHeaders function returning an object', () => {
        expect(typeof entry.buildHeaders).toBe('function');
        const headers = entry.buildHeaders('test-key');
        expect(typeof headers).toBe('object');
        expect(headers['Content-Type']).toBe('application/json');
      });

      it('has a chatEndpoint (string or function)', () => {
        expect(['string', 'function']).toContain(typeof entry.chatEndpoint);
      });

      it('has normalizeRequest function', () => {
        expect(typeof entry.normalizeRequest).toBe('function');
      });

      it('has normalizeResponse function', () => {
        expect(typeof entry.normalizeResponse).toBe('function');
      });

      it('has a valid group', () => {
        expect(['openai-compatible', 'anthropic', 'gemini']).toContain(
          entry.group
        );
      });
    });
  }

  it('OpenAI-compatible providers share the same request format', () => {
    const compatible = ['openai', 'mistral', 'groq', 'openrouter'];
    for (const p of compatible) {
      const body = PROVIDER_REGISTRY[p].normalizeRequest('model-1', [
        { role: 'user', content: 'hi' },
      ]);
      expect(body).toEqual({
        model: 'model-1',
        messages: [{ role: 'user', content: 'hi' }],
      });
    }
  });

  it('Anthropic request includes max_tokens', () => {
    const body = PROVIDER_REGISTRY.anthropic.normalizeRequest(
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: 'hi' }]
    );
    expect(body).toEqual({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 4096,
    });
  });

  it('Gemini request uses contents format', () => {
    const body = PROVIDER_REGISTRY.google.normalizeRequest(
      'gemini-2.0-flash',
      [{ role: 'user', content: 'hi' }]
    );
    expect(body).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    });
  });

  it('Gemini chatEndpoint is a function of model', () => {
    const endpoint = PROVIDER_REGISTRY.google.chatEndpoint('gemini-2.0-flash');
    expect(endpoint).toBe('/v1beta/models/gemini-2.0-flash:generateContent');
  });

  it('Anthropic buildHeaders includes x-api-key and anthropic-version', () => {
    const headers = PROVIDER_REGISTRY.anthropic.buildHeaders('sk-ant-test');
    expect(headers['x-api-key']).toBe('sk-ant-test');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });

  it('Google buildHeaders includes x-goog-api-key', () => {
    const headers = PROVIDER_REGISTRY.google.buildHeaders('goog-key');
    expect(headers['x-goog-api-key']).toBe('goog-key');
  });
});

// --- AI Proxy Service Tests ---

describe('server/services/aiProxy.js — relayAIRequest', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a mock Response
  function mockFetchResponse(body, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    });
  }

  // --- OpenAI ---
  it('relays to OpenAI with correct URL, headers, and body', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: 'Hello!' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      })
    );

    const result = await relayAIRequest('openai', 'gpt-4o', [
      { role: 'user', content: 'hi' },
    ], 'sk-test');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(opts.headers.Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(opts.body)).toEqual({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result.content).toBe('Hello!');
    expect(result.model).toBe('gpt-4o');
    expect(result.provider).toBe('openai');
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });

  // --- Anthropic ---
  it('relays to Anthropic with correct URL, headers, and body', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        content: [{ text: 'Bonjour!' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 8, output_tokens: 12 },
      })
    );

    const result = await relayAIRequest(
      'anthropic',
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: 'hi' }],
      'sk-ant-test'
    );

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(opts.headers['x-api-key']).toBe('sk-ant-test');
    expect(opts.headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse(opts.body)).toEqual({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 4096,
    });
    expect(result.content).toBe('Bonjour!');
    expect(result.provider).toBe('anthropic');
    expect(result.usage).toEqual({ inputTokens: 8, outputTokens: 12 });
  });

  // --- Google Gemini ---
  it('relays to Google Gemini with correct URL and body format', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        candidates: [{ content: { parts: [{ text: 'Hallo!' }] } }],
        modelVersion: 'gemini-2.0-flash',
        usageMetadata: { promptTokenCount: 6, candidatesTokenCount: 4 },
      })
    );

    const result = await relayAIRequest(
      'google',
      'gemini-2.0-flash',
      [{ role: 'user', content: 'hi' }],
      'goog-test'
    );

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    );
    expect(opts.headers['x-goog-api-key']).toBe('goog-test');
    expect(JSON.parse(opts.body)).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    });
    expect(result.content).toBe('Hallo!');
    expect(result.provider).toBe('google');
    expect(result.usage).toEqual({ inputTokens: 6, outputTokens: 4 });
  });

  // --- Mistral ---
  it('relays to Mistral using OpenAI-compatible format', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: 'Salut!' } }],
        model: 'mistral-large',
        usage: { prompt_tokens: 5, completion_tokens: 3 },
      })
    );

    const result = await relayAIRequest('mistral', 'mistral-large', [
      { role: 'user', content: 'hi' },
    ], 'mist-key');

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    expect(result.provider).toBe('mistral');
  });

  // --- Groq ---
  it('relays to Groq using OpenAI-compatible format', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: 'Fast!' } }],
        model: 'llama3-70b',
        usage: { prompt_tokens: 4, completion_tokens: 2 },
      })
    );

    const result = await relayAIRequest('groq', 'llama3-70b', [
      { role: 'user', content: 'hi' },
    ], 'groq-key');

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(result.provider).toBe('groq');
  });

  // --- OpenRouter ---
  it('relays to OpenRouter using OpenAI-compatible format', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: 'Routed!' } }],
        model: 'meta/llama-3',
        usage: { prompt_tokens: 7, completion_tokens: 3 },
      })
    );

    const result = await relayAIRequest('openrouter', 'meta/llama-3', [
      { role: 'user', content: 'hi' },
    ], 'or-key');

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(result.provider).toBe('openrouter');
  });

  // --- Unknown provider ---
  it('throws for unknown provider', async () => {
    await expect(
      relayAIRequest('unknown', 'model', [{ role: 'user', content: 'hi' }], 'key')
    ).rejects.toThrow('Unknown provider');
  });

  // --- Zod validation failure ---
  it('throws on Zod validation failure (empty content)', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: '' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 1, completion_tokens: 0 },
      })
    );

    await expect(
      relayAIRequest('openai', 'gpt-4o', [{ role: 'user', content: 'hi' }], 'key')
    ).rejects.toThrow();
  });

  // --- HTTP error from provider ---
  it('throws on non-OK response from provider', async () => {
    fetchSpy.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      })
    );

    await expect(
      relayAIRequest('openai', 'gpt-4o', [{ role: 'user', content: 'hi' }], 'bad-key')
    ).rejects.toThrow('Provider openai returned 401');
  });

  // --- Timeout via AbortController ---
  it('enforces 30s timeout via AbortController', async () => {
    fetchSpy.mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        // Listen for abort signal
        opts.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    // Use fake timers to fast-forward
    vi.useFakeTimers();

    const promise = relayAIRequest('openai', 'gpt-4o', [
      { role: 'user', content: 'hi' },
    ], 'key');

    // Advance past the 30s timeout
    vi.advanceTimersByTime(31000);

    await expect(promise).rejects.toThrow();

    vi.useRealTimers();
  });

  // --- Token usage normalization ---
  it('normalizes token usage from OpenAI-compatible response', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        choices: [{ message: { content: 'hi' } }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      })
    );

    const result = await relayAIRequest('openai', 'gpt-4o', [
      { role: 'user', content: 'test' },
    ], 'key');

    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
  });

  it('normalizes token usage from Anthropic response', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        content: [{ text: 'hi' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 80, output_tokens: 30 },
      })
    );

    const result = await relayAIRequest(
      'anthropic',
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: 'test' }],
      'key'
    );

    expect(result.usage).toEqual({ inputTokens: 80, outputTokens: 30 });
  });

  it('normalizes token usage from Gemini response', async () => {
    fetchSpy.mockReturnValue(
      mockFetchResponse({
        candidates: [{ content: { parts: [{ text: 'hi' }] } }],
        modelVersion: 'gemini-2.0-flash',
        usageMetadata: { promptTokenCount: 60, candidatesTokenCount: 20 },
      })
    );

    const result = await relayAIRequest(
      'google',
      'gemini-2.0-flash',
      [{ role: 'user', content: 'test' }],
      'key'
    );

    expect(result.usage).toEqual({ inputTokens: 60, outputTokens: 20 });
  });
});
