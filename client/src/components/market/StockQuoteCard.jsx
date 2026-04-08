import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

/**
 * Format a currency value with German locale.
 */
function formatCurrency(value, currency = 'USD') {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value);
}

/**
 * Format a large number with Mrd./Mio. abbreviations.
 */
function formatLargeNumber(value) {
  if (value == null) return '-';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd.`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} Mio.`;
  return new Intl.NumberFormat('de-DE').format(value);
}

/**
 * Format a percentage with German locale.
 */
function formatPercent(value) {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Displays a stock quote inside a GlassCard.
 *
 * @param {object} props
 * @param {object} props.quote - Quote data from API
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message
 */
export function StockQuoteCard({ quote, loading, error }) {
  const t = de.pages.markt.quote;

  if (loading && !quote) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-loading">{de.pages.markt.loading}</p>
      </GlassCard>
    );
  }

  if (error && !quote) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-error">{de.pages.markt.error}</p>
      </GlassCard>
    );
  }

  if (!quote) return null;

  const isPositive = (quote.change ?? 0) >= 0;
  const changeClass = isPositive ? 'price-positive' : 'price-negative';
  const changeSign = isPositive ? '+' : '';

  return (
    <GlassCard hoverable={false} className="stock-quote-card">
      <div className="stock-quote-header">
        <h2>{quote.symbol}</h2>
        <span className="stock-quote-name">{quote.name}</span>
      </div>

      <div className="stock-quote-price">
        <span className="stock-quote-price__value">
          {formatCurrency(quote.price, quote.currency || 'USD')}
        </span>
        <span className={`stock-quote-price__change ${changeClass}`}>
          {changeSign}{formatCurrency(quote.change, quote.currency || 'USD')}{' '}
          ({changeSign}{formatPercent(quote.changePercent)})
        </span>
      </div>

      <div className="stock-quote-grid">
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.volume}</span>
          <span className="stock-quote-field__value">{formatLargeNumber(quote.volume)}</span>
        </div>
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.marketCap}</span>
          <span className="stock-quote-field__value">{formatLargeNumber(quote.marketCap)}</span>
        </div>
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.peRatio}</span>
          <span className="stock-quote-field__value">
            {quote.peRatio != null ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(quote.peRatio) : '-'}
          </span>
        </div>
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.high52}</span>
          <span className="stock-quote-field__value">{formatCurrency(quote.high52, quote.currency || 'USD')}</span>
        </div>
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.low52}</span>
          <span className="stock-quote-field__value">{formatCurrency(quote.low52, quote.currency || 'USD')}</span>
        </div>
        <div className="stock-quote-field">
          <span className="stock-quote-field__label">{t.currency}</span>
          <span className="stock-quote-field__value">{quote.currency || '-'}</span>
        </div>
      </div>
    </GlassCard>
  );
}
