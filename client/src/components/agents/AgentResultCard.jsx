import { useState } from 'react';
import clsx from 'clsx';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { AgentStreamProgress } from './AgentStreamProgress.jsx';
import { de } from '../../i18n/de.js';

const AGENT_LABELS = {
  leadQualifier: () => de.pages?.aiAgents?.agentNames?.leadQualifier || 'Lead-Qualifizierer',
  marketAnalyst: () => de.pages?.aiAgents?.agentNames?.marketAnalyst || 'Marktanalyst',
  swotStrategist: () => de.pages?.aiAgents?.agentNames?.swotStrategist || 'SWOT-Stratege',
};

const STATUS_VARIANTS = {
  done: 'high',
  error: 'low',
  starting: 'medium',
  enriching: 'medium',
  thinking: 'medium',
};

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
}

/**
 * AgentResultCard — Container card for an agent run result.
 *
 * @param {{ run: object, children: React.ReactNode, defaultExpanded?: boolean }} props
 */
export function AgentResultCard({ run, children, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getLabel = AGENT_LABELS[run.agentType] || (() => run.agentType);
  const statusLabel = de.pages?.aiAgents?.steps?.[run.status] || run.status;
  const isStreaming = ['starting', 'enriching', 'thinking'].includes(run.status);

  return (
    <GlassCard hoverable={false} className="agent-result-card">
      <div
        className="agent-result-card__header"
        onClick={() => !isStreaming && setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isStreaming && setExpanded((x) => !x)}
      >
        <div className="agent-result-card__title-row">
          <span className="agent-result-card__agent-name">{getLabel()}</span>
          <GlassBadge variant={STATUS_VARIANTS[run.status] || 'default'}>
            {statusLabel}
          </GlassBadge>
        </div>
        <span className="agent-result-card__timestamp">
          {formatRelativeTime(run.createdAt)}
          {run.duration != null && ` (${(run.duration / 1000).toFixed(1)}s)`}
        </span>
        {!isStreaming && (
          <span className={clsx('agent-result-card__chevron', expanded && 'agent-result-card__chevron--open')}>
            &#9660;
          </span>
        )}
      </div>

      {isStreaming && (
        <div className="agent-result-card__progress">
          <AgentStreamProgress currentStep={run.status} agentType={run.agentType} />
        </div>
      )}

      {run.status === 'error' && run.error && (
        <div className="agent-result-card__error">
          {de.pages?.aiAgents?.steps?.error || 'Fehler'}: {run.error}
        </div>
      )}

      {run.status === 'done' && expanded && (
        <div className="agent-result-card__body">
          {children}
        </div>
      )}
    </GlassCard>
  );
}
