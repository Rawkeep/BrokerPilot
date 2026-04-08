/**
 * SWOT Strategist Agent (AGT-03)
 *
 * Creates comprehensive SWOT analysis (Staerken, Schwaechen, Chancen, Risiken)
 * for deals and leads based on broker-specific context.
 */

import { SwotStrategistOutputSchema } from '../../shared/agentSchemas.js';
import { getSwotStrategistPrompt } from './systemPrompts.js';
import { parseJSONFromAI } from './parseHelper.js';

/**
 * Build the messages array for the SWOT Strategist AI call.
 * @param {object} dealData - Lead/deal data for analysis
 * @param {string} brokerType - Key from BROKER_TYPES
 * @param {object} [context] - Optional additional context (market data, notes)
 * @returns {Array<{role: string, content: string}>}
 */
export function buildPrompt(dealData, brokerType, context) {
  const systemPrompt = getSwotStrategistPrompt(brokerType);

  // Sanitize deal data
  const safeData = {
    name: dealData.name || '',
    company: dealData.company || '',
    dealValue: dealData.dealValue,
    budget: dealData.budget,
    stage: dealData.stage || '',
    tags: dealData.tags || [],
    notes: dealData.notes || '',
    customFields: dealData.customFields || {},
  };

  const parts = [
    `Bitte erstelle eine SWOT-Analyse fuer folgenden Deal/Lead:\n\n${JSON.stringify(safeData, null, 2)}`,
  ];

  if (context && Object.keys(context).length > 0) {
    parts.push(`\nZusaetzlicher Kontext:\n${JSON.stringify(context, null, 2)}`);
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: parts.join('') },
  ];
}

/**
 * Parse and validate AI response for SWOT Strategist.
 * @param {string} aiContent - Raw AI response content
 * @returns {object} Validated SwotStrategistOutput
 */
export function parseResponse(aiContent) {
  return parseJSONFromAI(aiContent, SwotStrategistOutputSchema);
}

export const schema = SwotStrategistOutputSchema;
