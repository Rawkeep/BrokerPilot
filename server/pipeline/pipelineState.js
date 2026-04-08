/**
 * Pipeline State Schema & Factory
 *
 * Defines the state shape that flows through the multi-agent pipeline
 * and the step constants used for orchestration.
 */

/** Ordered list of pipeline steps */
export const PIPELINE_STEPS = ['qualifier', 'analyst', 'swot'];

/**
 * Create the initial pipeline state object.
 *
 * @param {object} leadData - Lead/deal data for analysis
 * @param {string} brokerType - Broker type key (e.g. 'immobilien')
 * @param {{ provider: string, model: string, apiKey?: string }} aiConfig - AI provider config
 * @returns {object} Initial pipeline state
 */
export function createInitialState(leadData, brokerType, aiConfig) {
  return {
    leadData,
    brokerType,
    aiConfig,

    // Agent results — null until executed
    qualifierResult: null,
    analystResult: null,
    swotResult: null,

    // Pipeline metadata
    completedSteps: [],
    failedSteps: [],
    isPartial: false,
  };
}
