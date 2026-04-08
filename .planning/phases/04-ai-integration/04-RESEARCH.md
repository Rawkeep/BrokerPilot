# Phase 4: AI Integration Layer — Research

**Researched:** 2026-04-08
**Confidence:** HIGH

## Provider API Patterns

### Provider Registry (6 providers)

| Provider | Base URL | Auth Header | Chat Endpoint | Streaming |
|----------|----------|-------------|---------------|-----------|
| Anthropic (Claude) | `https://api.anthropic.com` | `x-api-key: {key}` + `anthropic-version: 2023-06-01` | `/v1/messages` | SSE `stream: true` |
| OpenAI (GPT) | `https://api.openai.com` | `Authorization: Bearer {key}` | `/v1/chat/completions` | SSE `stream: true` |
| Google (Gemini) | `https://generativelanguage.googleapis.com` | `x-goog-api-key: {key}` | `/v1beta/models/{model}:generateContent` | `?alt=sse` with `streamGenerateContent` |
| Mistral | `https://api.mistral.ai` | `Authorization: Bearer {key}` | `/v1/chat/completions` | SSE (OpenAI-compatible) |
| Groq | `https://api.groq.com/openai` | `Authorization: Bearer {key}` | `/v1/chat/completions` | SSE (OpenAI-compatible) |
| OpenRouter | `https://openrouter.ai/api` | `Authorization: Bearer {key}` | `/v1/chat/completions` | SSE (OpenAI-compatible) |

### Key Observations

1. **OpenAI-compatible group:** OpenAI, Mistral, Groq, OpenRouter all use the same `/v1/chat/completions` endpoint format with `Authorization: Bearer` header. A single adapter handles all four.
2. **Anthropic is unique:** Different endpoint (`/v1/messages`), different auth header (`x-api-key`), different request/response schema. Needs its own adapter.
3. **Gemini is unique:** Different URL pattern (model in URL), different auth header (`x-goog-api-key`), different response schema. Needs its own adapter.
4. **Result: 3 adapters, not 6:** OpenAI-compatible (4 providers), Anthropic (1), Gemini (1).

## Zod for Output Validation

Zod is the standard runtime schema validation library for JavaScript/TypeScript. It has zero dependencies and works in both Node.js and browser environments.

**Installation:** `npm install zod`

**Usage pattern for AI output validation:**
```javascript
import { z } from 'zod';

const AIResponseSchema = z.object({
  content: z.string().min(1),
  model: z.string(),
  provider: z.string(),
  usage: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  }).optional(),
});
```

## Freemium Gate Strategy

**IP + fingerprint approach for anonymous rate limiting (no auth):**
- Server-side: Track by `req.ip` (or `x-forwarded-for` behind proxy)
- Use in-memory Map with daily TTL (resets at midnight UTC)
- 5 requests/day per IP without API key
- Requests WITH a valid API key bypass the gate entirely
- No user accounts needed — aligns with localStorage-first architecture

## Cost Guard Patterns

1. **maxIterations:** Hard cap on LLM round-trips per request (default: 3 for simple chat, configurable for agents)
2. **Token budget:** Track cumulative input+output tokens per request, abort if exceeding budget (e.g., 8000 tokens for chat)
3. **Circuit breaker:** If a provider returns 3+ consecutive errors (429, 500, timeout), trip the breaker for 60 seconds. Return a friendly error instead of hammering the failing provider.
4. **Request timeout:** 30-second hard timeout on all provider requests via AbortController.

## Dependencies to Add

- `zod` — runtime schema validation for AI responses (AI-04)
- No AI SDK dependencies needed — we use raw `fetch` to provider APIs (lighter, more control, avoids SDK version churn)

## Architecture Decision: Raw Fetch vs AI SDKs

**Decision: Raw fetch with provider adapters**

Rationale:
- 4 of 6 providers share the OpenAI-compatible format — one adapter covers them
- SDKs (@anthropic-ai/sdk, openai, @google/generative-ai) add ~500KB+ combined bundle to server
- SDK APIs change frequently; raw fetch against documented REST APIs is more stable
- Full control over timeout, retry, streaming, and error handling
- The proxy is simple request relay — no complex SDK features needed (no function calling, no embeddings)

---
*Research for Phase 4: AI Integration Layer*
