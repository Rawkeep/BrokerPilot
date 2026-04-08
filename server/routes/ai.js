/**
 * AI Chat Route
 *
 * POST /ai/chat — Multi-provider AI chat proxy with:
 * - Zod request validation
 * - Freemium gate (5 free/day without API key)
 * - Circuit breaker per provider
 * - Token budget enforcement
 */

import { Router } from 'express';
import { z } from 'zod';
import { AI_PROVIDERS, AI_TOKEN_BUDGET } from '../../shared/aiProviders.js';
import { relayAIRequest } from '../services/aiProxy.js';
import { freemiumGate } from '../middleware/freemiumGate.js';
import { checkBudget, createCircuitBreaker } from '../middleware/costGuard.js';

export const aiRouter = Router();

// Module-level circuit breaker instance
const circuitBreaker = createCircuitBreaker();

// Zod schema for incoming request body
const AIRequestSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .min(1),
  apiKey: z.string().optional(),
});

aiRouter.post('/ai/chat', freemiumGate, async (req, res) => {
  // 1. Validate request body
  const parsed = AIRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.issues,
    });
  }

  const { provider, model, messages, apiKey } = parsed.data;

  // 2. Check circuit breaker
  if (circuitBreaker.isOpen(provider)) {
    return res.status(503).json({
      error: `Provider ${provider} is temporarily unavailable. Please try again later.`,
    });
  }

  // 3. Relay to AI provider
  try {
    const result = await relayAIRequest(provider, model, messages, apiKey);

    // Record success
    circuitBreaker.recordSuccess(provider);

    // 4. Check token budget
    if (result.usage) {
      checkBudget(result.usage, AI_TOKEN_BUDGET);
    }

    return res.json({
      content: result.content,
      model: result.model,
      provider: result.provider,
      usage: result.usage,
      cached: false,
    });
  } catch (err) {
    // Record failure for circuit breaker (only for provider errors, not budget)
    if (!err.status || err.status >= 500 || err.status === undefined) {
      circuitBreaker.recordFailure(provider);
    }

    const status = err.status || 502;
    return res.status(status).json({
      error: err.message || 'AI request failed',
    });
  }
});
