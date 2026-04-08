import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pipeline-chart__tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.dataKey === 'value'
            ? `${de.crm.kpis.stageValue || 'Wert'}: ${eurFormatter.format(entry.value)}`
            : `${de.crm.kpis.leadCount || 'Leads'}: ${entry.value}`}
        </div>
      ))}
    </div>
  );
}

/**
 * Bar chart showing leads per pipeline stage with value overlay.
 * @param {{ data: Array<{ stage: string, label: string, count: number, value: number }> }} props
 */
export function PipelineChart({ data }) {
  if (!data?.length || data.every((d) => d.count === 0)) {
    return (
      <GlassCard hoverable={false} className="pipeline-chart">
        <h3 className="dashboard-section__title">
          {de.crm.kpis.pipelineOverview || 'Pipeline-Uebersicht'}
        </h3>
        <p className="dashboard-section__empty">{de.crm.kpis.noData || 'Keine Daten vorhanden'}</p>
      </GlassCard>
    );
  }

  /* Read CSS variable for accent color at render time */
  let accentColor = '#3b82f6';
  let secondaryColor = '#9ca3af';
  if (typeof document !== 'undefined') {
    const styles = getComputedStyle(document.documentElement);
    accentColor = styles.getPropertyValue('--color-accent').trim() || accentColor;
    secondaryColor = styles.getPropertyValue('--color-text-secondary').trim() || secondaryColor;
  }

  return (
    <GlassCard hoverable={false} className="pipeline-chart">
      <h3 className="dashboard-section__title">
        {de.crm.kpis.pipelineOverview || 'Pipeline-Uebersicht'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar yAxisId="left" dataKey="count" fill={accentColor} radius={[4, 4, 0, 0]} name="Leads" />
          <Bar yAxisId="right" dataKey="value" fill={secondaryColor} radius={[4, 4, 0, 0]} opacity={0.5} name="Wert" />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
