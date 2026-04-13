import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  createPortfolio,
  loadPortfolio,
  fetchPortfolioSummary,
  fetchAutoTraderStatus,
  startAutoTrader,
  stopAutoTrader,
  runManualCycle,
  fetchMarketScan,
  fetchCommodities,
  closePosition,
} from '../../services/tradingApi.js';

const PORTFOLIO_KEY = 'bp_trading_portfolio';
const STATUS_POLL_MS = 15_000;

export default function TradingPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [summary, setSummary] = useState(null);
  const [autoStatus, setAutoStatus] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('portfolio');
  const [capitalInput, setCapitalInput] = useState('1000');

  const aiConfig = useSettingsStore((s) => ({
    provider: s.aiProvider,
    model: s.aiModel,
    apiKey: s.getActiveApiKey?.() || '',
  }));

  // --- Init: load portfolio from localStorage ---
  useEffect(() => {
    const saved = localStorage.getItem(PORTFOLIO_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        loadPortfolio(data).then((p) => {
          setPortfolio(p);
          return fetchPortfolioSummary(p.id);
        }).then(setSummary).catch(() => {});
      } catch { /* ignore */ }
    }
  }, []);

  // --- Poll auto-trader status ---
  useEffect(() => {
    fetchAutoTraderStatus().then(setAutoStatus);
    const id = setInterval(() => {
      fetchAutoTraderStatus().then(setAutoStatus);
      if (portfolio?.id) fetchPortfolioSummary(portfolio.id).then(setSummary);
    }, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [portfolio?.id]);

  // --- Persist portfolio ---
  const persistPortfolio = useCallback((p) => {
    if (p) localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
  }, []);

  // --- Create Portfolio ---
  const handleCreatePortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const cap = Math.max(100, parseFloat(capitalInput) || 1000);
      const p = await createPortfolio(cap);
      setPortfolio(p);
      persistPortfolio(p);
      const s = await fetchPortfolioSummary(p.id);
      setSummary(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Start Auto-Trader ---
  const handleStart = async () => {
    if (!portfolio?.id) return;
    setLoading(true);
    setError(null);
    try {
      await startAutoTrader({
        portfolioId: portfolio.id,
        aiConfig,
        interval: 5 * 60 * 1000,
      });
      const s = await fetchAutoTraderStatus();
      setAutoStatus(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopAutoTrader();
      const s = await fetchAutoTraderStatus();
      setAutoStatus(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCycle = async () => {
    setLoading(true);
    setError(null);
    try {
      await runManualCycle();
      const [s, status] = await Promise.all([
        fetchPortfolioSummary(portfolio.id),
        fetchAutoTraderStatus(),
      ]);
      setSummary(s);
      setAutoStatus(status);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      const [scan, comms] = await Promise.all([fetchMarketScan(), fetchCommodities()]);
      setScanResults(scan);
      setCommodities(comms);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (positionId, currentPrice) => {
    if (!portfolio?.id) return;
    try {
      await closePosition(portfolio.id, positionId, currentPrice, 'Manuell geschlossen');
      const s = await fetchPortfolioSummary(portfolio.id);
      setSummary(s);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="trading-page">
      <h1>Trading Agent</h1>
      <p className="page-subtitle">
        Autonomer KI-Trading-Agent — Aktien, Krypto &amp; Rohstoffe
      </p>

      {error && (
        <GlassCard className="trading-error" hoverable={false}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>x</button>
        </GlassCard>
      )}

      {/* Tab bar */}
      <div className="trading-tabs">
        {['portfolio', 'scanner', 'signale', 'rohstoffe'].map((t) => (
          <button
            key={t}
            className={`trading-tab ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t);
              if (t === 'scanner' && !scanResults) handleScan();
              if (t === 'rohstoffe' && !commodities) handleScan();
            }}
          >
            {t === 'portfolio' ? 'Portfolio' : t === 'scanner' ? 'Markt-Scanner' : t === 'signale' ? 'Signale' : 'Rohstoffe'}
          </button>
        ))}
      </div>

      {/* Portfolio Tab */}
      {tab === 'portfolio' && (
        <div className="trading-section">
          {!portfolio ? (
            <GlassCard className="trading-setup" hoverable={false}>
              <h2>Paper-Trading starten</h2>
              <p>Erstelle ein virtuelles Portfolio zum Testen des Trading-Agents.</p>
              <div className="trading-setup__form">
                <label>
                  Startkapital (EUR)
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    className="glass-input"
                  />
                </label>
                <GlassButton onClick={handleCreatePortfolio} disabled={loading}>
                  {loading ? 'Erstelle...' : 'Portfolio erstellen'}
                </GlassButton>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Portfolio Summary */}
              <div className="trading-grid">
                <StatCard label="Gesamtwert" value={fmt(summary?.totalValue)} unit="EUR" />
                <StatCard label="Verfuegbar" value={fmt(summary?.capital)} unit="EUR" />
                <StatCard
                  label="Rendite"
                  value={`${summary?.totalReturn >= 0 ? '+' : ''}${(summary?.totalReturn || 0).toFixed(2)}%`}
                  variant={summary?.totalReturn >= 0 ? 'positive' : 'negative'}
                />
                <StatCard label="Offene Pos." value={summary?.openPositions || 0} />
                <StatCard
                  label="Unrealisiert"
                  value={fmt(summary?.unrealizedPnl)}
                  unit="EUR"
                  variant={(summary?.unrealizedPnl || 0) >= 0 ? 'positive' : 'negative'}
                />
                <StatCard
                  label="Realisiert"
                  value={fmt(summary?.realizedPnl)}
                  unit="EUR"
                  variant={(summary?.realizedPnl || 0) >= 0 ? 'positive' : 'negative'}
                />
                <StatCard label="Trades" value={summary?.closedTrades || 0} />
                <StatCard label="Win-Rate" value={`${(summary?.winRate || 0).toFixed(0)}%`} />
              </div>

              {/* Auto-Trader Controls */}
              <GlassCard className="trading-controls" hoverable={false}>
                <h3>Auto-Trader</h3>
                <div className="trading-controls__status">
                  <span className={`status-dot ${autoStatus?.enabled ? 'active' : ''}`} />
                  <span>{autoStatus?.enabled ? 'Aktiv' : 'Gestoppt'}</span>
                  {autoStatus?.lastScanAt && (
                    <span className="text-muted"> — Letzter Scan: {new Date(autoStatus.lastScanAt).toLocaleTimeString('de-DE')}</span>
                  )}
                </div>
                <div className="trading-controls__buttons">
                  {!autoStatus?.enabled ? (
                    <GlassButton onClick={handleStart} disabled={loading || !aiConfig.provider}>
                      Auto-Trader starten
                    </GlassButton>
                  ) : (
                    <GlassButton onClick={handleStop} disabled={loading} variant="danger">
                      Stoppen
                    </GlassButton>
                  )}
                  <GlassButton onClick={handleManualCycle} disabled={loading || !aiConfig.provider}>
                    {loading ? 'Scanne...' : 'Manueller Zyklus'}
                  </GlassButton>
                </div>
                {!aiConfig.provider && (
                  <p className="text-muted">KI-Anbieter in Einstellungen konfigurieren</p>
                )}
              </GlassCard>

              {/* Open Positions */}
              {summary?.positions?.length > 0 && (
                <GlassCard hoverable={false}>
                  <h3>Offene Positionen</h3>
                  <div className="trading-positions">
                    <table className="trading-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Klasse</th>
                          <th>Einstieg</th>
                          <th>Aktuell</th>
                          <th>Menge</th>
                          <th>P&amp;L</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.positions.map((pos) => {
                          const pnl = (pos.currentPrice - pos.entryPrice) * pos.quantity;
                          return (
                            <tr key={pos.id}>
                              <td className="font-bold">{pos.symbol}</td>
                              <td>{pos.assetClass}</td>
                              <td>{pos.entryPrice?.toFixed(2)}</td>
                              <td>{pos.currentPrice?.toFixed(2)}</td>
                              <td>{pos.quantity?.toFixed(4)}</td>
                              <td className={pnl >= 0 ? 'text-positive' : 'text-negative'}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                              </td>
                              <td>
                                <button
                                  className="close-btn"
                                  onClick={() => handleClosePosition(pos.id, pos.currentPrice)}
                                >
                                  Schliessen
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}

              {/* Recent Actions */}
              {autoStatus?.recentActions?.length > 0 && (
                <GlassCard hoverable={false}>
                  <h3>Letzte Aktionen</h3>
                  <div className="trading-log">
                    {autoStatus.recentActions.slice().reverse().map((a, i) => (
                      <div key={i} className="trading-log__entry">
                        <span className="text-muted">{new Date(a.timestamp).toLocaleTimeString('de-DE')}</span>
                        <span className="font-bold">{a.action}</span>
                        {a.details?.symbol && <span>{a.details.symbol}</span>}
                        {a.details?.pnl && <span className={parseFloat(a.details.pnl) >= 0 ? 'text-positive' : 'text-negative'}>{a.details.pnl} EUR</span>}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      )}

      {/* Scanner Tab */}
      {tab === 'scanner' && (
        <div className="trading-section">
          <GlassCard hoverable={false}>
            <div className="trading-scanner__header">
              <h2>Markt-Scanner</h2>
              <GlassButton onClick={handleScan} disabled={loading}>
                {loading ? 'Scanne...' : 'Neu scannen'}
              </GlassButton>
            </div>
            {scanResults?.stats && (
              <p className="text-muted">
                {scanResults.stats.stocksScanned} Aktien, {scanResults.stats.cryptoScanned} Krypto, {scanResults.stats.commoditiesScanned} Rohstoffe gescannt
              </p>
            )}
          </GlassCard>
          {scanResults?.candidates?.length > 0 && (
            <div className="trading-candidates">
              {scanResults.candidates.map((c, i) => (
                <GlassCard key={`${c.symbol}-${i}`} className="trading-candidate">
                  <div className="trading-candidate__header">
                    <span className="trading-candidate__rank">#{i + 1}</span>
                    <span className="font-bold">{c.symbol}</span>
                    <span className={`trading-badge trading-badge--${c.assetClass}`}>{c.assetClass}</span>
                  </div>
                  <div className="trading-candidate__name">{c.name || c.displayName}</div>
                  <div className="trading-candidate__stats">
                    <span>{c.price?.toFixed(2)} {c.currency || 'EUR'}</span>
                    <span className={`${(c.changePercent || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(c.changePercent || 0) >= 0 ? '+' : ''}{(c.changePercent || 0).toFixed(2)}%
                    </span>
                    <span className="text-muted">Score: {(c.opportunityScore || 0).toFixed(1)}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signals Tab */}
      {tab === 'signale' && (
        <div className="trading-section">
          <GlassCard hoverable={false}>
            <h2>KI-Handelssignale</h2>
            {autoStatus?.lastSignals?.length > 0 ? (
              <div className="trading-signals">
                {autoStatus.lastSignals.map((sig, i) => (
                  <GlassCard key={`${sig.symbol}-${i}`} className={`trading-signal trading-signal--${sig.signal}`}>
                    <div className="trading-signal__header">
                      <span className="font-bold">{sig.symbol}</span>
                      <span className={`trading-badge trading-badge--${sig.signal}`}>{sig.signal.toUpperCase()}</span>
                      <span className={`trading-badge trading-badge--konfidenz-${sig.konfidenz}`}>{sig.konfidenz}</span>
                    </div>
                    <div className="trading-signal__name">{sig.assetName}</div>
                    <div className="trading-signal__prices">
                      <span>Einstieg: {sig.einstiegspreis?.toFixed(2)}</span>
                      <span>Ziel: {sig.zielpreis?.toFixed(2)}</span>
                      <span>Stop: {sig.stopLoss?.toFixed(2)}</span>
                    </div>
                    <div className="trading-signal__meta">
                      <span className={`trading-badge trading-badge--${sig.risikoLevel}`}>Risiko: {sig.risikoLevel}</span>
                      <span>{sig.zeitrahmen}</span>
                      <span>{sig.positionsgroesse}% Allokation</span>
                    </div>
                    <p className="trading-signal__reason">{sig.begruendung}</p>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-muted">Noch keine Signale. Starte den Auto-Trader oder fuehre einen manuellen Zyklus aus.</p>
            )}
          </GlassCard>
        </div>
      )}

      {/* Commodities Tab */}
      {tab === 'rohstoffe' && (
        <div className="trading-section">
          <GlassCard hoverable={false}>
            <h2>Rohstoffe</h2>
            <p className="text-muted">Gold, Oel, Gas, Silber, Kupfer, Agrar-Rohstoffe</p>
          </GlassCard>
          {commodities?.grouped && Object.entries(commodities.grouped).map(([category, items]) => (
            <GlassCard key={category} hoverable={false}>
              <h3 className="trading-commodity-cat">{categoryLabel(category)}</h3>
              <div className="trading-commodity-grid">
                {items.map((c) => (
                  <div key={c.symbol} className="trading-commodity">
                    <span className="font-bold">{c.displayName || c.name}</span>
                    <span>{c.price?.toFixed(2)} {c.unit || c.currency || 'USD'}</span>
                    <span className={`${(c.changePercent || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(c.changePercent || 0) >= 0 ? '+' : ''}{(c.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function StatCard({ label, value, unit, variant }) {
  return (
    <GlassCard className={`stat-card ${variant ? `stat-card--${variant}` : ''}`} hoverable={false}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">
        {value}{unit && <span className="stat-card__unit"> {unit}</span>}
      </div>
    </GlassCard>
  );
}

function fmt(val) {
  if (val == null) return '—';
  return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function categoryLabel(cat) {
  const map = {
    edelmetalle: 'Edelmetalle',
    energie: 'Energie',
    industriemetalle: 'Industriemetalle',
    agrar: 'Agrar-Rohstoffe',
    sonstige: 'Sonstige',
  };
  return map[cat] || cat;
}
