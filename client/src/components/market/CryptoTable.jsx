import { GlassCard } from '../ui/GlassCard.jsx';
import { de } from '../../i18n/de.js';

/**
 * Format a currency value with German locale in EUR.
 */
function formatEur(value) {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
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
 * Crypto market overview table.
 *
 * @param {object} props
 * @param {Array} props.coins - Array of normalized coin objects
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message
 * @param {Function} props.onSelectCoin - Called with coin ID when row clicked
 */
export function CryptoTable({ coins, loading, error, onSelectCoin }) {
  const t = de.pages.markt.crypto;

  if (loading && !coins) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-loading">{de.pages.markt.loading}</p>
      </GlassCard>
    );
  }

  if (error && !coins) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-error">{de.pages.markt.error}</p>
      </GlassCard>
    );
  }

  if (!coins || coins.length === 0) return null;

  return (
    <GlassCard hoverable={false} className="crypto-table-card">
      <div className="crypto-table-wrapper">
        <table className="crypto-table">
          <thead>
            <tr>
              <th>{t.rank}</th>
              <th>{t.name}</th>
              <th>{t.symbol}</th>
              <th className="text-right">{t.price}</th>
              <th className="text-right">{t.change24h}</th>
              <th className="text-right">{t.marketCap}</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => {
              const isPositive = (coin.change24h ?? 0) >= 0;
              const changeClass = isPositive ? 'price-positive' : 'price-negative';
              const changeSign = isPositive ? '+' : '';

              return (
                <tr
                  key={coin.id}
                  className="crypto-table__row"
                  onClick={() => onSelectCoin(coin.id)}
                  title={t.selectCoin}
                >
                  <td>{coin.rank}</td>
                  <td className="crypto-table__name-cell">
                    {coin.image && (
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="crypto-table__coin-image"
                        width="24"
                        height="24"
                        loading="lazy"
                      />
                    )}
                    <span>{coin.name}</span>
                  </td>
                  <td>{coin.symbol}</td>
                  <td className="text-right">{formatEur(coin.price)}</td>
                  <td className={`text-right ${changeClass}`}>
                    {changeSign}
                    {coin.change24h != null
                      ? new Intl.NumberFormat('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(coin.change24h)
                      : '-'}
                    %
                  </td>
                  <td className="text-right">{formatLargeNumber(coin.marketCap)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
