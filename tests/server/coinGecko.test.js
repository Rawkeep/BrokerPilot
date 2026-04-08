import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCryptoMarkets, getCryptoOHLC } from '../../server/services/coinGecko.js';

describe('coinGecko service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getCryptoMarkets', () => {
    const mockCoinGeckoResponse = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 62345.0,
        market_cap: 1_220_000_000_000,
        total_volume: 28_000_000_000,
        price_change_percentage_24h: 2.45,
        market_cap_rank: 1,
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 3456.78,
        market_cap: 415_000_000_000,
        total_volume: 15_000_000_000,
        price_change_percentage_24h: -1.23,
        market_cap_rank: 2,
      },
    ];

    it('returns normalized coin objects with expected fields', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse),
      });

      const result = await getCryptoMarkets('eur', 25);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        price: 62345.0,
        marketCap: 1_220_000_000_000,
        volume24h: 28_000_000_000,
        change24h: 2.45,
        rank: 1,
      });
    });

    it('uppercases the symbol field', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse),
      });

      const result = await getCryptoMarkets();
      expect(result[0].symbol).toBe('BTC');
      expect(result[1].symbol).toBe('ETH');
    });

    it('uses default parameters (eur, 25)', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getCryptoMarkets();

      const calledUrl = globalThis.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('vs_currency=eur');
      expect(calledUrl).toContain('per_page=25');
    });

    it('passes custom parameters', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getCryptoMarkets('usd', 50);

      const calledUrl = globalThis.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('vs_currency=usd');
      expect(calledUrl).toContain('per_page=50');
    });

    it('throws on non-ok response', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(getCryptoMarkets()).rejects.toThrow('CoinGecko API error');
    });

    it('includes API key header when COINGECKO_API_KEY is set', async () => {
      process.env.COINGECKO_API_KEY = 'test-key-123';

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getCryptoMarkets();

      const callOptions = globalThis.fetch.mock.calls[0][1];
      expect(callOptions.headers['x-cg-demo-api-key']).toBe('test-key-123');

      delete process.env.COINGECKO_API_KEY;
    });
  });

  describe('getCryptoOHLC', () => {
    const mockOHLCResponse = [
      [1717200000000, 67000, 67500, 66800, 67200],
      [1717286400000, 67200, 68000, 67100, 67800],
      [1717372800000, 67800, 68500, 67600, 68300],
    ];

    it('converts CoinGecko OHLC arrays to lightweight-charts objects with unix seconds', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOHLCResponse),
      });

      const result = await getCryptoOHLC('bitcoin', 'eur', 30);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: Math.floor(1717200000000 / 1000),
        open: 67000,
        high: 67500,
        low: 66800,
        close: 67200,
      });
    });

    it('uses default parameters (eur, 30)', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getCryptoOHLC('bitcoin');

      const calledUrl = globalThis.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('vs_currency=eur');
      expect(calledUrl).toContain('days=30');
      expect(calledUrl).toContain('/coins/bitcoin/ohlc');
    });

    it('throws on non-ok response', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getCryptoOHLC('invalid-coin')).rejects.toThrow('CoinGecko OHLC error');
    });

    it('converts milliseconds to seconds correctly', async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([[1700000000000, 1, 2, 3, 4]]),
      });

      const result = await getCryptoOHLC('bitcoin');
      expect(result[0].time).toBe(1700000000);
    });
  });
});
