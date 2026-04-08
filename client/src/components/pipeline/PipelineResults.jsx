import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { LeadQualifierResult } from '../agents/LeadQualifierResult.jsx';
import { MarketAnalystResult } from '../agents/MarketAnalystResult.jsx';
import { SWOTMatrix } from '../agents/SWOTMatrix.jsx';
import { PdfDownloadButton } from '../export/PdfDownloadButton.jsx';
import { ProposalCard } from './ProposalCard.jsx';
import { de } from '../../i18n/de.js';

const RESULT_COMPONENTS = {
  qualifier: { Component: LeadQualifierResult, label: 'Lead-Qualifizierung', pdfType: 'qualifier' },
  analyst: { Component: MarketAnalystResult, label: 'Marktanalyse', pdfType: 'analyst' },
  swot: { Component: SWOTMatrix, label: 'SWOT-Analyse', pdfType: 'swot' },
};

/**
 * PipelineResults — Combined results view for all pipeline steps.
 *
 * Shows all successful agent results in cards.
 * Failed steps show error message with retry suggestion.
 *
 * @param {{ steps: Array, lead: object, overallResult: object|null }} props
 */
export function PipelineResults({ steps, lead, overallResult }) {
  const t = de.pipeline || {};
  const hasAnyResult = steps.some((s) => s.status === 'done' && s.result);
  const isPartial = overallResult?.isPartial || steps.some((s) => s.status === 'error');

  if (!hasAnyResult) return null;

  // Build allResults for pipeline PDF
  const allResults = {};
  const qualifierStep = steps.find((s) => s.name === 'qualifier');
  const analystStep = steps.find((s) => s.name === 'analyst');
  const swotStep = steps.find((s) => s.name === 'swot');
  if (qualifierStep?.result) allResults.leadQualifier = qualifierStep.result;
  if (analystStep?.result) allResults.marketAnalyst = analystStep.result;
  if (swotStep?.result) allResults.swotStrategist = swotStep.result;

  return (
    <div className="pipeline-results">
      {isPartial && (
        <div className="pipeline-results__partial">
          <GlassBadge variant="medium">{t.partial || 'Teilergebnis'}</GlassBadge>
          <span className="pipeline-results__partial-text">
            {t.partialHint || 'Einige Schritte sind fehlgeschlagen. Die erfolgreichen Ergebnisse werden angezeigt.'}
          </span>
        </div>
      )}

      {steps.map((step) => {
        const config = RESULT_COMPONENTS[step.name];
        if (!config) return null;

        if (step.status === 'error') {
          return (
            <GlassCard key={step.name} hoverable={false} className="pipeline-results__card pipeline-results__card--error">
              <h4 className="pipeline-results__card-title">{config.label}</h4>
              <p className="pipeline-results__error">{step.error}</p>
            </GlassCard>
          );
        }

        if (step.status === 'done' && step.result) {
          const { Component, pdfType } = config;
          return (
            <GlassCard key={step.name} hoverable={false} className="pipeline-results__card">
              <div className="pipeline-results__card-header">
                <h4 className="pipeline-results__card-title">{config.label}</h4>
                <PdfDownloadButton type={pdfType} lead={lead} result={step.result} />
              </div>
              <Component result={step.result} />
            </GlassCard>
          );
        }

        return null;
      })}

      {/* Generated Proposal */}
      {Object.keys(allResults).length > 0 && (
        <ProposalCard lead={lead} pipelineResults={allResults} />
      )}

      {/* Full pipeline PDF download */}
      {Object.keys(allResults).length > 0 && (
        <div className="pipeline-results__actions">
          <PdfDownloadButton type="pipeline" lead={lead} result={allResults} />
        </div>
      )}
    </div>
  );
}
