/**
 * Agent SSE Streaming Route
 *
 * POST /agents/run — Triggers an AI agent and streams SSE lifecycle events.
 *
 * Events: agent:start, agent:enriching, agent:thinking, agent:result, agent:error, agent:done
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AgentRunRequestSchema } from '../../shared/agentSchemas.js';
import { runAgent } from '../agents/agentOrchestrator.js';
import { freemiumGate } from '../middleware/freemiumGate.js';
import { createCircuitBreaker } from '../middleware/costGuard.js';

export const agentRouter = Router();

// Module-level circuit breaker for agent requests
const circuitBreaker = createCircuitBreaker();

/**
 * Write an SSE event to the response.
 * @param {import('express').Response} res
 * @param {string} event - Event type
 * @param {object} data - Event data
 */
function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

agentRouter.post('/agents/run', freemiumGate, async (req, res) => {
  // 1. Validate request body
  const parsed = AgentRunRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.issues,
    });
  }

  const { agentType, payload, provider, model, apiKey } = parsed.data;

  // 2. Check circuit breaker
  if (circuitBreaker.isOpen(provider)) {
    return res.status(503).json({
      error: `Provider ${provider} ist voruebergehend nicht verfuegbar. Bitte versuchen Sie es spaeter erneut.`,
    });
  }

  // 3. Generate run ID
  const runId = uuidv4();

  // 4. Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Run-Id': runId,
  });

  // Send initial connection event
  writeSSE(res, 'connected', { runId });

  // 5. Run agent with SSE emitter
  const emit = (eventType, data) => {
    // Never include apiKey in SSE events (T-05-03)
    writeSSE(res, eventType, data);
  };

  try {
    await runAgent(agentType, payload, { provider, model, apiKey }, emit);
    circuitBreaker.recordSuccess(provider);
  } catch (err) {
    // Record failure for circuit breaker
    if (!err.status || err.status >= 500 || err.status === undefined) {
      circuitBreaker.recordFailure(provider);
    }
    // Error event already emitted by runAgent, just ensure stream ends
  }

  res.end();
});
