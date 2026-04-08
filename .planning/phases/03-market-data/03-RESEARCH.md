# Phase 3: Market Data - Research

**Researched:** 2026-04-08
**Domain:** Financial data APIs, charting, server-side caching
**Confidence:** HIGH

## Summary

Phase 3 adds live financial market data to BrokerPilot: stock quotes via Yahoo Finance (yahoo-finance2), crypto prices via CoinGecko API v3, and professional charts via lightweight-charts v5. The project already has the server-side caching infrastructure (createCacheMiddleware with 5-min TTL) and an Express 5 backend with a Vite dev proxy from `/api` to the Express server. The MarktPage currently renders a placeholder GlassCard.

The architecture is a server-side proxy pattern: Express routes fetch from Yahoo Finance and CoinGecko, cache responses in-memory with the existing cache middleware, and serve normalized JSON to the React frontend. The frontend renders data in GlassCards (glassmorphism design system) and uses lightweight-charts v5 for candlestick/line charts. All UI strings go into `client/src/i18n/de.js`.

**Primary recommendation:** Build Express routes at `/api/market/stocks/:symbol`, `/api/market/stocks/:symbol/chart`, `/api/market/crypto`, and `/api/market/crypto/:id/chart` that proxy, cache (5-min TTL), and normalize external API data. Use `yahoo-finance2` v3 for stocks and direct `fetch` for CoinGecko (no wrapper). Use lightweight-charts v5 with the new `addSeries(CandlestickSeries)` API via React refs.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MKT-01 | Live stock quotes and basic fundamentals via Yahoo Finance | yahoo-finance2 v3 `quote()` and `quoteSummary()` modules provide price, PE, market cap, 52wk range. Server-side only (CORS restriction). |
| MKT-02 | Live crypto prices, market cap, 24h changes via CoinGecko | CoinGecko `/coins/markets` endpoint returns price, market_cap, price_change_percentage_24h for up to 250 coins in one call. Free tier: 30 calls/min with demo key. |
| MKT-03 | Server-side caching with 5-min TTL | Existing `createCacheMiddleware` in `server/middleware/cache.js` already implements TTL-based in-memory cache. Pass `CACHE_DEFAULT_TTL` (5 min) from `shared/constants.js`. |
| MKT-04 | Financial charts (candlestick/line) via lightweight-charts | lightweight-charts v5 `createChart` + `addSeries(CandlestickSeries)` / `addSeries(LineSeries)`. Data from yahoo-finance2 `chart()` module and CoinGecko `/coins/{id}/ohlc`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: React 18 + Vite 8 (Frontend), Express.js (Backend) -- no SSR, SPA only
- **APIs**: Only free/freemium APIs (Yahoo Finance, CoinGecko) -- no paid tiers
- **Sprache**: Deutsche UI, Code/Docs auf Englisch
- **Design**: Custom Glassmorphism CSS system (GlassCard, GlassButton, etc.) -- no Tailwind
- **Data**: localStorage-first, no cloud DB in v1
- **No Socket.io**: Use fetch + setInterval polling (financial APIs are rate-limited anyway)
- **CoinGecko**: Use direct fetch, NOT the outdated `coingecko-api` npm package
- **CSP**: Helmet with restrictive CSP -- `connectSrc` currently set to `'self'` only, must be updated to allow CoinGecko API calls from server (server-side fetch, so CSP does not apply to server-to-API calls, only browser-to-server)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yahoo-finance2 | ^3.14.0 | Stock quotes, historical OHLC, fundamentals | Free, no API key, ESM-native, actively maintained. Server-side only (CORS). [VERIFIED: github.com/gadicc/yahoo-finance2] |
| lightweight-charts | ^5.1.0 | Candlestick and line charts | 35KB, canvas-based, built by TradingView. Only serious FOSS option for financial charts. Already in project STACK.md. [CITED: tradingview.github.io/lightweight-charts/docs] |
| Direct CoinGecko REST | N/A (fetch) | Crypto prices, market cap, OHLC | Free tier: 30 calls/min, 10K credits/month with demo key. Official v3 API well-documented. [CITED: docs.coingecko.com] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| createCacheMiddleware | (existing) | In-memory TTL cache | Already built in Phase 1. Use for all market data routes. [VERIFIED: server/middleware/cache.js] |
| date-fns | ^4.x (installed) | Date formatting for chart labels | German locale dates in tooltips, axis labels. Already installed. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yahoo-finance2 | Alpha Vantage | Requires API key registration. Broader forex data but more setup. yahoo-finance2 is zero-config. |
| Direct CoinGecko fetch | coingecko-api npm | Outdated wrapper, last meaningful update years ago. Direct fetch is cleaner. [ASSUMED] |
| lightweight-charts | Recharts candlestick | Recharts has no native candlestick series. lightweight-charts is purpose-built for financial data. |

