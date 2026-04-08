import { useState } from 'react';
import { useAgentStore } from '../../stores/agentStore.js';
import { AgentResultCard } from './AgentResultCard.jsx';
import { LeadQualifierResult } from './LeadQualifierResult.jsx';
import { MarketAnalystResult } from './MarketAnalystResult.jsx';
import { SWOTMatrix } from './SWOTMatrix.jsx';
import { de } from '../../i18n/de.js';

const RESULT_COMPONENTS = {
  leadQualifier: LeadQualifierResult,
  marketAnalyst: MarketAnalystResult,
  swotStrategist: SWOTMatrix,
};

/**
 * AgentHistory — Lists past agent runs with expandable results.
 *
 * @param {{ leadId?: string, agentType?: string, limit?: number }} props
 */
export function AgentHistory({ leadId, agentType, limit = 20 }) {
  const runs = useAgentStore((s) => s.runs);
  const t = de.pages?.aiAgents || {};

  let filteredRuns = runs;
  if (leadId) {
    filteredRuns = filteredRuns.filter((r) => r.leadId === leadId);
  }
  if (agentType) {
    filteredRuns = filteredRuns.filter((r) => r.agentType === agentType);
  }

  // Already sorted by createdAt desc (newest first from store)
  const displayRuns = filteredRuns.slice(0, limit);

  if (displayRuns.length === 0) {
    return (
      <div className="agent-history">
        <p className="agent-history__empty">{t.noHistory || 'Noch keine Analysen durchgefuehrt'}</p>
      </div>
    );
  }

  return (
    <div className="agent-history">
      {displayRuns.map((run) => {
        const ResultComponent = RESULT_COMPONENTS[run.agentType];
        return (
          <AgentResultCard key={run.runId} run={run} defaultExpanded={false}>
            {run.result && ResultComponent && <ResultComponent result={run.result} />}
          </AgentResultCard>
        );
      })}
    </div>
  );
}
