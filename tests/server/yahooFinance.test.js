import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock yahoo-finance2 v3 (class-based API)
// vi.fn() calls inside the factory to avoid hoisting issues
vi.mock('yahoo-finance2', () => {
  const mockQuote = vi.fn();
  const mockChart = vi.fn();
  class YahooFinance {
    constructor() {
      this.quote = mockQuote;
      this.chart = mockChart;
    }
  }
  // Attach mock fns to class for test access
  YahooFinance._mockQuote = mockQuote;
  YahooFinance._mockChart = mockChart;
  return { default: YahooFinance };
});

import YahooFinance from 'yahoo-finance2';
import { getQuote, getStockChart } from '../../server/services/yahooFinance.js';

// Grab the mock functions from the class
const mockQuote = YahooFinance._mockQuote;
const mockChart = YahooFinance._mockChart;

describe('yahooFinance service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    const mockYahooResponse = {
      symbol: 'AAPL',
      shortName: 'Apple Inc.',
      longName: 'Apple Inc.',
      regularMarketPrice: 178.72,
      regularMarketChange: 2.35,
      regularMarketChangePercent: 1.33,
      regularMarketVolume: 55_123_456,
      marketCap: 2_800_000_000_000,
      trailingPE: 29.5,
      fiftyTwoWeekHigh: 199.62,
      fiftyTwoWeekLow: 124.17,
      currency: 'USD',
    };

    it('returns normalized stock quote with expected fields', async () => {
      mockQuote.mockResolvedValue(mockYahooResponse);

      const result = await getQuote('AAPL');

      expect(result).toEqual({
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
      });
    });

    it('uses longName when shortName is missing', async () => {
      mockQuote.mockResolvedValue({
        ...mockYahooResponse,
        shortName: undefined,
      });

      const result = await getQuote('AAPL');
      expect(result.name).toBe('Apple Inc.');
    });

    it('calls yahoo-finance2 quote with the provided symbol', async () => {
      mockQuote.mockResolvedValue(mockYahooResponse);

      await getQuote('MSFT');
      expect(mockQuote).toHaveBeenCalledWith('MSFT');
    });

    it('propagates errors from yahoo-finance2', async () => {
      mockQuote.mockRejectedValue(new Error('Symbol not found'));

      await expect(getQuote('INVALID')).rejects.toThrow('Symbol not found');
    });
  });

  describe('getStockChart', () => {
    const mockChartResponse = {
      quotes: [
        { date: new Date('2024-06-01T00:00:00Z'), open: 170, high: 175, low: 169, close: 174 },
        { date: new Date('2024-06-02T00:00:00Z'), open: 174, high: 178, low: 173, close: 177 },
        { date: new Date('2024-06-03T00:00:00Z'), open: 177, high: 180, low: 176, close: 179 },
      ],
    };

    it('returns array of lightweight-charts OHLC objects with time in unix seconds', async () => {
      mockChart.mockResolvedValue(mockChartResponse);

      const result = await getStockChart('AAPL', '6mo');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: Math.floor(new Date('2024-06-01T00:00:00Z').getTime() / 1000),
        open: 170,
        high: 175,
        low: 169,
        close: 174,
      });
    });

    it('filters out quotes with missing OHLC data', async () => {
      mockChart.mockResolvedValue({
        quotes: [
          { date: new Date('2024-06-01T00:00:00Z'), open: 170, high: 175, low: 169, close: 174 },
          { date: new Date('2024-06-02T00:00:00Z'), open: null, high: null, low: null, close: null },
        ],
      });

      const result = await getStockChart('AAPL', '6mo');
      expect(result).toHaveLength(1);
    });

    it('maps range "1d" to interval "5m"', async () => {
      mockChart.mockResolvedValue({ quotes: [] });

      await getStockChart('AAPL', '1d');

      expect(mockChart).toHaveBeenCalledWith(
        'AAPL',
        expect.objectContaining({ interval: '5m' }),
      );
    });

    it('maps range "5d" to interval "15m"', async () => {
      mockChart.mockResolvedValue({ quotes: [] });

      await getStockChart('AAPL', '5d');

      expect(mockChart).toHaveBeenCalledWith(
        'AAPL',
        expect.objectContaining({ interval: '15m' }),
      );
    });

    it('maps other ranges to interval "1d"', async () => {
      mockChart.mockResolvedValue({ quotes: [] });

      await getStockChart('AAPL', '6mo');

      expect(mockChart).toHaveBeenCalledWith(
        'AAPL',
        expect.objectContaining({ interval: '1d' }),
      );
    });

    it('passes period1 as a Date object', async () => {
      mockChart.mockResolvedValue({ quotes: [] });

      await getStockChart('AAPL', '6mo');

      const callArgs = mockChart.mock.calls[0][1];
      expect(callArgs.period1).toBeInstanceOf(Date);
    });

    it('propagates errors from yahoo-finance2 chart', async () => {
      mockChart.mockRejectedValue(new Error('Chart data unavailable'));

      await expect(getStockChart('INVALID', '6mo')).rejects.toThrow('Chart data unavailable');
    });
  });
});
