/**
 * Frontend API client for POST /api/ai/chat.
 * Follows the same pattern as marketApi.js.
 *
 * CRITICAL: API key is sent in the POST body (HTTPS-encrypted in transit),
 * never in URL parameters or query strings.
 */

/**
 * Send a chat request to the AI proxy.
 * @param {string} provider — AI provider key (e.g. 'openai', 'anthropic')
 * @param {string} model — Model ID (e.g. 'gpt-4o-mini')
 * @param {Array<{role: string, content: string}>} messages — Chat messages
 * @param {string|null} [apiKey=null] — BYOK API key (null = freemium mode)
 * @returns {Promise<{content: string, model: string, provider: string, usage?: object}>}
 */
export async function sendAIRequest(provider, model, messages, apiKey = null) {
  const body = { provider, model, messages };
  if (apiKey) {
    body.apiKey = apiKey;
  }

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || res.statusText);
  }

  return res.json();
}
