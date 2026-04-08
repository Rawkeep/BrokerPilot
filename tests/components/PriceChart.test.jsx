import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Mock lightweight-charts before importing PriceChart
const mockSetData = vi.fn();
const mockFitContent = vi.fn();
const mockRemove = vi.fn();
const mockApplyOptions = vi.fn();
const mockAddSeries = vi.fn(() => ({
  setData: mockSetData,
}));
const mockTimeScale = vi.fn(() => ({
  fitContent: mockFitContent,
}));
const mockChart = {
  addSeries: mockAddSeries,
  timeScale: mockTimeScale,
  remove: mockRemove,
  applyOptions: mockApplyOptions,
};
const mockCreateChart = vi.fn(() => mockChart);

vi.mock('lightweight-charts', () => ({
  createChart: mockCreateChart,
  CandlestickSeries: 'CandlestickSeries',
  LineSeries: 'LineSeries',
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver;

// Need to import after mocks are set up
const { PriceChart } = await import('../../client/src/components/market/PriceChart.jsx');

const sampleData = [
  { time: 1700000000, open: 100, high: 110, low: 95, close: 105 },
  { time: 1700086400, open: 105, high: 115, low: 100, close: 110 },
];

describe('PriceChart', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders a container div', () => {
    const { container } = render(<PriceChart data={sampleData} />);
    const chartDiv = container.querySelector('.chart-container');
    expect(chartDiv).not.toBeNull();
  });

  it('calls createChart with correct options', () => {
    render(<PriceChart data={sampleData} height={500} />);

    expect(mockCreateChart).toHaveBeenCalledTimes(1);
    const opts = mockCreateChart.mock.calls[0][1];
    expect(opts.height).toBe(500);
    expect(opts.layout.background.color).toBe('transparent');
  });

  it('adds a candlestick series by default', () => {
    render(<PriceChart data={sampleData} />);

    expect(mockAddSeries).toHaveBeenCalledWith('CandlestickSeries', expect.objectContaining({
      upColor: '#22c55e',
      downColor: '#ef4444',
    }));
    expect(mockSetData).toHaveBeenCalledWith(sampleData);
    expect(mockFitContent).toHaveBeenCalled();
  });

  it('adds a line series when type is line', () => {
    render(<PriceChart data={sampleData} type="line" />);

    expect(mockAddSeries).toHaveBeenCalledWith('LineSeries', expect.objectContaining({
      color: '#3b82f6',
      lineWidth: 2,
    }));
  });

  it('calls chart.remove() on unmount', () => {
    const { unmount } = render(<PriceChart data={sampleData} />);

    expect(mockRemove).not.toHaveBeenCalled();
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when data is empty', () => {
    const { container } = render(<PriceChart data={[]} />);
    const chartDiv = container.querySelector('.chart-container');
    expect(chartDiv).toBeNull();
  });

  it('renders nothing when data is null', () => {
    const { container } = render(<PriceChart data={null} />);
    const chartDiv = container.querySelector('.chart-container');
    expect(chartDiv).toBeNull();
  });
});
