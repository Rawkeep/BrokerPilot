import { useMemo, useState } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import {
  getTeamOverview,
  getConversionByStage,
  getRevenueTimeline,
  getPipelineVelocity,
  getBrokerTypeBreakdown,
} from '../../services/analyticsService.js';

const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function TeamDashboard() {
  const leads = useLeadStore((s) => s.leads);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const [period, setPeriod] = useState('all');

  const filtered = useMemo(() => {
    if (period === 'all') return leads;
    const now = Date.now();
    const ms = period === 'week' ? 7 * 86400000 : period === 'month' ? 30 * 86400000 : period === 'quarter' ? 90 * 86400000 : 365 * 86400000;
    return leads.filter((l) => now - new Date(l.createdAt).getTime() < ms);
  }, [leads, period]);

  const overview = useMemo(() => getTeamOverview(filtered), [filtered]);
  const config = brokerType ? BROKER_TYPES[brokerType] : null;
  const stages = config?.pipelineStages || [];
  const conversion = useMemo(() => getConversionByStage(filtered, stages), [filtered, stages]);
  const revenue = useMemo(() => getRevenueTimeline(leads, 6), [leads]);
  const velocity = useMemo(() => getPipelineVelocity(filtered), [filtered]);
  const breakdown = useMemo(() => getBrokerTypeBreakdown(filtered), [filtered]);
  const maxRevenue = Math.max(...revenue.map((r) => r.value), 1);
  const maxVelocity = Math.max(...velocity.map((v) => v.avgDays), 1);

  return (
    <div className="analytics">
      {/* Period Selector */}
      <div className="analytics__period-tabs">
        {[['all', 'Gesamt'], ['week', 'Woche'], ['month', 'Monat'], ['quarter', 'Quartal'], ['year', 'Jahr']].map(([k, l]) => (
          <button key={k} className={`analytics__period-tab ${period === k ? 'analytics__period-tab--active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="analytics__kpi-row">
        {[
          { label: 'Leads', value: overview.total },
          { label: 'Umsatz', value: currencyFmt.format(overview.totalValue) },
          { label: 'Abschlussquote', value: `${overview.conversionRate.toFixed(1)}%` },
          { label: 'Ø Deal', value: currencyFmt.format(overview.avgDealSize) },
          { label: 'Aktiv', value: overview.activeCount },
        ].map((kpi) => (
          <GlassCard key={kpi.label} hoverable={false} className="analytics__kpi-card">
            <span className="analytics__kpi-value">{kpi.value}</span>
            <span className="analytics__kpi-label">{kpi.label}</span>
          </GlassCard>
        ))}
      </div>

      {/* Conversion Funnel */}
      {conversion.length > 0 && (
        <GlassCard hoverable={false} className="analytics__section">
          <h4 className="analytics__section-title">Conversion Funnel</h4>
          <div className="analytics__funnel">
            {conversion.map((s) => (
              <div key={s.id} className="analytics__funnel-row">
                <span className="analytics__funnel-label">{s.label}</span>
                <div className="analytics__funnel-bar-track">
                  <div className="analytics__funnel-bar" style={{ width: `${Math.max(s.percentage, 2)}%` }} />
                </div>
                <span className="analytics__funnel-count">{s.count}</span>
                <span className="analytics__funnel-pct">{s.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Revenue Chart + Pipeline Velocity side by side */}
      <div className="analytics__charts-row">
        <GlassCard hoverable={false} className="analytics__section">
          <h4 className="analytics__section-title">Umsatz-Entwicklung</h4>
          <div className="analytics__bar-chart">
            {revenue.map((r) => (
              <div key={r.month} className="analytics__bar-col">
                <div className="analytics__bar-wrapper">
                  <div className="analytics__bar" style={{ height: `${(r.value / maxRevenue) * 100}%` }} />
                </div>
                <span className="analytics__bar-label">{r.month}</span>
                <span className="analytics__bar-value">{r.count} Leads</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hoverable={false} className="analytics__section">
          <h4 className="analytics__section-title">Pipeline-Geschwindigkeit</h4>
          <div className="analytics__velocity">
            {velocity.map((v) => (
              <div key={v.stage} className="analytics__velocity-row">
                <span className="analytics__velocity-label">{v.stage}</span>
                <div className="analytics__velocity-bar-track">
                  <div className="analytics__velocity-bar" style={{ width: `${(v.avgDays / maxVelocity) * 100}%` }} />
                </div>
                <span className="analytics__velocity-days">{v.avgDays}d</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Broker Type Breakdown */}
      {breakdown.length > 1 && (
        <GlassCard hoverable={false} className="analytics__section">
          <h4 className="analytics__section-title">Verteilung nach Broker-Typ</h4>
          <div className="analytics__breakdown">
            {breakdown.map((b) => (
              <div key={b.type} className="analytics__breakdown-item">
                <GlassBadge>{b.type}</GlassBadge>
                <span className="analytics__breakdown-count">{b.count} Leads</span>
                <span className="analytics__breakdown-value">{currencyFmt.format(b.value)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
