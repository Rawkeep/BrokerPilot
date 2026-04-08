import clsx from 'clsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { de } from '../../i18n/de.js';

const EMPFEHLUNG_COLORS = {
  kaufen: 'high',
  halten: 'medium',
  verkaufen: 'low',
};

const EMPFEHLUNG_LABELS = {
  kaufen: 'Kaufen',
  halten: 'Halten',
  verkaufen: 'Verkaufen',
};

const KONFIDENZ_LABELS = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
};

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const percentFmt = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFmt = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
});

/**
 * MarketAnalystResult — Displays market analysis with recommendation.
 *
 * @param {{ result: object }} props
 */
export function MarketAnalystResult({ result }) {
  if (!result) return null;

  const t = de.pages?.aiAgents?.results || {};

  return (
    <div className="market-analyst-result">
      {/* Header: Asset + Recommendation */}
      <div className="market-analyst-result__header">
        <div className="market-analyst-result__asset">
          <span className="market-analyst-result__asset-name">{result.assetName}</span>
          <span className="market-analyst-result__symbol">{result.symbol}</span>
        </div>
        <div className="market-analyst-result__badges">
          <GlassBadge
            variant={EMPFEHLUNG_COLORS[result.empfehlung] || 'default'}
            className="agent-recommendation-badge"
          >
            {EMPFEHLUNG_LABELS[result.empfehlung] || result.empfehlung}
          </GlassBadge>
          <span className="market-analyst-result__konfidenz">
            {t.konfidenz || 'Konfidenz'}: {KONFIDENZ_LABELS[result.konfidenz] || result.konfidenz}
          </span>
        </div>
      </div>

      {/* Market data grid */}
      {result.marktdaten && (
        <div className="market-analyst-result__data-grid">
          <div className="market-analyst-result__data-item">
            <span className="market-analyst-result__data-label">Preis</span>
            <span className="market-analyst-result__data-value">
              {currencyFmt.format(result.marktdaten.preis)}
            </span>
          </div>
          {result.marktdaten.veraenderung24h != null && (
            <div className="market-analyst-result__data-item">
              <span className="market-analyst-result__data-label">24h</span>
              <span
                className={clsx(
                  'market-analyst-result__data-value',
                  result.marktdaten.veraenderung24h >= 0
                    ? 'market-analyst-result__data-value--positive'
                    : 'market-analyst-result__data-value--negative'
                )}
              >
                {result.marktdaten.veraenderung24h >= 0 ? '+' : ''}
                {percentFmt.format(result.marktdaten.veraenderung24h / 100)}
              </span>
            </div>
          )}
          {result.marktdaten.marktkapitalisierung != null && (
            <div className="market-analyst-result__data-item">
              <span className="market-analyst-result__data-label">Marktkapitalisierung</span>
              <span className="market-analyst-result__data-value">
                {currencyFmt.format(result.marktdaten.marktkapitalisierung)}
              </span>
            </div>
          )}
          {result.marktdaten.kgv != null && (
            <div className="market-analyst-result__data-item">
              <span className="market-analyst-result__data-label">KGV</span>
              <span className="market-analyst-result__data-value">
                {numberFmt.format(result.marktdaten.kgv)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Analysis */}
      {result.analyse && (
        <div className="market-analyst-result__section">
          <h4 className="agent-section-title">Analyse</h4>
          <p className="agent-text">{result.analyse}</p>
        </div>
      )}

      {/* Chancen & Risiken columns */}
      <div className="market-analyst-result__columns">
        {result.chancen?.length > 0 && (
          <div className="market-analyst-result__column market-analyst-result__column--chancen">
            <h4 className="agent-section-title">{t.chancen || 'Chancen'}</h4>
            <ul className="agent-bullet-list agent-bullet-list--green">
              {result.chancen.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {result.risiken?.length > 0 && (
          <div className="market-analyst-result__column market-analyst-result__column--risiken">
            <h4 className="agent-section-title">{t.risiken || 'Risiken'}</h4>
            <ul className="agent-bullet-list agent-bullet-list--red">
              {result.risiken.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
