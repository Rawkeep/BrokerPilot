import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  freemiumGate,
  _resetCounters,
} from '../../server/middleware/freemiumGate.js';

/**
 * Helper: create mock req/res/next for Express middleware testing.
 */
function createMocks(overrides = {}) {
  const req = {
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  };
  const res = {
    _status: null,
    _json: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._json = data;
      return this;
    },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('server/middleware/freemiumGate', () => {
  beforeEach(() => {
    _resetCounters();
    vi.useFakeTimers();
    // Set a known time
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bypasses the gate when apiKey is present in body', () => {
    const { req, res, next } = createMocks({
      body: { apiKey: 'sk-test-key' },
    });

    freemiumGate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it('passes for a new IP (count becomes 1)', () => {
    const { req, res, next } = createMocks({ ip: '10.0.0.1' });

    freemiumGate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it('passes for IP that has made 4 prior requests', () => {
    const ip = '10.0.0.2';

    // Make 4 requests
    for (let i = 0; i < 4; i++) {
      const { req, res, next } = createMocks({ ip });
      freemiumGate(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    // 5th request should still pass (count = 5, limit is 5)
    const { req, res, next } = createMocks({ ip });
    freemiumGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBeNull();
  });

  it('returns 429 after 5 requests from the same IP', () => {
    const ip = '10.0.0.3';

    // Make 5 requests (max allowed)
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = createMocks({ ip });
      freemiumGate(req, res, next);
    }

    // 6th request should be rejected
    const { req, res, next } = createMocks({ ip });
    freemiumGate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
    expect(res._json.error).toContain('Tageslimit erreicht');
    expect(res._json.limit).toBe(5);
  });

  it('resets counter after midnight UTC', () => {
    const ip = '10.0.0.4';

    // Use all 5 free requests
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = createMocks({ ip });
      freemiumGate(req, res, next);
    }

    // Advance to next midnight UTC + 1ms
    vi.setSystemTime(new Date('2026-04-09T00:00:01Z'));

    // Should be allowed again
    const { req, res, next } = createMocks({ ip });
    freemiumGate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it('different IPs have independent counters', () => {
    // IP-A uses all 5
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = createMocks({ ip: '10.0.0.10' });
      freemiumGate(req, res, next);
    }

    // IP-B should still have 5 free
    const { req, res, next } = createMocks({ ip: '10.0.0.11' });
    freemiumGate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it('does not count requests that include an API key', () => {
    const ip = '10.0.0.20';

    // Make 10 requests with an API key
    for (let i = 0; i < 10; i++) {
      const { req, res, next } = createMocks({
        ip,
        body: { apiKey: 'sk-key' },
      });
      freemiumGate(req, res, next);
    }

    // Now make a request without a key — should still be the first one
    const { req, res, next } = createMocks({ ip });
    freemiumGate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });
});
