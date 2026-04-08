import { useState, useEffect, useCallback, useRef } from 'react';
import { MARKET_POLL_INTERVAL } from '../../../shared/constants.js';

/**
 * React hook for fetching market data with optional polling.
 *
 * @param {Function} fetchFn - Async function that returns data
 * @param {object} [options]
 * @param {number} [options.pollInterval=MARKET_POLL_INTERVAL] - Polling interval in ms (0 to disable)
 * @param {boolean} [options.enabled=true] - Whether fetching is enabled
 * @param {Array} [options.deps=[]] - Dependencies that trigger a re-fetch
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function }}
 */
export function useMarketData(fetchFn, { pollInterval = MARKET_POLL_INTERVAL, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchFnRef = useRef(fetchFn);

  // Keep fetchFn ref up to date without triggering re-renders
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []); // stable reference -- uses ref internally

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchData();

    if (pollInterval > 0) {
      const id = setInterval(fetchData, pollInterval);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollInterval, fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}
