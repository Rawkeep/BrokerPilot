import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';

// vi.hoisted ensures these are available when vi.mock factories run (hoisted to top)
const { mockCache, mockGetQuote, mockGetStockChart, mockGetCryptoMarkets, mockGetCryptoOHLC } = vi.hoisted(() => ({
  mockCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    stats: vi.fn(),
  },
  mockGetQuote: vi.fn(),
  mockGetStockChart: vi.fn(),
  mockGetCryptoMarkets: vi.fn(),
  mockGetCryptoOHLC: vi.fn(),
}));

vi.mock('../../server/services/yahooFinance.js', () => ({
  getQuote: mockGetQuote,
  getStockChart: mockGetStockChart,
}));

vi.mock('../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: mockGetCryptoMarkets,
  getCryptoOHLC: mockGetCryptoOHLC,
}));

vi.mock('../../server/index.js', () => ({
  cache: mockCache,
}));

import { marketRouter } from '../../server/routes/market.js';

describe('market routes', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use('/api', marketRouter);
    // Error handler so unhandled route errors return JSON instead of HTML
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.get.mockReturnValue(null); // default: no cache hit
  });

  // --- Stock Quote Route ---
  describe('GET /api/market/stocks/:symbol', () => {
    const mockQuote = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 178.72,
      change: 2.35,
      changePercent: 1.33,
      volume: 55_123_456,
      marketCap: 2_800_000_000_000,
      peRatio: 29.5,
      high52: 199.62,
      low52: 124.17,
      currency: 'USD',
    };

    it('returns stock quote with 200 status', async () => {
      mockGetQuote.mockResolvedValue(mockQuote);

      const res = await fetch(`${baseUrl}/api/market/stocks/AAPL`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.price).toBe(178.72);
    });

    it('caches the result and returns cached data on second call', async () => {
      mockGetQuote.mockResolvedValue(mockQuote);

      // First call: cache miss
      await fetch(`${baseUrl}/api/market/stocks/AAPL`);
      expect(mockGetQuote).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith('stock:quote:AAPL', mockQuote);

      // Second call: cache hit
      mockCache.get.mockReturnValue(mockQuote);
      const res = await fetch(`${baseUrl}/api/market/stocks/AAPL`);
      const data = await res.json();

      expect(mockGetQuote).toHaveBeenCalledTimes(1); // not called again
      expect(data.symbol).toBe('AAPL');
    });

    it('returns 400 for invalid symbol with special characters', async () => {
      const res = await fetch(`${baseUrl}/api/market/stocks/../etc`);
      // Express may interpret ../etc differently, test with clear invalid chars
      const res2 = await fetch(`${baseUrl}/api/market/stocks/A%3CSCRIPT%3E`);
      expect(res2.status).toBe(400);
    });

    it('returns 400 for symbol longer than 10 characters', async () => {
      const res = await fetch(`${baseUrl}/api/market/stocks/TOOLONGSYMBOL`);
      expect(res.status).toBe(400);
    });

    it('returns 502 when service throws', async () => {
      mockGetQuote.mockRejectedValue(new Error('Yahoo API down'));

      const res = await fetch(`${baseUrl}/api/market/stocks/AAPL`);
      const data = await res.json();

      expect(res.status).toBe(502);
      expect(data.error).toBeDefined();
    });

    it('uppercases the symbol in the cache key', async () => {
      mockGetQuote.mockResolvedValue(mockQuote);

      await fetch(`${baseUrl}/api/market/stocks/aapl`);

      expect(mockCache.get).toHaveBeenCalledWith('stock:quote:AAPL');
      expect(mockGetQuote).toHaveBeenCalledWith('AAPL');
    });
  });

  // --- Stock Chart Route ---
  describe('GET /api/market/stocks/:symbol/chart', () => {
    const mockChart = [
      { time: 1717200000, open: 170, high: 175, low: 169, close: 174 },
      { time: 1717286400, open: 174, high: 178, low: 173, close: 177 },
    ];

    it('returns chart data with 200 status', async () => {
      mockGetStockChart.mockResolvedValue(mockChart);

      const res = await fetch(`${baseUrl}/api/market/stocks/AAPL/chart?range=6mo`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].time).toBe(1717200000);
    });

    it('uses default range of 6mo', async () => {
      mockGetStockChart.mockResolvedValue(mockChart);

      await fetch(`${baseUrl}/api/market/stocks/AAPL/chart`);

      expect(mockGetStockChart).toHaveBeenCalledWith('AAPL', '6mo');
    });

    it('passes range query parameter to service', async () => {
      mockGetStockChart.mockResolvedValue(mockChart);

      await fetch(`${baseUrl}/api/market/stocks/AAPL/chart?range=1d`);

      expect(mockGetStockChart).toHaveBeenCalledWith('AAPL', '1d');
    });

    it('caches chart data with range in key', async () => {
      mockGetStockChart.mockResolvedValue(mockChart);

      await fetch(`${baseUrl}/api/market/stocks/AAPL/chart?range=1mo`);

      expect(mockCache.set).toHaveBeenCalledWith('stock:chart:AAPL:1mo', mockChart);
    });

    it('returns 502 when chart service throws', async () => {
      mockGetStockChart.mockRejectedValue(new Error('Chart unavailable'));

      const res = await fetch(`${baseUrl}/api/market/stocks/AAPL/chart`);
      expect(res.status).toBe(502);
    });
  });

  // --- Crypto Markets Route ---
  describe('GET /api/market/crypto', () => {
    const mockMarkets = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62345, change24h: 2.45, rank: 1 },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3456, change24h: -1.23, rank: 2 },
    ];

    it('returns crypto market data with 200 status', async () => {
      mockGetCryptoMarkets.mockResolvedValue(mockMarkets);

      const res = await fetch(`${baseUrl}/api/market/crypto`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('bitcoin');
    });

    it('uses default currency and perPage', async () => {
      mockGetCryptoMarkets.mockResolvedValue(mockMarkets);

      await fetch(`${baseUrl}/api/market/crypto`);

      expect(mockGetCryptoMarkets).toHaveBeenCalledWith('eur', 100);
    });

    it('passes custom query parameters', async () => {
      mockGetCryptoMarkets.mockResolvedValue(mockMarkets);

      await fetch(`${baseUrl}/api/market/crypto?currency=usd&perPage=50`);

      expect(mockGetCryptoMarkets).toHaveBeenCalledWith('usd', 50);
    });

    it('caches market data', async () => {
      mockGetCryptoMarkets.mockResolvedValue(mockMarkets);

      await fetch(`${baseUrl}/api/market/crypto`);

      expect(mockCache.set).toHaveBeenCalledWith('crypto:markets:eur:100', mockMarkets);
    });

    it('returns cached data without calling service again', async () => {
      mockCache.get.mockReturnValue(mockMarkets);

      const res = await fetch(`${baseUrl}/api/market/crypto`);
      const data = await res.json();

      expect(mockGetCryptoMarkets).not.toHaveBeenCalled();
      expect(data).toHaveLength(2);
    });

    it('returns 502 when service throws', async () => {
      mockGetCryptoMarkets.mockRejectedValue(new Error('Rate limited'));

      const res = await fetch(`${baseUrl}/api/market/crypto`);
      expect(res.status).toBe(502);
    });
  });

  // --- Crypto OHLC Route ---
  describe('GET /api/market/crypto/:id/chart', () => {
    const mockOHLC = [
      { time: 1717200000, open: 67000, high: 67500, low: 66800, close: 67200 },
    ];

    it('returns crypto OHLC data with 200 status', async () => {
      mockGetCryptoOHLC.mockResolvedValue(mockOHLC);

      const res = await fetch(`${baseUrl}/api/market/crypto/bitcoin/chart`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].time).toBe(1717200000);
    });

    it('uses default currency and days', async () => {
      mockGetCryptoOHLC.mockResolvedValue(mockOHLC);

      await fetch(`${baseUrl}/api/market/crypto/bitcoin/chart`);

      expect(mockGetCryptoOHLC).toHaveBeenCalledWith('bitcoin', 'eur', 30);
    });

    it('passes custom query parameters', async () => {
      mockGetCryptoOHLC.mockResolvedValue(mockOHLC);

      await fetch(`${baseUrl}/api/market/crypto/bitcoin/chart?currency=usd&days=7`);

      expect(mockGetCryptoOHLC).toHaveBeenCalledWith('bitcoin', 'usd', 7);
    });

    it('caches OHLC data with coinId, currency, and days in key', async () => {
      mockGetCryptoOHLC.mockResolvedValue(mockOHLC);

      await fetch(`${baseUrl}/api/market/crypto/bitcoin/chart?currency=eur&days=30`);

      expect(mockCache.set).toHaveBeenCalledWith('crypto:ohlc:bitcoin:eur:30', mockOHLC);
    });

    it('returns 400 for invalid coinId with special characters', async () => {
      const res = await fetch(`${baseUrl}/api/market/crypto/bit%3Ccoin/chart`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for coinId longer than 50 characters', async () => {
      const longId = 'a'.repeat(51);
      const res = await fetch(`${baseUrl}/api/market/crypto/${longId}/chart`);
      expect(res.status).toBe(400);
    });

    it('returns 502 when service throws', async () => {
      mockGetCryptoOHLC.mockRejectedValue(new Error('OHLC unavailable'));

      const res = await fetch(`${baseUrl}/api/market/crypto/bitcoin/chart`);
      expect(res.status).toBe(502);
    });
  });
});
