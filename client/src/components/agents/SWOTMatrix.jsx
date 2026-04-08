import { de } from '../../i18n/de.js';

/**
 * SWOTMatrix — 2x2 CSS grid displaying SWOT analysis.
 *
 * Quadrants:
 * - Top-left: Staerken (blue)
 * - Top-right: Schwaechen (red)
 * - Bottom-left: Chancen (green)
 * - Bottom-right: Risiken (orange)
 *
 * @param {{ result: object }} props
 */
export function SWOTMatrix({ result }) {
  if (!result) return null;

  const t = de.pages?.aiAgents?.results || {};

  const quadrants = [
    { key: 'staerken', label: t.staerken || 'Staerken', items: result.staerken, modifier: 'blue' },
    { key: 'schwaechen', label: t.schwaechen || 'Schwaechen', items: result.schwaechen, modifier: 'red' },
    { key: 'chancen', label: t.chancen || 'Chancen', items: result.chancen, modifier: 'green' },
    { key: 'risiken', label: t.risiken || 'Risiken', items: result.risiken, modifier: 'orange' },
  ];

  return (
    <div className="swot-result">
      {/* Title */}
      {result.titel && (
        <h3 className="swot-result__title">{result.titel}</h3>
      )}

      {/* Zusammenfassung */}
      {result.zusammenfassung && (
        <p className="agent-text swot-result__summary">{result.zusammenfassung}</p>
      )}

      {/* 2x2 Matrix */}
      <div className="swot-matrix">
        {quadrants.map((q) => (
          <div key={q.key} className={`swot-matrix__quadrant swot-matrix__quadrant--${q.modifier}`}>
            <h4 className="swot-matrix__quadrant-title">{q.label}</h4>
            {q.items?.length > 0 ? (
              <ul className="swot-matrix__list">
                {q.items.map((item, i) => (
                  <li key={i} className="swot-matrix__item">
                    <span className="swot-matrix__item-punkt">{item.punkt}</span>
                    <span className="swot-matrix__item-details">{item.details}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="swot-matrix__empty">--</p>
            )}
          </div>
        ))}
      </div>

      {/* Handlungsempfehlung */}
      {result.handlungsempfehlung && (
        <div className="swot-result__recommendation">
          <h4 className="agent-section-title">{t.handlungsempfehlung || 'Handlungsempfehlung'}</h4>
          <p className="agent-text agent-text--highlight">{result.handlungsempfehlung}</p>
        </div>
      )}
    </div>
  );
}
