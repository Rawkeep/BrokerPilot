/**
 * AutoPilot Service — Watches for new leads and auto-triggers the pipeline.
 *
 * Functions:
 * - processNewLead(lead, brokerType, aiConfig) — triggers full pipeline for a lead
 * - getAutoPilotStatus() — returns current auto-pilot state
 *
 * Pipeline steps:
 * 1. Lead Qualifier   -> score the lead
 * 2. Market Analyst   -> analyze market context
 * 3. SWOT Strategist  -> strategic assessment
 * 4. Generate proposal from results
 * 5. Create follow-up reminder based on AI recommendation
 *
 * Called from the lead creation endpoint when auto-pilot is enabled.
 */

import { runPipeline } from '../pipeline/pipelineGraph.js';
import { sendEmail } from './emailSender.js';

// --- AutoPilot State ---

const autoPilotState = {
  enabled: false,
  processedLeads: 0,
  lastProcessedAt: null,
  /** @type {Array<{ leadId: string, status: string, timestamp: string, error?: string }>} */
  recentRuns: [],
};

const MAX_RECENT_RUNS = 50;

/**
 * Enable or disable auto-pilot mode.
 * @param {boolean} enabled
 */
export function setAutoPilotEnabled(enabled) {
  autoPilotState.enabled = Boolean(enabled);
}

/**
 * Get the current auto-pilot state.
 * @returns {{ enabled: boolean, processedLeads: number, lastProcessedAt: string|null, recentRuns: Array }}
 */
export function getAutoPilotStatus() {
  return {
    enabled: autoPilotState.enabled,
    processedLeads: autoPilotState.processedLeads,
    lastProcessedAt: autoPilotState.lastProcessedAt,
    recentRuns: autoPilotState.recentRuns.slice(-10),
  };
}

/**
 * Generate a proposal summary from pipeline results.
 *
 * @param {object} lead - Lead data
 * @param {object} pipelineResult - Result from runPipeline
 * @returns {string} HTML proposal content
 */
function generateProposal(lead, pipelineResult) {
  const { qualifierResult, analystResult, swotResult } = pipelineResult;

  const leadName = lead.name || lead.company || 'Interessent';
  const score = qualifierResult?.score ?? 'N/A';
  const priority = qualifierResult?.priority ?? 'mittel';

  const sections = [];

  sections.push(`<h2>Automatische Analyse: ${leadName}</h2>`);
  sections.push(`<p><strong>Lead-Score:</strong> ${score}/100 (Prioritaet: ${priority})</p>`);

  if (qualifierResult?.summary) {
    sections.push(`<h3>Lead-Qualifizierung</h3><p>${qualifierResult.summary}</p>`);
  }

  if (analystResult?.summary) {
    sections.push(`<h3>Marktanalyse</h3><p>${analystResult.summary}</p>`);
  }

  if (swotResult) {
    sections.push('<h3>SWOT-Analyse</h3>');
    if (swotResult.strengths) sections.push(`<p><strong>Staerken:</strong> ${swotResult.strengths}</p>`);
    if (swotResult.weaknesses) sections.push(`<p><strong>Schwaechen:</strong> ${swotResult.weaknesses}</p>`);
    if (swotResult.opportunities) sections.push(`<p><strong>Chancen:</strong> ${swotResult.opportunities}</p>`);
    if (swotResult.threats) sections.push(`<p><strong>Risiken:</strong> ${swotResult.threats}</p>`);
  }

  if (qualifierResult?.nextSteps) {
    sections.push(`<h3>Empfohlene naechste Schritte</h3><p>${qualifierResult.nextSteps}</p>`);
  }

  return sections.join('\n');
}

/**
 * Determine a follow-up reminder from pipeline results.
 *
 * @param {object} lead - Lead data
 * @param {object} pipelineResult - Pipeline result
 * @returns {{ daysUntilFollowUp: number, action: string, priority: string }}
 */
