import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

/**
 * Visual funnel showing lead count narrowing through pipeline stages.
 * Uses a CSS-based funnel with decreasing-width bars.
 *
 * @param {{ data: Array<{ stage: string, label: string, count: number, value: number }>, total: number }} props
 */
export function ConversionFunnel({ data, total }) {
  if (!data?.length || total === 0) {
    return (
      <GlassCard hoverable={false} className="conversion-funnel">
        <h3 className="dashboard-section__title">
          {de.crm.kpis.conversionFunnel || 'Conversion-Trichter'}
        </h3>
        <p className="dashboard-section__empty">{de.crm.kpis.noData || 'Keine Daten vorhanden'}</p>
      </GlassCard>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <GlassCard hoverable={false} className="conversion-funnel">
      <h3 className="dashboard-section__title">
        {de.crm.kpis.conversionFunnel || 'Conversion-Trichter'}
      </h3>
      <div className="funnel">
        {data.map((stage, idx) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 8);
          const pctOfTotal = total > 0 ? ((stage.count / total) * 100).toFixed(1) : '0.0';
          /* Gradient from accent to success across stages */
          const ratio = data.length > 1 ? idx / (data.length - 1) : 0;
          const opacity = 1 - ratio * 0.4;

          return (
            <div key={stage.stage} className="funnel__row">
              <span className="funnel__label">{stage.label}</span>
              <div className="funnel__bar-track">
                <div
                  className="funnel__bar"
                  style={{ width: `${widthPct}%`, opacity }}
                />
              </div>
              <span className="funnel__count">{stage.count}</span>
              <span className="funnel__pct">{pctOfTotal}%</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
