import { useState, useMemo, useCallback, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';

const WATCHLIST_KEY = 'brokerpilot:watchlist';

/**
 * Format price with currency.
 */
function formatPrice(value, currency = 'EUR') {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format large numbers with Mrd./Mio. abbreviations.
 */
function formatMarketCap(value) {
  if (value == null) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} Bio.`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd.`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} Mio.`;
  return new Intl.NumberFormat('de-DE').format(value);
}

// Categorize symbols
const INDICES = new Set(['^GDAXI', '^DJI', '^GSPC', '^IXIC', '^STOXX50E', '^FTSE', '^N225', '^HSI']);

const INDEX_LABELS = {
  '^GDAXI': 'DAX 40',
  '^DJI': 'Dow Jones',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
  '^STOXX50E': 'Euro Stoxx 50',
  '^FTSE': 'FTSE 100',
  '^N225': 'Nikkei 225',
  '^HSI': 'Hang Seng',
};

// Suggestions for quick-add watchlist
const WATCHLIST_SUGGESTIONS = [
  { symbol: 'BLK', name: 'BlackRock', region: 'US' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', region: 'US' },
  { symbol: 'GS', name: 'Goldman Sachs', region: 'US' },
  { symbol: 'UBS', name: 'UBS Group', region: 'CH' },
  { symbol: 'DB', name: 'Deutsche Bank', region: 'US' },
  { symbol: 'HSBA.L', name: 'HSBC', region: 'UK' },
  { symbol: 'BABA', name: 'Alibaba', region: 'CN' },
  { symbol: '005930.KS', name: 'Samsung', region: 'KR' },
  { symbol: '7203.T', name: 'Toyota', region: 'JP' },
  { symbol: '9984.T', name: 'SoftBank', region: 'JP' },
  { symbol: '0700.HK', name: 'Tencent', region: 'HK' },
  { symbol: '9988.HK', name: 'Alibaba (HK)', region: 'HK' },
  { symbol: 'SHEL.L', name: 'Shell', region: 'UK' },
  { symbol: 'AZN.L', name: 'AstraZeneca', region: 'UK' },
  { symbol: 'MC.PA', name: 'LVMH', region: 'FR' },
  { symbol: 'OR.PA', name: "L'Oreal", region: 'FR' },
  { symbol: 'NESN.SW', name: 'Nestle', region: 'CH' },
  { symbol: 'ASML.AS', name: 'ASML', region: 'NL' },
  { symbol: 'NOVO-B.CO', name: 'Novo Nordisk', region: 'DK' },
  { symbol: 'ROG.SW', name: 'Roche', region: 'CH' },
  { symbol: 'TCS.NS', name: 'Tata Consulting', region: 'IN' },
  { symbol: 'RELIANCE.NS', name: 'Reliance', region: 'IN' },
  { symbol: 'VOW3.DE', name: 'Volkswagen', region: 'DE' },
  { symbol: 'RHM.DE', name: 'Rheinmetall', region: 'DE' },
  { symbol: 'DHL.DE', name: 'DHL Group', region: 'DE' },
];

function loadWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch { return []; }
}

function saveWatchlist(list) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

/**
 * Stock overview table with indices banner, watchlist and sortable stock list.
 */
export function StockOverview({ stocks, loading, error, onSelectStock }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('changePercent');
  const [sortDir, setSortDir] = useState('desc');
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [addSymbol, setAddSymbol] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Persist watchlist
  useEffect(() => { saveWatchlist(watchlist); }, [watchlist]);

  const toggleWatchlist = useCallback((symbol) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      return [...prev, symbol];
    });
  }, []);

  const addToWatchlist = useCallback((symbol) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    setWatchlist((prev) => prev.includes(sym) ? prev : [...prev, sym]);
    setAddSymbol('');
  }, []);

  const indices = useMemo(
    () => (stocks || []).filter((s) => INDICES.has(s.symbol)),
    [stocks]
  );

  const stockList = useMemo(() => {
    let list = (stocks || []).filter((s) => !INDICES.has(s.symbol));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q)
      );
    }
    // Put watchlist items first
    list.sort((a, b) => {
      const aW = watchlist.includes(a.symbol) ? 1 : 0;
      const bW = watchlist.includes(b.symbol) ? 1 : 0;
      if (aW !== bW) return bW - aW;
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [stocks, search, sortBy, sortDir, watchlist]);

  // Suggestions filtered by what's not already in stock list
  const availableSuggestions = useMemo(() => {
    const existingSymbols = new Set((stocks || []).map((s) => s.symbol));
    return WATCHLIST_SUGGESTIONS.filter(
      (s) => !existingSymbols.has(s.symbol) && !watchlist.includes(s.symbol)
    );
  }, [stocks, watchlist]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  if (loading && !stocks) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-loading">Marktdaten werden geladen...</p>
      </GlassCard>
    );
  }

  if (error && !stocks) {
    return (
      <GlassCard hoverable={false}>
        <p className="market-error">Fehler beim Laden der Uebersicht</p>
      </GlassCard>
    );
  }

  if (!stocks || stocks.length === 0) return null;

  return (
    <>
      {/* Indices Banner */}
      {indices.length > 0 && (
        <div className="stock-indices-banner">
          {indices.map((idx) => {
            const isPos = (idx.changePercent ?? 0) >= 0;
            return (
              <div
                key={idx.symbol}
                className="stock-index-card"
                onClick={() => onSelectStock(idx.symbol)}
              >
                <span className="stock-index-name">
                  {INDEX_LABELS[idx.symbol] || idx.name || idx.symbol}
                </span>
                <span className="stock-index-price">
                  {formatPrice(idx.price, idx.currency || 'EUR')}
                </span>
                <span className={`stock-index-change ${isPos ? 'price-positive' : 'price-negative'}`}>
                  {isPos ? '+' : ''}
                  {idx.changePercent != null
                    ? idx.changePercent.toFixed(2)
                    : '-'}
                  %
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Watchlist Quick-Add */}
      <GlassCard hoverable={false} className="watchlist-add-card">
        <div className="watchlist-add-header">
          <h3 className="watchlist-add-title">Watchlist</h3>
          <span className="watchlist-add-count">{watchlist.length} Favoriten</span>
        </div>
        <div className="watchlist-add-row">
          <GlassInput
            value={addSymbol}
            onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addToWatchlist(addSymbol)}
            placeholder="Symbol hinzufuegen (z.B. BLK, 7203.T, SHEL.L)..."
            aria-label="Aktie zur Watchlist hinzufuegen"
          />
          <GlassButton variant="primary" onClick={() => addToWatchlist(addSymbol)}>
            +
          </GlassButton>
          <GlassButton
            variant="default"
            onClick={() => setShowSuggestions((v) => !v)}
          >
            {showSuggestions ? 'Weniger' : 'Vorschlaege'}
          </GlassButton>
        </div>

        {/* Watchlist chips */}
        {watchlist.length > 0 && (
          <div className="watchlist-chips">
            {watchlist.map((sym) => (
              <span key={sym} className="watchlist-chip">
                {sym}
                <button
                  className="watchlist-chip-remove"
                  onClick={(e) => { e.stopPropagation(); toggleWatchlist(sym); }}
                  title="Entfernen"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick-add suggestions */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="watchlist-suggestions">
            {availableSuggestions.map((s) => (
              <button
                key={s.symbol}
                className="watchlist-suggestion"
                onClick={() => addToWatchlist(s.symbol)}
                title={`${s.name} (${s.region})`}
              >
                <span className="watchlist-suggestion-symbol">{s.symbol}</span>
                <span className="watchlist-suggestion-name">{s.name}</span>
                <span className="watchlist-suggestion-region">{s.region}</span>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Stock Table */}
      <GlassCard hoverable={false} className="crypto-table-card">
        <div className="crypto-search">
          <GlassInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Aktie suchen (Name oder Symbol)..."
            aria-label="Aktien suchen"
          />
          <span className="crypto-search__count">
            {stockList.length} Aktien
          </span>
        </div>

        <div className="crypto-table-wrapper">
          <table className="crypto-table">
            <thead>
              <tr>
                <th style={{ width: '2rem' }}></th>
                <th>Symbol</th>
                <th>Name</th>
                <th
                  className="text-right stock-th-sortable"
                  onClick={() => handleSort('price')}
                >
                  Kurs{sortIcon('price')}
                </th>
                <th
                  className="text-right stock-th-sortable"
                  onClick={() => handleSort('changePercent')}
                >
                  24h{sortIcon('changePercent')}
                </th>
                <th
                  className="text-right stock-th-sortable"
                  onClick={() => handleSort('marketCap')}
                >
                  Marktk.{sortIcon('marketCap')}
                </th>
                <th className="text-right">Boerse</th>
              </tr>
            </thead>
            <tbody>
              {stockList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="crypto-table__no-results">
                    Keine Ergebnisse fuer &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                stockList.map((stock) => {
                  const isPos = (stock.changePercent ?? 0) >= 0;
                  const isFav = watchlist.includes(stock.symbol);
                  return (
                    <tr
                      key={stock.symbol}
                      className={`crypto-table__row ${isFav ? 'watchlist-row' : ''}`}
                      onClick={() => onSelectStock(stock.symbol)}
                      title="Klicken fuer Details & Chart"
                    >
                      <td>
                        <button
                          className={`watchlist-star ${isFav ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.symbol); }}
                          title={isFav ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufuegen'}
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                      </td>
                      <td>
                        <strong>{stock.symbol}</strong>
                      </td>
                      <td>{stock.name || '-'}</td>
                      <td className="text-right">
                        {formatPrice(stock.price, stock.currency || 'EUR')}
                      </td>
                      <td
                        className={`text-right ${isPos ? 'price-positive' : 'price-negative'}`}
                      >
                        {isPos ? '+' : ''}
                        {stock.changePercent != null
                          ? stock.changePercent.toFixed(2)
                          : '-'}
                        %
                      </td>
                      <td className="text-right">
                        {formatMarketCap(stock.marketCap)}
                      </td>
                      <td className="text-right">{stock.currency || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
