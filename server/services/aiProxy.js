/**
 * Multi-provider AI Proxy Service
 *
 * Relays chat requests to 6 AI providers using raw fetch.
 * Normalizes responses and validates with Zod.
 */

import { z } from 'zod';
import {
  PROVIDER_REGISTRY,
  AI_REQUEST_TIMEOUT,
} from '../../shared/aiProviders.js';

/** Zod schema for validated AI responses */
export const AIResponseSchema = z.object({
  content: z.string().min(1),
  model: z.string(),
  provider: z.string(),
  usage: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
    })
    .optional(),
});

/**
 * Relay a chat request to the specified AI provider.
 *
 * @param {string} provider - Provider key (e.g. 'openai', 'anthropic')
 * @param {string} model - Model identifier
 * @param {Array<{role: string, content: string}>} messages - Chat messages
 * @param {string} apiKey - User's API key for the provider
 * @returns {Promise<{content: string, model: string, provider: string, usage?: {inputTokens: number, outputTokens: number}}>}
 */
export async function relayAIRequest(provider, model, messages, apiKey) {
  const config = PROVIDER_REGISTRY[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Build URL — Gemini has a dynamic endpoint based on model name
  const endpoint =
    typeof config.chatEndpoint === 'function'
      ? config.chatEndpoint(model)
      : config.chatEndpoint;
  const url = config.baseUrl + endpoint;

  // Build headers and body
  const headers = config.buildHeaders(apiKey);
  const body = config.normalizeRequest(model, messages);

  // Enforce 30s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorBody = await response.json();
        errorMessage =
          errorBody.error?.message || errorBody.error || JSON.stringify(errorBody);
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(
        `Provider ${provider} returned ${response.status}: ${errorMessage}`
      );
    }

    const json = await response.json();
    const normalized = config.normalizeResponse(json);

    // Validate response shape with Zod
    const validated = AIResponseSchema.parse(normalized);
    return validated;
  } finally {
    clearTimeout(timeoutId);
  }
}
