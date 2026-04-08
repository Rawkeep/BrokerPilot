/**
 * Cost Guard — Token budget checker and circuit breaker.
 *
 * - checkBudget(usage, budget): throws if total tokens exceed budget
 * - createCircuitBreaker(): per-provider failure tracker with cooldown
 */

import { AI_TOKEN_BUDGET } from '../../shared/aiProviders.js';

/**
 * Check whether an AI response's token usage exceeds the budget.
 * Throws an error (suitable for 413 response) if exceeded.
 *
 * @param {{ inputTokens?: number, outputTokens?: number }} usage
 * @param {number} [budget] - Maximum allowed total tokens
 */
export function checkBudget(usage, budget = AI_TOKEN_BUDGET) {
  if (!usage) return;
  const total = (usage.inputTokens || 0) + (usage.outputTokens || 0);
  if (total > budget) {
    const err = new Error(
      `Token budget exceeded: ${total} tokens used, limit is ${budget}`
    );
    err.status = 413;
    throw err;
  }
}

/**
 * Create a per-provider circuit breaker.
 *
 * After `maxFailures` consecutive errors for a provider, the circuit opens
 * and blocks requests for `cooldownMs` milliseconds.
 *
 * @param {number} [maxFailures=3]
 * @param {number} [cooldownMs=60000]
 */
export function createCircuitBreaker(maxFailures = 3, cooldownMs = 60000) {
  /** @type {Map<string, { consecutiveFailures: number, openUntil: number }>} */
  const state = new Map();

  function getEntry(provider) {
    if (!state.has(provider)) {
      state.set(provider, { consecutiveFailures: 0, openUntil: 0 });
    }
    return state.get(provider);
  }

  return {
    /**
     * Check if the circuit is open (blocking) for a provider.
     * If the cooldown has elapsed, the circuit is considered half-open
     * and allows requests through (resets failure count).
     */
    isOpen(provider) {
      const entry = getEntry(provider);
      if (entry.consecutiveFailures >= maxFailures) {
        if (Date.now() < entry.openUntil) {
          return true;
        }
        // Cooldown elapsed — reset and allow retry
        entry.consecutiveFailures = 0;
        entry.openUntil = 0;
      }
      return false;
    },

    /** Record a successful request — resets the failure counter. */
    recordSuccess(provider) {
      const entry = getEntry(provider);
      entry.consecutiveFailures = 0;
      entry.openUntil = 0;
    },

    /** Record a failed request — increments counter and may trip the breaker. */
    recordFailure(provider) {
      const entry = getEntry(provider);
      entry.consecutiveFailures += 1;
      if (entry.consecutiveFailures >= maxFailures) {
        entry.openUntil = Date.now() + cooldownMs;
      }
    },
  };
}
