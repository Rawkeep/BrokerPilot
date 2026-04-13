/**
 * Frontend API client for /api/trading/* endpoints.
 */
import { API_BASE } from '../config.js';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function tryFetch(url, options) {
  try {
    return await apiFetch(url, options);
  } catch {
    return null;
  }
}

// --- Portfolio ---

export function createPortfolio(initialCapital = 10000) {
  return apiFetch(`${API_BASE}/api/trading/portfolio`, {
    method: 'POST',
    body: JSON.stringify({ initialCapital }),
  });
}

export function loadPortfolio(data) {
  return apiFetch(`${API_BASE}/api/trading/portfolio/load`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchPortfolio(id) {
  return tryFetch(`${API_BASE}/api/trading/portfolio/${id}`);
}

export function fetchPortfolioSummary(id) {
  return tryFetch(`${API_BASE}/api/trading/portfolio/${id}/summary`);
}

export function deletePortfolio(id) {
  return apiFetch(`${API_BASE}/api/trading/portfolio/${id}`, { method: 'DELETE' });
}

// --- Positions ---

export function openPosition(portfolioId, trade) {
  return apiFetch(`${API_BASE}/api/trading/portfolio/${portfolioId}/positions`, {
    method: 'POST',
    body: JSON.stringify(trade),
  });
}

export function closePosition(portfolioId, positionId, exitPrice, reason) {
  return apiFetch(
    `${API_BASE}/api/trading/portfolio/${portfolioId}/positions/${positionId}/close`,
    { method: 'POST', body: JSON.stringify({ exitPrice, reason }) }
  );
}

// --- Auto-Trader ---

export function fetchAutoTraderStatus() {
  return tryFetch(`${API_BASE}/api/trading/auto-trader/status`);
}

export function startAutoTrader(config) {
  return apiFetch(`${API_BASE}/api/trading/auto-trader/start`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export function stopAutoTrader() {
  return apiFetch(`${API_BASE}/api/trading/auto-trader/stop`, { method: 'POST' });
}

export function runManualCycle() {
  return apiFetch(`${API_BASE}/api/trading/auto-trader/cycle`, { method: 'POST' });
}

// --- Market Scan ---

export function fetchMarketScan() {
  return tryFetch(`${API_BASE}/api/trading/scan`);
}

// --- Commodities ---

export function fetchCommodities() {
  return tryFetch(`${API_BASE}/api/trading/commodities`);
}

export function fetchCommodityQuote(symbol) {
  return tryFetch(`${API_BASE}/api/trading/commodities/${encodeURIComponent(symbol)}`);
}

export function fetchCommodityChart(symbol, range = '6mo') {
  return tryFetch(
    `${API_BASE}/api/trading/commodities/${encodeURIComponent(symbol)}/chart?range=${encodeURIComponent(range)}`
  );
}
