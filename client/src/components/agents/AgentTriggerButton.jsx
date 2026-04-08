import clsx from 'clsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { de } from '../../i18n/de.js';

const AGENT_ICONS = {
  leadQualifier: '\u2605',    // Star
  marketAnalyst: '\u2197',    // Trend arrow
  swotStrategist: '\u2B1A',   // Grid
};

/**
 * AgentTriggerButton — Reusable button to trigger an AI agent.
 *
 * @param {{
 *   agentType: 'leadQualifier'|'marketAnalyst'|'swotStrategist',
 *   onClick: () => void,
 *   disabled: boolean,
 *   isStreaming: boolean,
 * }} props
 */
export function AgentTriggerButton({ agentType, onClick, disabled, isStreaming }) {
  const names = de.pages?.aiAgents?.agentNames || {};
  const label = names[agentType] || agentType;
  const icon = AGENT_ICONS[agentType] || '\u2022';

  return (
    <GlassButton
      variant="primary"
      className={clsx('agent-trigger-btn', isStreaming && 'agent-trigger-btn--streaming')}
      onClick={onClick}
      disabled={disabled || isStreaming}
    >
      <span className="agent-trigger-btn__icon">{icon}</span>
      <span className="agent-trigger-btn__label">
        {isStreaming ? (de.pages?.aiAgents?.steps?.thinking || 'Analyse laeuft...') : label}
      </span>
      {isStreaming && <span className="agent-trigger-btn__spinner" />}
    </GlassButton>
  );
}
