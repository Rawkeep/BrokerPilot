import { GlassButton } from '../ui/GlassButton.jsx';
import { PipelineProgress } from './PipelineProgress.jsx';
import { PipelineResults } from './PipelineResults.jsx';
import { usePipelineStream } from '../../hooks/usePipelineStream.js';
import { de } from '../../i18n/de.js';

/**
 * PipelineTrigger — One-click pipeline button with progress and results.
 *
 * @param {{ lead: object }} props
 */
export function PipelineTrigger({ lead }) {
  const { triggerPipeline, isRunning, steps, overallResult } = usePipelineStream();
  const t = de.pipeline || {};

  function handleTrigger() {
    if (isRunning || !lead) return;

    const leadData = {
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
      query: lead.customFields?.asset || lead.customFields?.symbol || lead.company || lead.name,
    };

    triggerPipeline(leadData, lead.brokerType);
  }

  const hasResults = steps.some((s) => s.status === 'done' || s.status === 'error');
  const isComplete = overallResult != null;

  return (
    <div className="pipeline-trigger">
      <h3 className="pipeline-trigger__title">{t.sectionTitle || 'Komplette Pipeline'}</h3>
      <p className="pipeline-trigger__description">
        {t.description || 'Fuehrt alle drei KI-Agenten nacheinander aus: Qualifizierung, Marktanalyse und SWOT-Analyse.'}
      </p>

      <GlassButton
        variant="primary"
        onClick={handleTrigger}
        disabled={isRunning}
        className="pipeline-trigger__button"
      >
        {isRunning
          ? (t.running || 'Pipeline laeuft...')
          : (t.trigger || 'Lead-to-Deal Pipeline starten')}
      </GlassButton>

      {/* Progress stepper */}
      {(isRunning || hasResults) && (
        <div className="pipeline-trigger__progress">
          <PipelineProgress steps={steps} />
        </div>
      )}

      {/* Results */}
      {isComplete && (
        <div className="pipeline-trigger__results">
          <PipelineResults steps={steps} lead={lead} overallResult={overallResult} />
        </div>
      )}
    </div>
  );
}
