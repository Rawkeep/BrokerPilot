/**
 * Pipeline Graph — Multi-Agent Sequential Executor
 *
 * Orchestrates Qualifier -> Analyst -> SWOT in a deterministic sequence.
 * Each node wraps the corresponding agent module in try/catch for
 * partial failure recovery (ORCH-03). Events are emitted for SSE
 * streaming (ORCH-02).
 *
 * Uses a manual sequential executor rather than LangGraph StateGraph
 * to avoid ESM compatibility issues while providing the same interface.
 */

import { relayAIRequest } from '../services/aiProxy.js';
import * as leadQualifier from '../agents/leadQualifier.js';
import * as marketAnalyst from '../agents/marketAnalyst.js';
import * as swotStrategist from '../agents/swotStrategist.js';
import { createInitialState, PIPELINE_STEPS } from './pipelineState.js';

/**
 * Qualifier node — runs the Lead Qualifier agent.
 *
 * @param {object} state - Pipeline state
 * @param {(event: string, data: object) => void} emit - SSE emitter
 * @returns {object} Updated state
 */
async function qualifierNode(state, emit) {
  const step = 'qualifier';
  emit('pipeline:step:start', { step });

  try {
    const messages = leadQualifier.buildPrompt(state.leadData, state.brokerType);

    emit('agent:thinking', { step });

    const aiResponse = await relayAIRequest(
      state.aiConfig.provider,
      state.aiConfig.model,
      messages,
      state.aiConfig.apiKey
    );

    const result = leadQualifier.parseResponse(aiResponse.content);
    state.qualifierResult = result;
    state.completedSteps.push(step);

    emit('pipeline:step:done', { step, result });
  } catch (err) {
    state.failedSteps.push(step);
    state.isPartial = true;

    emit('pipeline:step:error', { step, error: err.message });
  }

  return state;
}

/**
 * Analyst node — runs the Market Analyst agent with data enrichment.
 *
 * @param {object} state - Pipeline state
 * @param {(event: string, data: object) => void} emit - SSE emitter
 * @returns {object} Updated state
 */
async function analystNode(state, emit) {
  const step = 'analyst';
  emit('pipeline:step:start', { step });

  try {
    // Derive symbol/assetType from leadData customFields or defaults
    const symbol =
      state.leadData.customFields?.symbol ||
      state.leadData.symbol ||
      state.leadData.company ||
      'N/A';
    const assetType =
      state.leadData.customFields?.assetType ||
      state.leadData.assetType ||
      'aktie';

    // Enrich with market data
    emit('agent:enriching', { step });
    const enrichedData = await marketAnalyst.enrichData({ symbol, assetType });

    const messages = marketAnalyst.buildPrompt(
      { symbol, assetType, query: state.leadData.query },
      enrichedData
    );

    emit('agent:thinking', { step });

    const aiResponse = await relayAIRequest(
      state.aiConfig.provider,
      state.aiConfig.model,
      messages,
      state.aiConfig.apiKey
    );

    const result = marketAnalyst.parseResponse(aiResponse.content);
    state.analystResult = result;
    state.completedSteps.push(step);

    emit('pipeline:step:done', { step, result });
  } catch (err) {
    state.failedSteps.push(step);
    state.isPartial = true;

    emit('pipeline:step:error', { step, error: err.message });
  }

  return state;
}

/**
 * SWOT node — runs the SWOT Strategist agent.
 * Passes qualifier and analyst results as context when available.
 *
 * @param {object} state - Pipeline state
 * @param {(event: string, data: object) => void} emit - SSE emitter
 * @returns {object} Updated state
 */
async function swotNode(state, emit) {
  const step = 'swot';
  emit('pipeline:step:start', { step });

  try {
    // Build context from prior successful steps
    const context = {};
    if (state.qualifierResult) {
      context.qualifierResult = state.qualifierResult;
    }
    if (state.analystResult) {
      context.analystResult = state.analystResult;
    }

    const messages = swotStrategist.buildPrompt(
      state.leadData,
      state.brokerType,
      context
    );

    emit('agent:thinking', { step });

    const aiResponse = await relayAIRequest(
      state.aiConfig.provider,
      state.aiConfig.model,
      messages,
      state.aiConfig.apiKey
    );

    const result = swotStrategist.parseResponse(aiResponse.content);
    state.swotResult = result;
    state.completedSteps.push(step);

    emit('pipeline:step:done', { step, result });
  } catch (err) {
    state.failedSteps.push(step);
    state.isPartial = true;

    emit('pipeline:step:error', { step, error: err.message });
  }

  return state;
}

/**
 * Run the full multi-agent pipeline: Qualifier -> Analyst -> SWOT.
 *
 * Each step executes independently — if one fails, the pipeline
 * continues with remaining steps and returns partial results.
 *
 * @param {object} leadData - Lead/deal data
 * @param {string} brokerType - Broker type key
 * @param {{ provider: string, model: string, apiKey?: string }} aiConfig - AI config
 * @param {(event: string, data: object) => void} emit - SSE event emitter
 * @returns {Promise<object>} Pipeline result with all agent outputs and metadata
 */
export async function runPipeline(leadData, brokerType, aiConfig, emit) {
  const state = createInitialState(leadData, brokerType, aiConfig);

  // Emit pipeline start
  emit('pipeline:start', { steps: [...PIPELINE_STEPS] });

  // Execute nodes sequentially
  await qualifierNode(state, emit);
  await analystNode(state, emit);
  await swotNode(state, emit);

  // Build final result (strip aiConfig to avoid leaking apiKey)
  const result = {
    qualifierResult: state.qualifierResult,
    analystResult: state.analystResult,
    swotResult: state.swotResult,
    completedSteps: state.completedSteps,
    failedSteps: state.failedSteps,
    isPartial: state.isPartial,
  };

  emit('pipeline:done', result);

  return result;
}
