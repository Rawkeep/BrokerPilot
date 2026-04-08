/**
 * Lead Qualifier Agent (AGT-01)
 *
 * Evaluates leads based on contact data, deal value, activity history,
 * and broker-specific criteria. Produces a structured qualification score.
 */

import { LeadQualifierOutputSchema } from '../../shared/agentSchemas.js';
import { getLeadQualifierPrompt } from './systemPrompts.js';
import { parseJSONFromAI } from './parseHelper.js';

/**
 * Build the messages array for the Lead Qualifier AI call.
 * @param {object} leadData - Lead object with name, email, budget, etc.
 * @param {string} brokerType - Key from BROKER_TYPES
 * @returns {Array<{role: string, content: string}>}
 */
export function buildPrompt(leadData, brokerType) {
  const systemPrompt = getLeadQualifierPrompt(brokerType);

  // Sanitize lead data: only pass safe fields, no raw HTML
  const safeData = {
    name: leadData.name || '',
    email: leadData.email || '',
    phone: leadData.phone || '',
    company: leadData.company || '',
    dealValue: leadData.dealValue,
    budget: leadData.budget,
    stage: leadData.stage || '',
    priority: leadData.priority || '',
    tags: leadData.tags || [],
    notes: leadData.notes || '',
    customFields: leadData.customFields || {},
    activities: (leadData.activities || []).slice(-10).map((a) => ({
      type: a.type,
      description: a.description,
      timestamp: a.timestamp,
    })),
    createdAt: leadData.createdAt,
  };

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Bitte bewerte folgenden Lead:\n\n${JSON.stringify(safeData, null, 2)}`,
    },
  ];
}

/**
 * Parse and validate AI response for Lead Qualifier.
 * @param {string} aiContent - Raw AI response content
 * @returns {object} Validated LeadQualifierOutput
 */
export function parseResponse(aiContent) {
  return parseJSONFromAI(aiContent, LeadQualifierOutputSchema);
}

export const schema = LeadQualifierOutputSchema;
