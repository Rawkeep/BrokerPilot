/**
 * Pipeline SSE Streaming Route
 *
 * POST /agents/pipeline — Triggers the multi-agent pipeline and streams
 * SSE lifecycle events as each agent completes.
 *
 * Events: pipeline:start, pipeline:step:start, pipeline:step:done,
 *         pipeline:step:error, pipeline:done, agent:thinking, agent:enriching
 */

import { Router } from 'express';
import { PipelineRunRequestSchema } from '../../shared/agentSchemas.js';
import { runPipeline } from '../pipeline/pipelineGraph.js';
import { freemiumGate } from '../middleware/freemiumGate.js';
import { createCircuitBreaker } from '../middleware/costGuard.js';

export const pipelineRouter = Router();

// Module-level circuit breaker for pipeline requests
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

/**
 * Freemium gate wrapper that counts pipeline as 3 requests.
 * Calls freemiumGate 3 times to consume 3 daily slots.
 */
function pipelineFreemiumGate(req, res, next) {
  // First call checks and increments
  freemiumGate(req, res, (err) => {
    if (err) return next(err);
    // If the first call passed (didn't send 429), increment 2 more times
    // We use a lightweight counter approach — call freemiumGate twice more
    freemiumGate(req, res, (err2) => {
      if (err2) return next(err2);
      freemiumGate(req, res, next);
    });
  });
}

pipelineRouter.post('/agents/pipeline', pipelineFreemiumGate, async (req, res) => {
  // 1. Validate request body
  const parsed = PipelineRunRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.issues,
    });
  }

  const { leadData, brokerType, provider, model, apiKey } = parsed.data;

  // 2. Check circuit breaker
  if (circuitBreaker.isOpen(provider)) {
    return res.status(503).json({
      error: `Provider ${provider} ist voruebergehend nicht verfuegbar. Bitte versuchen Sie es spaeter erneut.`,
    });
  }

  // 3. Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // 4. Create emit callback — never include apiKey in events (T-06-02)
  const emit = (eventType, data) => {
    writeSSE(res, eventType, data);
  };

  // 5. Run pipeline
  try {
    const result = await runPipeline(leadData, brokerType, { provider, model, apiKey }, emit);

    // Record success/failure for circuit breaker based on pipeline outcome
    if (result.failedSteps.length === 0) {
      circuitBreaker.recordSuccess(provider);
    } else if (result.failedSteps.length === 3) {
      // All agents failed — likely provider issue
      circuitBreaker.recordFailure(provider);
    }
  } catch (err) {
    // Pipeline should never throw (partial failure), but handle just in case
    circuitBreaker.recordFailure(provider);
    writeSSE(res, 'pipeline:error', { error: err.message });
  }

  res.end();
});
