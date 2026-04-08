import { useState, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { PdfDownloadButton } from '../export/PdfDownloadButton.jsx';
import { generateProposal, proposalToText } from '../../services/proposalGenerator.js';

/**
 * ProposalCard — Shows the generated proposal after pipeline completion.
 * Allows viewing, copying, and PDF download.
 *
 * @param {{ lead: object, pipelineResults: object }} props
 */
export function ProposalCard({ lead, pipelineResults }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const proposal = useMemo(
    () => generateProposal(lead, pipelineResults),
    [lead, pipelineResults]
  );

  const plainText = useMemo(
    () => proposalToText(proposal),
    [proposal]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const empfMap = { kaufen: 'Kaufen', halten: 'Halten', verkaufen: 'Verkaufen' };
  const katMap = { heiss: 'Heiss', warm: 'Warm', kalt: 'Kalt', unqualifiziert: 'Unqualifiziert' };

  return (
    <GlassCard hoverable={false} className="proposal-card">
      <div className="proposal-card__header">
        <div className="proposal-card__title-row">
          <h3 className="proposal-card__title">Angebot generiert</h3>
          <GlassBadge variant="high">Fertig</GlassBadge>
        </div>
        <div className="proposal-card__actions">
          <GlassButton onClick={handleCopy}>
            {copied ? 'Kopiert ✓' : 'Text kopieren'}
          </GlassButton>
          <PdfDownloadButton type="pipeline" lead={lead} result={pipelineResults} />
          <GlassButton onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Einklappen' : 'Anzeigen'}
          </GlassButton>
        </div>
      </div>

      {expanded && (
        <div className="proposal-card__content">
          {/* Summary */}
          <div className="proposal-section">
            <h4 className="proposal-section__title">Zusammenfassung</h4>
            <p className="proposal-section__text">{proposal.zusammenfassung}</p>
          </div>

          {/* Badges row */}
          <div className="proposal-card__badges">
            {proposal.bewertung && (
              <div className="proposal-badge">
                <span className="proposal-badge__label">Score</span>
                <span className="proposal-badge__value proposal-badge__value--score">
                  {proposal.bewertung.score}/100
                </span>
                <GlassBadge>{katMap[proposal.bewertung.kategorie] || proposal.bewertung.kategorie}</GlassBadge>
              </div>
            )}
            {proposal.marktanalyse && (
              <div className="proposal-badge">
                <span className="proposal-badge__label">Empfehlung</span>
                <span className={`proposal-badge__value proposal-badge__value--${proposal.marktanalyse.empfehlung}`}>
                  {empfMap[proposal.marktanalyse.empfehlung] || proposal.marktanalyse.empfehlung}
                </span>
                <GlassBadge>{proposal.marktanalyse.konfidenz}</GlassBadge>
              </div>
            )}
            <div className="proposal-badge">
              <span className="proposal-badge__label">Deal-Wert</span>
              <span className="proposal-badge__value">{proposal.meta.dealValue}</span>
            </div>
          </div>

          {/* Market Analysis */}
          {proposal.marktanalyse && (
            <div className="proposal-section">
              <h4 className="proposal-section__title">Marktanalyse</h4>
              <p className="proposal-section__text">{proposal.marktanalyse.analyse}</p>
              {proposal.marktanalyse.chancen.length > 0 && (
                <div className="proposal-section__list">
                  <strong>Chancen:</strong>
                  <ul>{proposal.marktanalyse.chancen.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
              {proposal.marktanalyse.risiken.length > 0 && (
                <div className="proposal-section__list">
                  <strong>Risiken:</strong>
                  <ul>{proposal.marktanalyse.risiken.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Strategic Recommendation */}
          {proposal.strategie?.empfehlung && (
            <div className="proposal-section">
              <h4 className="proposal-section__title">Strategische Empfehlung</h4>
              <p className="proposal-section__text">{proposal.strategie.empfehlung}</p>
            </div>
          )}

          {/* Next Steps */}
          {proposal.naechsteSchritte.length > 0 && (
            <div className="proposal-section">
              <h4 className="proposal-section__title">Naechste Schritte</h4>
              <ol className="proposal-section__steps">
                {proposal.naechsteSchritte.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Recommendations */}
          {proposal.empfehlungen.length > 0 && (
            <div className="proposal-section">
              <h4 className="proposal-section__title">Handlungsempfehlungen</h4>
              <ol className="proposal-section__steps">
                {proposal.empfehlungen.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
