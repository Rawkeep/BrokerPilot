import { useState } from 'react';
import { useAgentStream } from '../../hooks/useAgentStream.js';
import { useAgentStore } from '../../stores/agentStore.js';
import { useLeadStore } from '../../stores/leadStore.js';
import { AgentTriggerButton } from './AgentTriggerButton.jsx';
import { AgentStreamProgress } from './AgentStreamProgress.jsx';
import { AgentResultCard } from './AgentResultCard.jsx';
import { LeadQualifierResult } from './LeadQualifierResult.jsx';
import { MarketAnalystResult } from './MarketAnalystResult.jsx';
import { SWOTMatrix } from './SWOTMatrix.jsx';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';
import { de } from '../../i18n/de.js';

const RESULT_COMPONENTS = {
  leadQualifier: LeadQualifierResult,
  marketAnalyst: MarketAnalystResult,
  swotStrategist: SWOTMatrix,
};

/**
 * AgentTriggerPanel — 3 agent trigger buttons for a lead detail page.
 *
 * @param {{ lead: object }} props
 */
export function AgentTriggerPanel({ lead }) {
  const { triggerAgent, isStreaming, currentStep, error } = useAgentStream();
  const runs = useAgentStore((s) => s.runs);
  const addNote = useLeadStore((s) => s.addNote);
  const [symbolInput, setSymbolInput] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);

  const t = de.pages?.aiAgents || {};
  const leadId = lead.id;

  // Get runs for this lead
  const leadRuns = runs.filter((r) => r.leadId === leadId);

  async function handleTrigger(agentType) {
    setActiveAgent(agentType);

    let payload;
    switch (agentType) {
      case 'leadQualifier':
        payload = {
          leadData: {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            dealValue: lead.dealValue,
            budget: lead.budget,
            brokerType: lead.brokerType,
            stage: lead.stage,
            customFields: lead.customFields,
            notes: lead.notes,
            tags: lead.tags,
          },
          brokerType: lead.brokerType,
        };
        break;
      case 'marketAnalyst': {
        const symbol = symbolInput.trim() || lead.customFields?.asset || lead.customFields?.symbol || '';
        if (!symbol) return;
        payload = {
          symbol,
          assetType: lead.brokerType === 'krypto' ? 'krypto' : 'aktie',
        };
        break;
      }
      case 'swotStrategist':
        payload = {
          dealData: {
            name: lead.name,
            company: lead.company,
            dealValue: lead.dealValue,
            budget: lead.budget,
            stage: lead.stage,
            customFields: lead.customFields,
            notes: lead.notes,
            tags: lead.tags,
          },
          brokerType: lead.brokerType,
          context: `Deal-Wert: ${lead.dealValue || 0}`,
        };
        break;
      default:
        return;
    }

    await triggerAgent(agentType, payload, leadId);

    // Add activity note on successful completion
    const names = t.agentNames || {};
    const agentLabel = names[agentType] || agentType;
    await addNote(leadId, `KI-Analyse: ${agentLabel}`);
  }

  const hasSymbol = !!(
    symbolInput.trim() ||
    lead.customFields?.asset ||
    lead.customFields?.symbol
  );

  return (
    <div className="agent-trigger-panel">
      <h3 className="agent-trigger-panel__title">KI-Agenten</h3>

      {/* Trigger buttons */}
      <div className="agent-trigger-panel__buttons">
        <AgentTriggerButton
          agentType="leadQualifier"
          onClick={() => handleTrigger('leadQualifier')}
          disabled={isStreaming}
          isStreaming={isStreaming && activeAgent === 'leadQualifier'}
        />

        <div className="agent-trigger-panel__market-group">
          <GlassInput
            placeholder="Symbol (z.B. AAPL, Bitcoin)"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            className="agent-trigger-panel__symbol-input"
          />
          <AgentTriggerButton
            agentType="marketAnalyst"
            onClick={() => handleTrigger('marketAnalyst')}
            disabled={isStreaming || !hasSymbol}
            isStreaming={isStreaming && activeAgent === 'marketAnalyst'}
          />
        </div>

        <AgentTriggerButton
          agentType="swotStrategist"
          onClick={() => handleTrigger('swotStrategist')}
          disabled={isStreaming}
          isStreaming={isStreaming && activeAgent === 'swotStrategist'}
        />
      </div>

      {/* Active streaming progress */}
      {isStreaming && currentStep && (
        <div className="agent-trigger-panel__active">
          <AgentStreamProgress currentStep={currentStep} agentType={activeAgent} />
        </div>
      )}

      {/* Error display */}
      {error && !isStreaming && (
        <div className="agent-trigger-panel__error">
          {t.steps?.error || 'Fehler'}: {error}
        </div>
      )}

      {/* Past results for this lead */}
      {leadRuns.filter((r) => r.status === 'done' && r.result).length > 0 && (
        <div className="agent-trigger-panel__results">
          <h4 className="agent-section-title">{t.history || 'Verlauf'}</h4>
          {leadRuns
            .filter((r) => r.status === 'done' && r.result)
            .map((run) => {
              const ResultComponent = RESULT_COMPONENTS[run.agentType];
              return (
                <AgentResultCard key={run.runId} run={run} defaultExpanded={true}>
                  {ResultComponent && <ResultComponent result={run.result} />}
                </AgentResultCard>
              );
            })}
        </div>
      )}
    </div>
  );
}
