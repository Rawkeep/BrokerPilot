import { describe, it, expect, beforeEach } from 'vitest';
import { createCacheMiddleware } from '../../server/middleware/cache.js';

describe('createCacheMiddleware', () => {
  let cache;

  beforeEach(() => {
    cache = createCacheMiddleware(1000); // 1 second TTL for tests
  });

  it('should set and get a value', () => {
    cache.set('key1', { value: 'hello' });
    expect(cache.get('key1')).toEqual({ value: 'hello' });
  });

  it('should return null for non-existent key', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('should return null for expired entry', async () => {
    cache.set('expiring', 'data', 50); // 50ms TTL
    expect(cache.get('expiring')).toBe('data');

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(cache.get('expiring')).toBeNull();
  });

  it('should clear all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.stats().size).toBe(2);

    cache.clear();
    expect(cache.stats().size).toBe(0);
    expect(cache.get('a')).toBeNull();
  });

  it('should return correct stats', () => {
    cache.set('x', 10);
    cache.set('y', 20);
    cache.set('z', 30);

    const stats = cache.stats();
    expect(stats.size).toBe(3);
    expect(stats.keys).toEqual(['x', 'y', 'z']);
  });
});
