import clsx from 'clsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { de } from '../../i18n/de.js';

const KATEGORIE_COLORS = {
  heiss: 'high',
  warm: 'medium',
  kalt: 'low',
  unqualifiziert: 'default',
};

const KATEGORIE_LABELS = {
  heiss: 'Heiss',
  warm: 'Warm',
  kalt: 'Kalt',
  unqualifiziert: 'Unqualifiziert',
};

const BEWERTUNG_COLORS = {
  positiv: 'agent-factor--positiv',
  neutral: 'agent-factor--neutral',
  negativ: 'agent-factor--negativ',
};

function getScoreColor(score) {
  if (score >= 76) return '#22c55e';
  if (score >= 51) return '#eab308';
  if (score >= 26) return '#f97316';
  return '#ef4444';
}

function getScoreTrackColor(score) {
  if (score >= 76) return 'rgba(34,197,94,0.15)';
  if (score >= 51) return 'rgba(234,179,8,0.15)';
  if (score >= 26) return 'rgba(249,115,22,0.15)';
  return 'rgba(239,68,68,0.15)';
}

/**
 * LeadQualifierResult — Displays lead qualification score and analysis.
 *
 * @param {{ result: object }} props
 */
export function LeadQualifierResult({ result }) {
  if (!result) return null;

  const t = de.pages?.aiAgents?.results || {};
  const color = getScoreColor(result.score);
  const trackColor = getScoreTrackColor(result.score);

  // SVG circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="lead-qualifier-result">
      {/* Score gauge */}
      <div className="lead-qualifier-result__score-section">
        <div className="agent-score-gauge">
          <svg viewBox="0 0 120 120" className="agent-score-gauge__svg">
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              className="agent-score-gauge__progress"
            />
          </svg>
          <div className="agent-score-gauge__value" style={{ color }}>
            {result.score}
          </div>
        </div>

        <div className="lead-qualifier-result__meta">
          <GlassBadge variant={KATEGORIE_COLORS[result.kategorie] || 'default'}>
            {KATEGORIE_LABELS[result.kategorie] || result.kategorie}
          </GlassBadge>
        </div>
      </div>

      {/* Zusammenfassung */}
      {result.zusammenfassung && (
        <div className="lead-qualifier-result__section">
          <h4 className="agent-section-title">{t.zusammenfassung || 'Zusammenfassung'}</h4>
          <p className="agent-text">{result.zusammenfassung}</p>
        </div>
      )}

      {/* Begruendung */}
      {result.begruendung?.length > 0 && (
        <div className="lead-qualifier-result__section">
          <h4 className="agent-section-title">{t.begruendung || 'Begruendung'}</h4>
          <ul className="agent-factor-list">
            {result.begruendung.map((item, i) => (
              <li key={i} className={clsx('agent-factor', BEWERTUNG_COLORS[item.bewertung])}>
                <span className="agent-factor__name">{item.faktor}</span>
                <span className="agent-factor__details">{item.details}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empfohlene Aktionen */}
      {result.empfohleneAktionen?.length > 0 && (
        <div className="lead-qualifier-result__section">
          <h4 className="agent-section-title">{t.empfohleneAktionen || 'Empfohlene Aktionen'}</h4>
          <ol className="agent-action-list">
            {result.empfohleneAktionen.map((action, i) => (
              <li key={i} className="agent-action-list__item">{action}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Naechster Schritt */}
      {result.naechsterSchritt && (
        <div className="lead-qualifier-result__next-step">
          <h4 className="agent-section-title">{t.naechsterSchritt || 'Naechster Schritt'}</h4>
          <p className="agent-text agent-text--highlight">{result.naechsterSchritt}</p>
        </div>
      )}
    </div>
  );
}
