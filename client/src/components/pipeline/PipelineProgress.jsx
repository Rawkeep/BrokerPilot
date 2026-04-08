import clsx from 'clsx';
import { de } from '../../i18n/de.js';

const STEP_CONFIG = [
  { name: 'qualifier', number: 1 },
  { name: 'analyst', number: 2 },
  { name: 'swot', number: 3 },
];

/**
 * PipelineProgress — 3-step horizontal stepper for the pipeline.
 *
 * Each step: pending (gray), running (pulse), done (green), error (red).
 * When done, shows mini result preview under each step.
 *
 * @param {{ steps: Array<{name: string, status: string, result: object|null, error: string|null}> }} props
 */
export function PipelineProgress({ steps }) {
  const t = de.pipeline?.steps || {};

  function getStepData(name) {
    return steps.find((s) => s.name === name) || { status: 'pending', result: null, error: null };
  }

  function getStepLabel(name) {
    return t[name] || name;
  }

  function getMiniPreview(step) {
    if (step.status !== 'done' || !step.result) return null;

    if (step.name === 'qualifier') {
      const score = step.result.score ?? step.result.punkte;
      return score != null ? `Score: ${score}/100` : null;
    }
    if (step.name === 'analyst') {
      return step.result.empfehlung
        ? step.result.empfehlung.charAt(0).toUpperCase() + step.result.empfehlung.slice(1)
        : null;
    }
    if (step.name === 'swot') {
      return step.result.zusammenfassung
        ? step.result.zusammenfassung.slice(0, 50) + (step.result.zusammenfassung.length > 50 ? '...' : '')
        : null;
    }
    return null;
  }

  return (
    <div className="pipeline-progress">
      {STEP_CONFIG.map((config, idx) => {
        const step = getStepData(config.name);
        const statusClass = `pipeline-progress__step--${step.status}`;

        return (
          <div key={config.name} className="pipeline-progress__step-wrapper">
            {idx > 0 && (
              <div
                className={clsx(
                  'pipeline-progress__connector',
                  step.status === 'done' && 'pipeline-progress__connector--done',
                  step.status === 'running' && 'pipeline-progress__connector--active'
                )}
              />
            )}
            <div className={clsx('pipeline-progress__step', statusClass)}>
              <div className="pipeline-progress__indicator">
                {step.status === 'done' && <span className="pipeline-progress__check">&#10003;</span>}
                {step.status === 'error' && <span className="pipeline-progress__error-icon">&#10007;</span>}
                {(step.status === 'pending' || step.status === 'running') && (
                  <span className="pipeline-progress__number">{config.number}</span>
                )}
              </div>
              <span className="pipeline-progress__label">{getStepLabel(config.name)}</span>
              {getMiniPreview(step) && (
                <span className="pipeline-progress__preview">{getMiniPreview(step)}</span>
              )}
              {step.status === 'error' && step.error && (
                <span className="pipeline-progress__error-text">{step.error}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