**Installation:**
```bash
npm install yahoo-finance2 lightweight-charts
```

Note: `lightweight-charts` may already be installed per STACK.md. Verify with `npm ls lightweight-charts`.

## Architecture Patterns

### Recommended Project Structure
```
server/
  routes/
    health.js          # (existing)
    market.js           # NEW: /api/market/* routes
  services/
    yahooFinance.js     # NEW: yahoo-finance2 wrapper with error handling
    coinGecko.js        # NEW: CoinGecko API client with fetch
  middleware/
    cache.js            # (existing)

client/src/
  components/
    market/
      StockQuoteCard.jsx    # Single stock quote display
      CryptoTable.jsx       # Crypto market overview table
      PriceChart.jsx        # Reusable lightweight-charts wrapper
      StockSearch.jsx       # Symbol search input
    pages/
      MarktPage.jsx         # (existing, replace placeholder)
  hooks/
    useMarketData.js        # Fetch + polling hook for market data
  services/
    marketApi.js            # Frontend API client for /api/market/*
```

### Pattern 1: Server-Side Proxy with Cache
**What:** Express routes fetch external API data, cache it, and serve normalized JSON to the frontend.
**When to use:** Always for external financial APIs (yahoo-finance2 cannot run in browser due to CORS).

```javascript
// server/routes/market.js
import { Router } from 'express';
import { cache } from '../index.js';
import { getQuote, getChart } from '../services/yahooFinance.js';

export const marketRouter = Router();

marketRouter.get('/market/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `stock:quote:${symbol.toUpperCase()}`;

  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await getQuote(symbol);
    cache.set(cacheKey, data); // uses CACHE_DEFAULT_TTL (5 min)
    res.json(data);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});
```
[ASSUMED: pattern based on existing cache.js API and Express 5 async error handling]

### Pattern 2: lightweight-charts v5 React Integration
**What:** Imperative chart API controlled via useRef + useEffect.
**When to use:** All financial chart rendering.

```javascript
// client/src/components/market/PriceChart.jsx
import { useRef, useEffect } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

export function PriceChart({ data, type = 'candlestick', height = 400 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: 'var(--color-text-secondary)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
    });

    const series = type === 'candlestick'
      ? chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
      : chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
        });

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => chart.remove();
  }, [data, type, height]);

  return <div ref={containerRef} />;
}
```
[CITED: tradingview.github.io/lightweight-charts/tutorials/react/simple]

### Pattern 3: Polling Hook for Market Data
**What:** Custom hook that fetches market data on mount and polls at a configurable interval.
**When to use:** All market data display components.

```javascript
// client/src/hooks/useMarketData.js
import { useState, useEffect, useCallback } from 'react';

export function useMarketData(url, { pollInterval = 60000, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const id = setInterval(fetchData, pollInterval);
    return () => clearInterval(id);
  }, [fetchData, pollInterval, enabled]);

  return { data, loading, error, refetch: fetchData };
}
```
[ASSUMED: standard React polling pattern]

