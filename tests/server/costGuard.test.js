import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkBudget, createCircuitBreaker } from '../../server/middleware/costGuard.js';

describe('costGuard — checkBudget', () => {
  it('does not throw when usage is within budget', () => {
    expect(() =>
      checkBudget({ inputTokens: 3000, outputTokens: 4000 }, 8000)
    ).not.toThrow();
  });

  it('does not throw when usage equals budget', () => {
    expect(() =>
      checkBudget({ inputTokens: 4000, outputTokens: 4000 }, 8000)
    ).not.toThrow();
  });

  it('throws with status 413 when usage exceeds budget', () => {
    try {
      checkBudget({ inputTokens: 5000, outputTokens: 4000 }, 8000);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err.message).toContain('Token budget exceeded');
      expect(err.message).toContain('9000');
      expect(err.status).toBe(413);
    }
  });

  it('does not throw when usage is undefined', () => {
    expect(() => checkBudget(undefined, 8000)).not.toThrow();
  });

  it('handles missing inputTokens or outputTokens gracefully', () => {
    expect(() => checkBudget({ inputTokens: 100 }, 8000)).not.toThrow();
    expect(() => checkBudget({ outputTokens: 100 }, 8000)).not.toThrow();
  });

  it('uses default budget (AI_TOKEN_BUDGET = 8000) when not specified', () => {
    expect(() =>
      checkBudget({ inputTokens: 5000, outputTokens: 4000 })
    ).toThrow('Token budget exceeded');
  });
});

describe('costGuard — createCircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('circuit is initially closed (isOpen returns false)', () => {
    const cb = createCircuitBreaker(3, 60000);
    expect(cb.isOpen('openai')).toBe(false);
  });

  it('circuit stays closed after 1-2 failures', () => {
    const cb = createCircuitBreaker(3, 60000);
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(false);
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(false);
  });

  it('circuit opens after 3 consecutive failures', () => {
    const cb = createCircuitBreaker(3, 60000);
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(true);
  });

  it('circuit resets after cooldown period (60s)', () => {
    const cb = createCircuitBreaker(3, 60000);
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(true);

    // Advance 60 seconds
    vi.advanceTimersByTime(60000);

    expect(cb.isOpen('openai')).toBe(false);
  });

  it('successful request resets the failure count', () => {
    const cb = createCircuitBreaker(3, 60000);
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    cb.recordSuccess('openai');
    // After success, we need 3 more failures to trip
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(false);
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(true);
  });

  it('different providers have independent circuits', () => {
    const cb = createCircuitBreaker(3, 60000);
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    cb.recordFailure('openai');
    expect(cb.isOpen('openai')).toBe(true);
    expect(cb.isOpen('anthropic')).toBe(false);
  });
});
