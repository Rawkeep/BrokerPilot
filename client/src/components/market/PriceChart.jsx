import { useRef, useEffect } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

/**
 * Reusable financial chart component using lightweight-charts v5.
 *
 * @param {object} props
 * @param {Array} props.data - Array of OHLC or line data points
 * @param {'candlestick'|'line'} [props.type='candlestick'] - Chart type
 * @param {number} [props.height=400] - Chart height in pixels
 */
export function PriceChart({ data, type = 'candlestick', height = 400 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Read CSS variable for text color with fallback
    const textColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text-secondary')
        .trim() || '#94a3b8';

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
    });

    const series =
      type === 'candlestick'
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

    // Handle responsive resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          chart.applyOptions({ width });
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, type, height]);

  if (!data || data.length === 0) {
    return null;
  }

  return <div ref={containerRef} className="chart-container" />;
}