### Anti-Patterns to Avoid
- **Calling yahoo-finance2 from the browser:** It uses Node.js HTTP and sets cookies. CORS will block it. Always proxy through Express. [VERIFIED: yahoo-finance2 README states "not possible to run in the browser"]
- **Using the outdated `coingecko-api` npm package:** Wraps old API endpoints, unmaintained. Use direct fetch. [CITED: CLAUDE.md / STACK.md]
- **Creating a WebSocket connection for "real-time" data:** Financial APIs are rate-limited (30 calls/min CoinGecko, unknown for Yahoo). Polling every 60s via setInterval is simpler and sufficient. [CITED: CLAUDE.md]
- **Hardcoding chart colors without theme awareness:** Use CSS variables from the design system for chart backgrounds. Chart series colors (green/red for candles) are financial conventions and can be hardcoded.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stock data fetching | Custom Yahoo scraper | yahoo-finance2 | Handles cookies, rate limiting, response validation, Yahoo endpoint changes |
| Financial charts | SVG/Canvas chart from scratch | lightweight-charts v5 | Crosshair, zoom, pan, touch, responsive, tooltips all built in |
| In-memory cache | Custom Map + setTimeout | createCacheMiddleware (existing) | Already built, tested, has TTL and stats |
| Number formatting | Custom locale formatter | `Intl.NumberFormat('de-DE', ...)` | Browser-native, handles EUR/USD, thousands separators, decimal commas |
| Date formatting for charts | Manual date string building | date-fns with `de` locale | Already installed, handles German month names and relative times |

**Key insight:** The project already has the cache middleware and the glassmorphism design system. Phase 3 is mostly about wiring up external APIs and converting data formats. Do not reinvent infrastructure.

## Common Pitfalls

### Pitfall 1: CoinGecko Rate Limit Exhaustion
**What goes wrong:** Free tier is 30 calls/min (demo key) or ~10-15 calls/min (no key). Polling from multiple browser tabs or refreshing rapidly exhausts the limit.
**Why it happens:** Each frontend poll triggers a server fetch if cache is expired. Multiple users or tabs multiply calls.
**How to avoid:** Server-side cache with 5-min TTL ensures at most 1 API call per 5 minutes per unique query, regardless of how many clients request it. Use the demo API key (free registration) for the stable 30 calls/min limit rather than the anonymous 10-15 calls/min.
**Warning signs:** HTTP 429 responses from CoinGecko, empty data in UI.

### Pitfall 2: yahoo-finance2 Intermittent Failures
**What goes wrong:** Yahoo Finance is an unofficial API. Endpoints change, responses are inconsistent, and rate limiting is undocumented.
**Why it happens:** Yahoo does not maintain a public API contract. yahoo-finance2 scrapes/wraps undocumented endpoints.
**How to avoid:** Always wrap yahoo-finance2 calls in try/catch. Return cached stale data on failure (stale-while-revalidate pattern). Show a user-friendly error state, not a crash.
**Warning signs:** Sudden `null` fields in quote responses, HTTP 403/429 errors.

### Pitfall 3: lightweight-charts Memory Leak in React
**What goes wrong:** Chart instance not cleaned up on component unmount, causing memory leaks with repeated navigation.
**Why it happens:** `createChart` creates a canvas element and animation frame loop. Without `chart.remove()` in the useEffect cleanup, these persist.
**How to avoid:** Always call `chart.remove()` in the useEffect cleanup function. Store chart ref in `useRef` and check before creating a new one.
**Warning signs:** Increasing memory usage when navigating to/from MarktPage, duplicate chart canvases.

### Pitfall 4: lightweight-charts v5 API Breaking Change
**What goes wrong:** Using v4 `chart.addCandlestickSeries()` syntax which does not exist in v5.
**Why it happens:** Most tutorials and Stack Overflow answers reference v4 API.
**How to avoid:** v5 uses `chart.addSeries(CandlestickSeries, options)` with imported series type constructors. Always import `CandlestickSeries` or `LineSeries` from `lightweight-charts`.
**Warning signs:** `chart.addCandlestickSeries is not a function` error.

