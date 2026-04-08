/**
 * AI Provider Registry
 *
 * Defines 6 supported AI providers grouped into 3 adapter types:
 * - openai-compatible: OpenAI, Mistral, Groq, OpenRouter
 * - anthropic: Anthropic (Claude)
 * - gemini: Google (Gemini)
 *
 * Each provider entry contains everything needed to build, send,
 * and normalize a chat completion request via raw fetch.
 */

// --- Shared normalizers for OpenAI-compatible providers ---

function openaiNormalizeRequest(model, messages) {
  return { model, messages };
}

function openaiNormalizeResponse(json, providerName) {
  return {
    content: json.choices[0].message.content,
    model: json.model,
    provider: providerName,
    usage: json.usage
      ? {
          inputTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
        }
      : undefined,
  };
}

// --- Provider Registry ---

export const PROVIDER_REGISTRY = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    chatEndpoint: '/v1/messages',
    group: 'anthropic',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
    },
    normalizeRequest(model, messages) {
      return { model, messages, max_tokens: 4096 };
    },
    normalizeResponse(json) {
      return {
        content: json.content[0].text,
        model: json.model,
        provider: 'anthropic',
        usage: json.usage
          ? {
              inputTokens: json.usage.input_tokens,
              outputTokens: json.usage.output_tokens,
            }
          : undefined,
      };
    },
  },

  openai: {
    baseUrl: 'https://api.openai.com',
    chatEndpoint: '/v1/chat/completions',
    group: 'openai-compatible',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    normalizeRequest: openaiNormalizeRequest,
    normalizeResponse(json) {
      return openaiNormalizeResponse(json, 'openai');
    },
  },

  google: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    chatEndpoint(model) {
      return `/v1beta/models/${model}:generateContent`;
    },
    group: 'gemini',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      };
    },
    normalizeRequest(_model, messages) {
      return {
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }],
        })),
      };
    },
    normalizeResponse(json) {
      return {
        content: json.candidates[0].content.parts[0].text,
        model: json.modelVersion || 'gemini',
        provider: 'google',
        usage: json.usageMetadata
          ? {
              inputTokens: json.usageMetadata.promptTokenCount,
              outputTokens: json.usageMetadata.candidatesTokenCount,
            }
          : undefined,
      };
    },
  },

  mistral: {
    baseUrl: 'https://api.mistral.ai',
    chatEndpoint: '/v1/chat/completions',
    group: 'openai-compatible',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    normalizeRequest: openaiNormalizeRequest,
    normalizeResponse(json) {
      return openaiNormalizeResponse(json, 'mistral');
    },
  },

  groq: {
    baseUrl: 'https://api.groq.com/openai',
    chatEndpoint: '/v1/chat/completions',
    group: 'openai-compatible',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    normalizeRequest: openaiNormalizeRequest,
    normalizeResponse(json) {
      return openaiNormalizeResponse(json, 'groq');
    },
  },

  openrouter: {
    baseUrl: 'https://openrouter.ai/api',
    chatEndpoint: '/v1/chat/completions',
    group: 'openai-compatible',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    normalizeRequest: openaiNormalizeRequest,
    normalizeResponse(json) {
      return openaiNormalizeResponse(json, 'openrouter');
    },
  },
};

/** All supported provider keys */
export const AI_PROVIDERS = Object.keys(PROVIDER_REGISTRY);

/** Maximum free requests per day per IP (no API key) */
export const FREEMIUM_DAILY_LIMIT = 5;

/** Default per-request token budget */
export const AI_TOKEN_BUDGET = 8000;

/** Request timeout in milliseconds (30s) */
export const AI_REQUEST_TIMEOUT = 30000;