function createFollowUpReminder(lead, pipelineResult) {
  const { qualifierResult } = pipelineResult;
  const score = qualifierResult?.score ?? 50;
  const priority = qualifierResult?.priority ?? 'mittel';

  let daysUntilFollowUp;
  let action;

  if (score >= 80) {
    daysUntilFollowUp = 1;
    action = 'Sofortige Kontaktaufnahme — hochwertiger Lead';
  } else if (score >= 60) {
    daysUntilFollowUp = 3;
    action = 'Angebot vorbereiten und nachfassen';
  } else if (score >= 40) {
    daysUntilFollowUp = 7;
    action = 'Informationsmaterial senden';
  } else {
    daysUntilFollowUp = 14;
    action = 'In Nurture-Kampagne aufnehmen';
  }

  return { daysUntilFollowUp, action, priority };
}

/**
 * Record a pipeline run in the recent history.
 * @param {string} leadId
 * @param {'success'|'partial'|'failed'} status
 * @param {string} [error]
 */
function recordRun(leadId, status, error) {
  autoPilotState.recentRuns.push({
    leadId,
    status,
    timestamp: new Date().toISOString(),
    ...(error && { error }),
  });

  // Trim history
  if (autoPilotState.recentRuns.length > MAX_RECENT_RUNS) {
    autoPilotState.recentRuns = autoPilotState.recentRuns.slice(-MAX_RECENT_RUNS);
  }
}

/**
 * Process a new lead through the full auto-pilot pipeline.
 *
 * Steps:
 * 1. Run the multi-agent pipeline (Qualifier -> Analyst -> SWOT)
 * 2. Generate proposal HTML from results
 * 3. Create follow-up reminder
 * 4. Optionally send notification email if configured
 *
 * @param {object} lead - Lead data ({ id, name, email, company, ... })
 * @param {string} brokerType - Broker type key
 * @param {{ provider: string, model: string, apiKey: string }} aiConfig - AI configuration
 * @returns {Promise<{
 *   success: boolean,
 *   pipelineResult?: object,
 *   proposal?: string,
 *   followUp?: object,
 *   error?: string
 * }>}
 */
export async function processNewLead(lead, brokerType, aiConfig) {
  if (!lead || !brokerType || !aiConfig) {
    return { success: false, error: 'Missing required parameters: lead, brokerType, aiConfig.' };
  }

  const leadId = lead.id || lead.name || 'unknown';

  // Collect events in an array instead of streaming (auto-pilot runs in background)
  const events = [];
  const emit = (eventType, data) => {
    events.push({ eventType, data, timestamp: Date.now() });
  };

  try {
    // Step 1: Run the multi-agent pipeline
    const pipelineResult = await runPipeline(lead, brokerType, aiConfig, emit);

    // Step 2: Generate proposal
    const proposal = generateProposal(lead, pipelineResult);

    // Step 3: Create follow-up reminder
    const followUp = createFollowUpReminder(lead, pipelineResult);

    // Step 4: Send notification email if configured and lead has email
    if (process.env.AUTOPILOT_NOTIFY_EMAIL && lead.email) {
      try {
        await sendEmail({
          to: process.env.AUTOPILOT_NOTIFY_EMAIL,
          subject: `[AutoPilot] Neuer Lead verarbeitet: ${lead.name || lead.company || leadId}`,
          html: proposal,
          text: `Neuer Lead verarbeitet. Score: ${pipelineResult.qualifierResult?.score ?? 'N/A'}. Follow-up in ${followUp.daysUntilFollowUp} Tagen.`,
        });
      } catch {
        // Email failure should not fail the pipeline
      }
    }

    // Update state
    autoPilotState.processedLeads += 1;
    autoPilotState.lastProcessedAt = new Date().toISOString();

    const status = pipelineResult.isPartial ? 'partial' : 'success';
    recordRun(leadId, status);

    return {
      success: true,
      pipelineResult,
      proposal,
      followUp,
    };
  } catch (err) {
    recordRun(leadId, 'failed', err.message);
    return { success: false, error: err.message };
  }
}