### Pitfall 5: CSP connectSrc Blocking API Calls
**What goes wrong:** Frontend fetch to `/api/market/*` works in dev (Vite proxy) but fails in production.
**Why it happens:** In production, Express serves the SPA and API from the same origin, so CSP `connectSrc: 'self'` is fine. But if the architecture changes to separate origins, it would break.
**How to avoid:** Keep the server-side proxy pattern. Frontend only calls `/api/market/*` (same origin). Express calls external APIs server-side where CSP does not apply.
**Warning signs:** CSP violation errors in browser console.

### Pitfall 6: Data Format Mismatch Between APIs and Charts
**What goes wrong:** CoinGecko OHLC returns `[timestamp_ms, open, high, low, close]` arrays. lightweight-charts expects `{ time, open, high, low, close }` objects with `time` as Unix seconds or `'YYYY-MM-DD'` string.
**Why it happens:** Different APIs use different time formats (milliseconds vs seconds vs ISO strings).
**How to avoid:** Normalize data in the Express service layer before caching. All cached data should already be in lightweight-charts format.
**Warning signs:** Empty charts, "invalid time" console errors from lightweight-charts.

## Code Examples

### Yahoo Finance Quote (Server)
```javascript
// server/services/yahooFinance.js
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export async function getQuote(symbol) {
  const quote = await yf.quote(symbol);
  return {
    symbol: quote.symbol,
    name: quote.shortName || quote.longName,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    peRatio: quote.trailingPE,
    high52: quote.fiftyTwoWeekHigh,
    low52: quote.fiftyTwoWeekLow,
    currency: quote.currency,
  };
}

export async function getStockChart(symbol, range = '6mo') {
  const result = await yf.chart(symbol, {
    period1: getStartDate(range),
    interval: range === '1d' ? '5m' : range === '5d' ? '15m' : '1d',
  });
  // Normalize to lightweight-charts candlestick format
  return result.quotes.map((q) => ({
    time: Math.floor(new Date(q.date).getTime() / 1000), // Unix seconds
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
  }));
}

function getStartDate(range) {
  const now = new Date();
  const offsets = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
  now.setDate(now.getDate() - (offsets[range] || 180));
  return now;
}
```
[ASSUMED: based on yahoo-finance2 v3 API from npm docs and GitHub README]

### CoinGecko Crypto Markets (Server)
```javascript
// server/services/coinGecko.js
const BASE_URL = 'https://api.coingecko.com/api/v3';

export async function getCryptoMarkets(vsCurrency = 'eur', perPage = 25) {
  const url = `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error('CoinGecko API error'), { status: res.status });
  const coins = await res.json();
  return coins.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    change24h: c.price_change_percentage_24h,
    rank: c.market_cap_rank,
  }));
}

export async function getCryptoOHLC(coinId, vsCurrency = 'eur', days = 30) {
  const url = `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=${vsCurrency}&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error('CoinGecko OHLC error'), { status: res.status });
  const raw = await res.json();
  // CoinGecko returns [[timestamp_ms, open, high, low, close], ...]
  return raw.map(([ts, open, high, low, close]) => ({
    time: Math.floor(ts / 1000), // Convert ms to Unix seconds
    open,
    high,
    low,
    close,
  }));
}
```
[CITED: docs.coingecko.com/reference/coins-markets, docs.coingecko.com/reference/coins-id-ohlc]

### CoinGecko API Base URL Note
**Public (no key):** `https://api.coingecko.com/api/v3` -- 10-15 calls/min
**Demo (free key):** `https://api.coingecko.com/api/v3` with header `x-cg-demo-api-key: YOUR_KEY` -- 30 calls/min, 10K credits/month

The demo key is recommended for stable rate limits. Registration is free at coingecko.com/en/api.
[CITED: docs.coingecko.com/docs/common-errors-rate-limit]

### German Number Formatting
```javascript
// Use Intl.NumberFormat for currency and number display
const formatCurrency = (value, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value);

const formatPercent = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);

const formatLargeNumber = (value) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd.`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} Mio.`;
  return new Intl.NumberFormat('de-DE').format(value);
};

// formatCurrency(1234.56) => "1.234,56 EUR"  (German: dot thousands, comma decimals)
// formatPercent(3.45) => "3,45 %"
// formatLargeNumber(1500000000) => "1,5 Mrd."
```
[ASSUMED: standard Intl API usage for de-DE locale]

