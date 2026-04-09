import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { StockSearch } from '../market/StockSearch.jsx';
import { StockQuoteCard } from '../market/StockQuoteCard.jsx';
import { StockOverview } from '../market/StockOverview.jsx';
import { CryptoTable } from '../market/CryptoTable.jsx';
import { PriceChart } from '../market/PriceChart.jsx';
import { MarketIntelligence } from '../market/MarketIntelligence.jsx';
import { useMarketData } from '../../hooks/useMarketData.js';
import {
  fetchStockOverview,
  fetchStockQuote,
  fetchStockChart,
  fetchCryptoMarkets,
  fetchCryptoChart,
} from '../../services/marketApi.js';
import { de } from '../../i18n/de.js';
import { STOCK_CHART_RANGES } from '../../../../shared/constants.js';

export function MarktPage() {
  const t = de.pages.markt;

  // --- State ---
  const [activeTab, setActiveTab] = useState('stocks');
  const [stockSymbol, setStockSymbol] = useState('');
  const [selectedCryptoId, setSelectedCryptoId] = useState(null);
  const [chartRange, setChartRange] = useState('6mo');
  const [cryptoChartDays, setCryptoChartDays] = useState(30);

  // --- Data fetching ---
  const stockOverview = useMarketData(
    () => fetchStockOverview(),
    { enabled: activeTab === 'stocks' }
  );

  const stockQuote = useMarketData(
    () => fetchStockQuote(stockSymbol),
    { enabled: !!stockSymbol, deps: [stockSymbol] }
  );

  const stockChart = useMarketData(
    () => fetchStockChart(stockSymbol, chartRange),
    { enabled: !!stockSymbol, deps: [stockSymbol, chartRange], pollInterval: 0 }
  );

  const cryptoMarkets = useMarketData(
    () => fetchCryptoMarkets(),
    { enabled: activeTab === 'crypto' }
  );

  const cryptoChart = useMarketData(
    () => fetchCryptoChart(selectedCryptoId, 'eur', cryptoChartDays),
    { enabled: !!selectedCryptoId, deps: [selectedCryptoId, cryptoChartDays], pollInterval: 0 }
  );

  // --- Handlers ---
  const handleStockSearch = (sym) => {
    setStockSymbol(sym.toUpperCase());
    setChartRange('6mo');
  };

  const handleOverviewSelect = (sym) => {
    setStockSymbol(sym);
    setChartRange('6mo');
  };

  return (
    <div className="market-page">
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>

      {/* Market Intelligence Summary */}
      <MarketIntelligence />

      {/* Tab bar */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          {t.tabs.stocks}
        </button>
        <button
          className={`market-tab ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          {t.tabs.crypto}
        </button>
      </div>

      {/* Stocks tab */}
      {activeTab === 'stocks' && (
        <>
          <StockSearch onSearch={handleStockSearch} />

          {/* Selected stock detail */}
          {stockSymbol ? (
            <>
              <StockQuoteCard
                quote={stockQuote.data}
                loading={stockQuote.loading}
                error={stockQuote.error}
              />
              <GlassCard hoverable={false}>
                <div className="chart-range-buttons">
                  {STOCK_CHART_RANGES.map((r) => (
                    <GlassButton
                      key={r}
                      variant={chartRange === r ? 'primary' : 'default'}
                      onClick={() => setChartRange(r)}
                    >
                      {t.chart.ranges[r]}
                    </GlassButton>
                  ))}
                </div>
                {stockChart.data && stockChart.data.length > 0 ? (
                  <PriceChart data={stockChart.data} type="candlestick" />
                ) : null}
                {stockChart.loading && <p className="market-loading">{t.loading}</p>}
                {stockChart.error && <p className="market-error">{stockChart.error}</p>}
                {!stockChart.loading && !stockChart.error && (!stockChart.data || stockChart.data.length === 0) && (
                  <p className="market-loading">{t.chart.noData}</p>
                )}
              </GlassCard>
              <GlassButton
                variant="default"
                onClick={() => setStockSymbol('')}
                style={{ marginTop: '0.75rem' }}
              >
                ← Zurueck zur Uebersicht
              </GlassButton>
            </>
          ) : (
            /* Stock overview table */
            <StockOverview
              stocks={stockOverview.data}
              loading={stockOverview.loading}
              error={stockOverview.error}
              onSelectStock={handleOverviewSelect}
            />
          )}
        </>
      )}

      {/* Crypto tab */}
      {activeTab === 'crypto' && (
        <>
          <CryptoTable
            coins={cryptoMarkets.data}
            loading={cryptoMarkets.loading}
            error={cryptoMarkets.error}
            onSelectCoin={setSelectedCryptoId}
          />
          {selectedCryptoId && (
            <GlassCard hoverable={false}>
              <h3>{t.chart.title} - {selectedCryptoId}</h3>
              {cryptoChart.data && cryptoChart.data.length > 0 ? (
                <PriceChart data={cryptoChart.data} type="candlestick" />
              ) : null}
              {cryptoChart.loading && <p className="market-loading">{t.loading}</p>}
              {cryptoChart.error && <p className="market-error">{cryptoChart.error}</p>}
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

export default MarktPage;
