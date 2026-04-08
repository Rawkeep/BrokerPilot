import { useMemo } from 'react';
import { useLeadStore } from '../stores/leadStore.js';

/**
 * useFollowUps — Identifies stale leads that need follow-up attention.
 *
 * Analyzes lead activity timestamps and flags leads that haven't been
 * touched within configurable thresholds.
 *
 * @param {object} [options]
 * @param {number} [options.warningDays=3] - Days without activity before warning
 * @param {number} [options.urgentDays=7] - Days without activity before urgent
 * @param {number} [options.criticalDays=14] - Days without activity before critical
 * @returns {{
 *   followUps: Array<{lead: object, daysSinceActivity: number, urgency: string, lastActivity: string}>,
 *   urgentCount: number,
 *   criticalCount: number,
 *   totalCount: number,
 * }}
 */
export function useFollowUps(options = {}) {
  const { warningDays = 3, urgentDays = 7, criticalDays = 14 } = options;
  const leads = useLeadStore((s) => s.leads);

  const followUps = useMemo(() => {
    const now = Date.now();
    const DAY_MS = 86400000;

    return leads
      .filter((lead) => {
        // Only active leads (not in final stage)
        const stage = (lead.stage || '').toLowerCase();
        return !stage.includes('abgeschlossen') && !stage.includes('closing') && !stage.includes('closed');
      })
      .map((lead) => {
        // Find the most recent activity
        const lastActivity = lead.activities && lead.activities.length > 0
          ? lead.activities[0] // Activities are sorted newest first
          : null;

        const lastTimestamp = lastActivity
          ? new Date(lastActivity.timestamp).getTime()
          : new Date(lead.updatedAt || lead.createdAt).getTime();

        const daysSinceActivity = Math.floor((now - lastTimestamp) / DAY_MS);

        let urgency = null;
        if (daysSinceActivity >= criticalDays) urgency = 'critical';
        else if (daysSinceActivity >= urgentDays) urgency = 'urgent';
        else if (daysSinceActivity >= warningDays) urgency = 'warning';

        return urgency ? {
          lead,
          daysSinceActivity,
          urgency,
          lastActivity: lastActivity?.description || 'Keine Aktivitaet',
          lastTimestamp: lastTimestamp ? new Date(lastTimestamp).toISOString() : null,
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
  }, [leads, warningDays, urgentDays, criticalDays]);

  const urgentCount = followUps.filter((f) => f.urgency === 'urgent' || f.urgency === 'critical').length;
  const criticalCount = followUps.filter((f) => f.urgency === 'critical').length;

  return {
    followUps,
    urgentCount,
    criticalCount,
    totalCount: followUps.length,
  };
}
