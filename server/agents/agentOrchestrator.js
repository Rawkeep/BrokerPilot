/**
 * Agent Orchestrator
 *
 * Coordinates the full agent execution lifecycle:
 * 1. Validate request
 * 2. Enrich data (if applicable)
 * 3. Build prompt
 * 4. Call AI provider via relayAIRequest
 * 5. Validate output with Zod
 * 6. Emit SSE events throughout
 */

import { relayAIRequest } from '../services/aiProxy.js';
import * as leadQualifier from './leadQualifier.js';
import * as marketAnalyst from './marketAnalyst.js';
import * as swotStrategist from './swotStrategist.js';
import * as tradingAgent from './tradingAgent.js';

/** Registry mapping agentType to agent module */
const AGENT_REGISTRY = {
  leadQualifier: {
    buildPrompt: (payload) =>
      leadQualifier.buildPrompt(payload.leadData || payload, payload.brokerType),
    parseResponse: leadQualifier.parseResponse,
    enrichData: null,
  },
  marketAnalyst: {
    buildPrompt: (payload, enrichedData) =>
      marketAnalyst.buildPrompt(
        { symbol: payload.symbol, assetType: payload.assetType, query: payload.query },
        enrichedData
      ),
    parseResponse: marketAnalyst.parseResponse,
    enrichData: (payload) =>
      marketAnalyst.enrichData({ symbol: payload.symbol, assetType: payload.assetType }),
  },
  swotStrategist: {
    buildPrompt: (payload) =>
      swotStrategist.buildPrompt(
        payload.dealData || payload,
        payload.brokerType,
        payload.context
      ),
    parseResponse: swotStrategist.parseResponse,
    enrichData: null,
  },
  tradingAgent: {
    buildPrompt: (payload, enrichedData) =>
      tradingAgent.buildPrompt(enrichedData, payload.portfolio),
    parseResponse: tradingAgent.parseResponse,
    enrichData: async (payload) => {
      const scanResults = await tradingAgent.scanMarkets(payload.scanOptions);
      return tradingAgent.pickTopCandidates(scanResults, 12);
    },
  },
};

/**
 * Run an AI agent with full lifecycle management.
 *
 * @param {string} agentType - 'leadQualifier' | 'marketAnalyst' | 'swotStrategist'
 * @param {object} payload - Agent-specific input data
 * @param {{ provider: string, model: string, apiKey: string }} aiConfig - AI provider config
 * @param {(eventType: string, data: object) => void} emit - SSE event emitter callback
 * @returns {Promise<object>} Validated agent output
 */
export async function runAgent(agentType, payload, aiConfig, emit) {
  const agent = AGENT_REGISTRY[agentType];
  if (!agent) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  const startTime = Date.now();

  try {
    // 1. Start
    emit('agent:start', { agentType, timestamp: new Date().toISOString() });

    // 2. Enrich data (Market Analyst only)
    let enrichedData = null;
    if (agent.enrichData) {
      emit('agent:enriching', { step: 'Marktdaten werden abgerufen...' });
      enrichedData = await agent.enrichData(payload);
      emit('agent:enriching', { step: 'Marktdaten erhalten', data: enrichedData });
    }

    // 3. Build prompt
    const messages = agent.buildPrompt(payload, enrichedData);

    // 4. Call AI
    emit('agent:thinking', { step: 'KI-Modell wird aufgerufen...' });
    const aiResponse = await relayAIRequest(
      aiConfig.provider,
      aiConfig.model,
      messages,
      aiConfig.apiKey
    );

    // 5. Validate output
    const validated = agent.parseResponse(aiResponse.content);

    // 6. Emit result
    const duration = Date.now() - startTime;
    emit('agent:result', {
      output: validated,
      model: aiResponse.model,
      provider: aiResponse.provider,
      usage: aiResponse.usage,
    });

    emit('agent:done', { duration, timestamp: new Date().toISOString() });

    return validated;
  } catch (err) {
    const duration = Date.now() - startTime;
    emit('agent:error', {
      message: err.message || 'Agent execution failed',
      duration,
    });
    throw err;
  }
}
