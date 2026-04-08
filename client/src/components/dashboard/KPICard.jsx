import { GlassCard } from '../ui/GlassCard.jsx';

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('de-DE');

/**
 * Formats a KPI value based on its type.
 * @param {number} value
 * @param {'currency'|'percent'|'number'} format
 * @returns {string}
 */
export function formatKPIValue(value, format) {
  switch (format) {
    case 'currency':
      return currencyFormatter.format(value);
    case 'percent':
      return percentFormatter.format(value);
    default:
      return numberFormatter.format(value);
  }
}

const TREND_ICONS = {
  up: { symbol: '\u2191', className: 'kpi-card__trend--up' },
  down: { symbol: '\u2193', className: 'kpi-card__trend--down' },
  neutral: { symbol: '\u2192', className: 'kpi-card__trend--neutral' },
};

/**
 * Single KPI metric card.
 * @param {{ title: string, value: number, format: 'currency'|'percent'|'number', icon?: string, subtitle?: string, trend?: 'up'|'down'|'neutral' }} props
 */
export function KPICard({ title, value, format = 'number', icon, subtitle, trend }) {
  const formatted = formatKPIValue(value, format);
  const trendInfo = trend ? TREND_ICONS[trend] : null;

  return (
    <GlassCard hoverable={false} className="kpi-card">
      {icon && <span className="kpi-card__icon">{icon}</span>}
      <span className="kpi-card__title">{title}</span>
      <span className="kpi-card__value">
        {formatted}
        {trendInfo && (
          <span className={`kpi-card__trend ${trendInfo.className}`}>
            {trendInfo.symbol}
          </span>
        )}
      </span>
      {subtitle && <span className="kpi-card__subtitle">{subtitle}</span>}
    </GlassCard>
  );
}
