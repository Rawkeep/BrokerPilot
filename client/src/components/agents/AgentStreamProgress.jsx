import clsx from 'clsx';
import { de } from '../../i18n/de.js';

const STEPS = [
  { key: 'starting', icon: '1' },
  { key: 'enriching', icon: '2' },
  { key: 'thinking', icon: '3' },
  { key: 'done', icon: '4' },
];

/** Steps without enrichment (leadQualifier, swotStrategist) */
const STEPS_NO_ENRICH = [
  { key: 'starting', icon: '1' },
  { key: 'thinking', icon: '2' },
  { key: 'done', icon: '3' },
];

function getStepLabel(key) {
  const labels = de.pages?.aiAgents?.steps || {};
  return labels[key] || key;
}

/**
 * AgentStreamProgress — horizontal stepper showing agent execution progress.
 *
 * @param {{ currentStep: string, agentType: string }} props
 */
export function AgentStreamProgress({ currentStep, agentType }) {
  const steps = agentType === 'marketAnalyst' ? STEPS : STEPS_NO_ENRICH;

  const currentIndex = steps.findIndex((s) => s.key === currentStep);
  const isError = currentStep === 'error';

  return (
    <div className="agent-progress">
      {steps.map((step, idx) => {
        const isActive = step.key === currentStep;
        const isCompleted = currentIndex > idx;

        return (
          <div
            key={step.key}
            className={clsx(
              'agent-progress__step',
              isCompleted && 'agent-progress__step--completed',
              isActive && !isError && 'agent-progress__step--active',
              isError && isActive && 'agent-progress__step--error'
            )}
          >
            <div className="agent-progress__indicator">
              {isCompleted ? (
                <span className="agent-progress__check">&#10003;</span>
              ) : isError && isActive ? (
                <span className="agent-progress__error-icon">&#10007;</span>
              ) : (
                <span className="agent-progress__number">{step.icon}</span>
              )}
            </div>
            <span className="agent-progress__label">{getStepLabel(step.key)}</span>
            {idx < steps.length - 1 && <div className="agent-progress__connector" />}
          </div>
        );
      })}
    </div>
  );
}
