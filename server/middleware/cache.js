import { CACHE_DEFAULT_TTL } from '../../shared/constants.js';

/**
 * Creates an in-memory cache with configurable TTL.
 * @param {number} [defaultTTL] - Default time-to-live in milliseconds
 * @returns {{ get: (key: string) => any, set: (key: string, data: any, ttl?: number) => void, clear: () => void, stats: () => { size: number, keys: string[] } }}
 */
export function createCacheMiddleware(defaultTTL = CACHE_DEFAULT_TTL) {
  const store = new Map();

  return {
    /**
     * Get a value from the cache. Returns null if key is missing or expired.
     * @param {string} key
     * @returns {any}
     */
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }

      return entry.data;
    },

    /**
     * Set a value in the cache with an optional TTL override.
     * @param {string} key
     * @param {any} data
     * @param {number} [ttl]
     */
    set(key, data, ttl = defaultTTL) {
      store.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });
    },

    /**
     * Remove all entries from the cache.
     */
    clear() {
      store.clear();
    },

    /**
     * Get cache statistics.
     * @returns {{ size: number, keys: string[] }}
     */
    stats() {
      return {
        size: store.size,
        keys: Array.from(store.keys()),
      };
    },
  };
}
