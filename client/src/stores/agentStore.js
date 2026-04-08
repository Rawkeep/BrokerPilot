import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Agent Store — persists agent run history to localStorage.
 *
 * State:
 * - runs: Array of agent run records
 * - activeRunId: Currently running agent (not persisted)
 *
 * Storage key: 'bp-agent-runs'
 */
export const useAgentStore = create(
  persist(
    (set, get) => ({
      /** @type {Array<{runId: string, agentType: string, leadId: string, status: string, result: object|null, error: string|null, createdAt: string, duration: number|null}>} */
      runs: [],

      /** @type {string|null} Currently active run ID (not persisted) */
      activeRunId: null,

      /**
       * Start a new agent run.
       * @param {string} runId
       * @param {string} agentType
       * @param {string} leadId
       */
      startRun: (runId, agentType, leadId) =>
        set((s) => ({
          activeRunId: runId,
          runs: [
            {
              runId,
              agentType,
              leadId,
              status: 'starting',
              result: null,
              error: null,
              createdAt: new Date().toISOString(),
              duration: null,
            },
            ...s.runs,
          ],
        })),

      /**
       * Update the status of an active run.
       * @param {string} runId
       * @param {string} status
       * @param {object} [data]
       */
      updateRunStatus: (runId, status, data) =>
        set((s) => ({
          runs: s.runs.map((r) =>
            r.runId === runId ? { ...r, status, ...(data ? { enrichedData: data } : {}) } : r
          ),
        })),

      /**
       * Set the result of a completed run.
       * @param {string} runId
       * @param {object} result
       */
      setRunResult: (runId, result) =>
        set((s) => ({
          runs: s.runs.map((r) =>
            r.runId === runId ? { ...r, result, status: 'done' } : r
          ),
        })),

      /**
       * Set an error on a run.
       * @param {string} runId
       * @param {string} message
       */
      setRunError: (runId, message) =>
        set((s) => ({
          runs: s.runs.map((r) =>
            r.runId === runId ? { ...r, error: message, status: 'error' } : r
          ),
        })),

      /**
       * Mark a run as complete with duration.
       * @param {string} runId
       * @param {number} duration
       */
      completeRun: (runId, duration) =>
        set((s) => ({
          activeRunId: s.activeRunId === runId ? null : s.activeRunId,
          runs: s.runs.map((r) =>
            r.runId === runId ? { ...r, status: 'done', duration } : r
          ),
        })),

      /**
       * Get runs filtered by leadId.
       * @param {string} leadId
       * @returns {Array}
       */
      getRunsByLeadId: (leadId) => get().runs.filter((r) => r.leadId === leadId),

      /**
       * Get the currently active run.
       * @returns {object|null}
       */
      getActiveRun: () => {
        const { activeRunId, runs } = get();
        return activeRunId ? runs.find((r) => r.runId === activeRunId) || null : null;
      },

      /**
       * Get runs filtered by agent type.
       * @param {string} agentType
       * @returns {Array}
       */
      getRunsByAgentType: (agentType) => get().runs.filter((r) => r.agentType === agentType),
    }),
    {
      name: 'bp-agent-runs',
      // Only persist runs array — activeRunId is transient
      partialize: (state) => ({
        runs: state.runs,
      }),
    }
  )
);