### lightweight-charts Time Formats
```javascript
// lightweight-charts v5 accepts three time formats:
// 1. UTCTimestamp (number): Unix timestamp in seconds
{ time: 1642427876, value: 80.01 }

// 2. BusinessDay (object):
{ time: { year: 2019, month: 4, day: 11 }, value: 80.01 }

// 3. String ('YYYY-MM-DD'):
{ time: '2019-04-11', value: 80.01 }

// For OHLC candlestick:
{ time: 1642427876, open: 10, high: 10.63, low: 9.49, close: 9.55 }

// For line chart:
{ time: '2019-04-11', value: 80.01 }
```
[CITED: tradingview.github.io/lightweight-charts/docs/series-types]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `chart.addCandlestickSeries()` | `chart.addSeries(CandlestickSeries, opts)` | lightweight-charts v5 (2024) | Must import series types explicitly |
| yahoo-finance2 v2 default export | yahoo-finance2 v3 class constructor `new YahooFinance()` | v3 (2024-2025) | Import and instantiation changed |
| CoinGecko unlimited public API | CoinGecko credit-based with demo key | 2024 | Free tier now requires key for stable rate limits |

**Deprecated/outdated:**
- `coingecko-api` npm package: Outdated, wraps old API. Use direct fetch. [CITED: CLAUDE.md]
- `chart.addLineSeries()` / `chart.addCandlestickSeries()`: Removed in lightweight-charts v5. Use `chart.addSeries(SeriesType, opts)`. [CITED: tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | yahoo-finance2 v3 uses `new YahooFinance()` constructor | Code Examples | Initialization code may differ; check actual import at install time |
| A2 | yahoo-finance2 `chart()` module returns `.quotes[]` with `{ date, open, high, low, close }` | Code Examples | Data shape may differ; verify after install by logging response |
| A3 | CoinGecko anonymous rate limit is 10-15 calls/min | Pitfalls | May be lower or higher; register for demo key to be safe |
| A4 | lightweight-charts chart options accept `'transparent'` for background color | Architecture Patterns | May need `rgba(0,0,0,0)` instead; verify after rendering |
| A5 | CoinGecko OHLC endpoint returns `[[timestamp_ms, open, high, low, close], ...]` array format | Code Examples | Shape may have changed; verify with actual API call during implementation |

## Open Questions

1. **CoinGecko Demo API Key**
   - What we know: Free tier gives 30 calls/min with a demo key, 10-15 without.
   - What's unclear: Should the demo key be hardcoded server-side or configured via env var?
   - Recommendation: Use `COINGECKO_API_KEY` env var. Default to anonymous (no key) for zero-config dev experience. Document key registration in README.

2. **Stock Symbol Search**
   - What we know: yahoo-finance2 has a `search()` module.
   - What's unclear: Should users type symbols directly or have autocomplete search?
   - Recommendation: Start with direct symbol input (e.g., "AAPL", "SAP.DE"). Add search autocomplete as enhancement if time permits.

3. **Crypto vs Stock Display Split**
   - What we know: MarktPage needs both stock and crypto views.
   - What's unclear: Tabs? Side-by-side? Separate routes?
   - Recommendation: Use tabs within MarktPage ("Aktien" / "Krypto") for simplicity. Both views share the same PriceChart component.

4. **Chart Range Selector**
   - What we know: Users need different time ranges (1D, 5D, 1M, 3M, 6M, 1Y).
   - What's unclear: Button group or dropdown?
   - Recommendation: GlassButton group with range labels. This is standard in financial UIs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | vitest config via vite.config.js |
| Quick run command | `npm test` (vitest run --reporter=verbose) |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MKT-01 | Stock quote fetch + cache + response shape | unit | `npx vitest run tests/server/yahooFinance.test.js -t "quote"` | Wave 0 |
| MKT-01 | Stock route returns cached data | unit | `npx vitest run tests/server/marketRoutes.test.js -t "stock"` | Wave 0 |
| MKT-02 | Crypto markets fetch + normalize | unit | `npx vitest run tests/server/coinGecko.test.js -t "markets"` | Wave 0 |
| MKT-02 | Crypto route returns cached data | unit | `npx vitest run tests/server/marketRoutes.test.js -t "crypto"` | Wave 0 |
| MKT-03 | Cache middleware returns cached data within TTL | unit | `npx vitest run tests/server/cache.test.js` | Exists |
| MKT-04 | Chart data normalized to lightweight-charts format | unit | `npx vitest run tests/server/yahooFinance.test.js -t "chart"` | Wave 0 |
| MKT-04 | PriceChart component renders without error | unit | `npx vitest run tests/components/PriceChart.test.jsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before /gsd-verify-work

### Wave 0 Gaps
- [ ] `tests/server/yahooFinance.test.js` -- covers MKT-01, MKT-04 (mock yahoo-finance2)
- [ ] `tests/server/coinGecko.test.js` -- covers MKT-02 (mock fetch)
- [ ] `tests/server/marketRoutes.test.js` -- covers MKT-01, MKT-02, MKT-03 (integration with cache)
- [ ] `tests/components/PriceChart.test.jsx` -- covers MKT-04 (mock lightweight-charts createChart)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A -- market data is public |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A -- all market endpoints are public |
| V5 Input Validation | yes | Validate symbol parameter (alphanumeric + dot, max 10 chars). Validate coinId against allowlist or pattern. |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SSRF via symbol parameter | Tampering | Validate symbol is alphanumeric. yahoo-finance2 handles URL construction internally. |
| Upstream API response injection | Tampering | Normalize and pick only expected fields before caching/returning. Never pass raw upstream JSON to client. |
| Rate limit exhaustion (DoS) | Denial of Service | express-rate-limit (already configured at 100 req/15 min). Server-side cache prevents upstream API abuse. |
| CoinGecko image URL XSS | Spoofing | CSP `imgSrc` already restricts to `'self'`, `data:`, `blob:`. Add `*.coingecko.com` if using CoinGecko coin images. |

## Sources

### Primary (HIGH confidence)
- [yahoo-finance2 GitHub README](https://github.com/gadicc/yahoo-finance2) -- modules list, CORS limitation, ESM support, v3 constructor
- [lightweight-charts official docs](https://tradingview.github.io/lightweight-charts/docs) -- v5 API, series types, data formats
- [lightweight-charts v4-to-v5 migration](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5) -- addSeries API change
- [lightweight-charts React tutorial](https://tradingview.github.io/lightweight-charts/tutorials/react/simple) -- useRef/useEffect pattern
- Project codebase: `server/middleware/cache.js`, `server/index.js`, `shared/constants.js` -- existing cache infrastructure

### Secondary (MEDIUM confidence)
- [CoinGecko API docs - coins/markets](https://docs.coingecko.com/reference/coins-markets) -- endpoint parameters, response shape
- [CoinGecko API docs - coins OHLC](https://docs.coingecko.com/reference/coins-id-ohlc) -- OHLC data format
- [CoinGecko rate limits](https://docs.coingecko.com/docs/common-errors-rate-limit) -- demo key vs public tier
- [CoinGecko pricing](https://www.coingecko.com/en/api/pricing) -- free tier: 10K credits/month
- [yahoo-finance2 JSR docs](https://jsr.io/@gadicc/yahoo-finance2/doc/modules/chart) -- chart module API

### Tertiary (LOW confidence)
- yahoo-finance2 v3 constructor syntax `new YahooFinance()` -- from WebSearch, not verified with actual import
- CoinGecko anonymous rate limit "10-15 calls/min" -- from support article, actual limit varies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries confirmed via npm/official docs, aligned with STACK.md decisions
- Architecture: HIGH -- server-side proxy is the only viable pattern (yahoo-finance2 cannot run in browser)
- Pitfalls: HIGH -- well-documented issues (v5 migration, rate limits, CORS)
- Code examples: MEDIUM -- yahoo-finance2 v3 API shape assumed from docs, needs verification at install time

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable libraries, but CoinGecko rate limits can change)
