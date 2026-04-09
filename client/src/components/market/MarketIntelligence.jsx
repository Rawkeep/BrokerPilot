import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { API_BASE } from '../../config.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { DEMO_INTELLIGENCE_REPORT } from '../../data/demoMarketData.js';

const SENTIMENT_MAP = { positiv: '📈', negativ: '📉', seitwaerts: '➡️', bullish: '📈', bearish: '📉', neutral: '➡️' };
const SEVERITY_MAP = { critical: 'high', warning: 'medium', info: 'low' };

export function MarketIntelligence() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const brokerType = useSettingsStore((s) => s.brokerType);

  useEffect(() => {
    loadReport();
    const interval = setInterval(loadReport, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [brokerType]);

  async function loadReport() {
    try {
      const res = await fetch(`${API_BASE}/api/intelligence/daily?brokerType=${brokerType || 'investment'}`);
      if (!res.ok) throw new Error('Fehler');
      setReport(await res.json());
      setError(null);
    } catch {
      // Fallback to demo data when backend unavailable
      setReport(DEMO_INTELLIGENCE_REPORT);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <GlassCard hoverable={false} className="mi"><p className="mi__loading">Marktanalyse wird geladen...</p></GlassCard>;
  if (error) return <GlassCard hoverable={false} className="mi"><p className="mi__error">Fehler: {error}</p></GlassCard>;
  if (!report) return null;

  return (
    <div className="mi">
      {/* Summary */}
      <GlassCard hoverable={false} className="mi__summary-card">
        <div className="mi__summary-header">
          <h3 className="mi__title">Markt-Intelligence</h3>
          <span className="mi__date">{report.date?.split('T')[0]}</span>
        </div>
        <p className="mi__summary-text">{report.summary}</p>
      </GlassCard>

      {/* Indices */}
      <div className="mi__indices-grid">
        {(report.indices || report.trends || []).slice(0, 8).map((idx) => (
          <div key={idx.symbol} className="mi__index-card">
            <span className="mi__index-name">{idx.name}</span>
            <span className="mi__index-price">{idx.price?.toLocaleString('de-DE')}</span>
            <span className={`mi__index-change ${(idx.changePercent || 0) >= 0 ? 'mi__index-change--up' : 'mi__index-change--down'}`}>
              {(idx.changePercent || 0) >= 0 ? '+' : ''}{idx.changePercent?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Gainers / Losers */}
      <div className="mi__movers">
        {report.topGainers?.length > 0 && (
          <GlassCard hoverable={false} className="mi__movers-card">
            <h4 className="mi__movers-title">Top Gewinner</h4>
            {report.topGainers.map((s) => (
              <div key={s.symbol} className="mi__mover-row">
                <span className="mi__mover-symbol">{s.symbol}</span>
                <span className="mi__mover-name">{s.name}</span>
                <span className="mi__mover-change mi__mover-change--up">+{s.changePercent?.toFixed(2)}%</span>
              </div>
            ))}
          </GlassCard>
        )}
        {report.topLosers?.length > 0 && (
          <GlassCard hoverable={false} className="mi__movers-card">
            <h4 className="mi__movers-title">Top Verlierer</h4>
            {report.topLosers.map((s) => (
              <div key={s.symbol} className="mi__mover-row">
                <span className="mi__mover-symbol">{s.symbol}</span>
                <span className="mi__mover-name">{s.name}</span>
                <span className="mi__mover-change mi__mover-change--down">{s.changePercent?.toFixed(2)}%</span>
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      {/* Alerts */}
      {report.alerts?.length > 0 && (
        <GlassCard hoverable={false} className="mi__alerts-card">
          <h4 className="mi__alerts-title">Warnungen</h4>
          {report.alerts.map((a, i) => (
            <div key={i} className="mi__alert-row">
              <GlassBadge variant={SEVERITY_MAP[a.severity] || 'low'}>{a.severity}</GlassBadge>
              <div className="mi__alert-info">
                <span className="mi__alert-title">{a.title}</span>
                <span className="mi__alert-desc">{a.description}</span>
              </div>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Breakouts */}
      {report.breakouts?.length > 0 && (
        <GlassCard hoverable={false} className="mi__alerts-card">
          <h4 className="mi__alerts-title">Breakout-Signale</h4>
          {report.breakouts.map((b, i) => (
            <div key={i} className="mi__alert-row">
              <GlassBadge variant="low">{b.label}</GlassBadge>
              <span className="mi__alert-desc">{b.symbol}: {b.detail}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}
