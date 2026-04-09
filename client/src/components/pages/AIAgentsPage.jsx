import { useState } from 'react';
import { Link } from 'react-router';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';
import { AIResponsePanel } from '../ai/AIResponsePanel.jsx';
import { AgentHistory } from '../agents/AgentHistory.jsx';
import { AgentStreamProgress } from '../agents/AgentStreamProgress.jsx';
import { AgentResultCard } from '../agents/AgentResultCard.jsx';
import { LeadQualifierResult } from '../agents/LeadQualifierResult.jsx';
import { MarketAnalystResult } from '../agents/MarketAnalystResult.jsx';
import { SWOTMatrix } from '../agents/SWOTMatrix.jsx';
import { useAgentStream } from '../../hooks/useAgentStream.js';
import { useAgentStore } from '../../stores/agentStore.js';
import { useLeadStore } from '../../stores/leadStore.js';
import { de } from '../../i18n/de.js';

const AGENT_ICONS = {
  leadQualifier: '\u2605',
  marketAnalyst: '\u2197',
  swotStrategist: '\u2B1A',
};

const RESULT_COMPONENTS = {
  leadQualifier: LeadQualifierResult,
  marketAnalyst: MarketAnalystResult,
  swotStrategist: SWOTMatrix,
};

export function AIAgentsPage() {
  const t = de.pages.aiAgents;
  const { triggerAgent, isStreaming, currentStep, error } = useAgentStream();
  const runs = useAgentStore((s) => s.runs);
  const leads = useLeadStore((s) => s.leads);

  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [symbolInput, setSymbolInput] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);
  const [testSectionOpen, setTestSectionOpen] = useState(false);

  const agents = [
    { type: 'leadQualifier', needsLead: true },
    { type: 'marketAnalyst', needsSymbol: true },
    { type: 'swotStrategist', needsLead: true },
  ];

  async function handleTrigger(agentType) {
    setActiveAgent(agentType);

    if (agentType === 'marketAnalyst') {
      const symbol = symbolInput.trim();
      if (!symbol) return;
      await triggerAgent(agentType, { symbol, assetType: 'aktie' }, `page-${Date.now()}`);
    } else {
      const lead = leads.find((l) => l.id === selectedLeadId);
      if (!lead) return;

      if (agentType === 'leadQualifier') {
        await triggerAgent(
          agentType,
          {
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
          },
          lead.id
        );
      } else {
        await triggerAgent(
          agentType,
          {
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
          },
          lead.id
        );
      }
    }
  }

  // Find latest run result for inline display
  const latestRun = activeAgent && runs.length > 0 ? runs[0] : null;

  return (
    <div>
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>

      <div className="ai-agents-sections">
        {/* Agent Cards */}
        <div className="agent-cards-grid">
          {agents.map(({ type, needsLead, needsSymbol }) => (
            <GlassCard key={type} hoverable={false}>
              <div className="agent-card__header">
                <span className="agent-card__icon">{AGENT_ICONS[type]}</span>
                <h3 className="agent-card__name">{t.agentNames[type]}</h3>
              </div>
              <p className="agent-card__description">{t.triggerDescription[type]}</p>

              <div className="agent-card__actions">
                {needsLead && (
                  <select
                    className="agent-card__select"
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                  >
                    <option value="">{t.selectLead}</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} {lead.company ? `(${lead.company})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {needsSymbol && (
                  <GlassInput
                    className="agent-card__input"
                    placeholder={t.symbolPlaceholder}
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value)}
                  />
                )}

                <GlassButton
                  variant="primary"
                  onClick={() => handleTrigger(type)}
                  disabled={
                    isStreaming ||
                    (needsLead && !selectedLeadId) ||
                    (needsSymbol && !symbolInput.trim())
                  }
                >
                  {isStreaming && activeAgent === type
                    ? t.steps.thinking
                    : t.runAgent}
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Active streaming progress */}
        {isStreaming && currentStep && (
          <GlassCard hoverable={false}>
            <AgentStreamProgress currentStep={currentStep} agentType={activeAgent} />
          </GlassCard>
        )}

        {/* Error display */}
        {error && !isStreaming && (
          <div className="agent-trigger-panel__error">
            {t.steps.error}: {error}
          </div>
        )}

        {/* Latest inline result */}
        {latestRun && latestRun.status === 'done' && latestRun.result && (() => {
          const ResultComponent = RESULT_COMPONENTS[latestRun.agentType];
          return (
            <AgentResultCard run={latestRun} defaultExpanded={true}>
              {ResultComponent && <ResultComponent result={latestRun.result} />}
            </AgentResultCard>
          );
        })()}

        {/* Agent History */}
        <section>
          <h2 className="ai-agents-section__title">{t.history}</h2>
          <AgentHistory />
        </section>

        {/* AI Connection Test (collapsible) */}
        <section>
          <h2
            className="ai-agents-section__title"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setTestSectionOpen((o) => !o)}
          >
            {t.testSection} {testSectionOpen ? '\u25B2' : '\u25BC'}
          </h2>
          {testSectionOpen && (
            <>
              <p className="ai-agents-section__description">{t.testDescription}</p>
              <AIResponsePanel />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default AIAgentsPage;
