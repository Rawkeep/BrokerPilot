/**
 * Analytics Service — Computes team/solo metrics from lead data.
 * Works with localStorage (leadStore) and Supabase when available.
 */
import { useLeadStore } from '../stores/leadStore.js';
import { isSupabaseEnabled, supabase } from '../lib/supabase.js';

/**
 * Get overview KPIs.
 */
export function getTeamOverview(leads) {
  if (!leads) leads = useLeadStore.getState().leads;
  const total = leads.length;
  const totalValue = leads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const closed = leads.filter((l) => {
    const st = (l.stage || '').toLowerCase();
    return st.includes('abgeschlossen') || st.includes('closed') || st.includes('closing');
  });
  const conversionRate = total > 0 ? (closed.length / total * 100) : 0;
  const avgDealSize = closed.length > 0 ? closed.reduce((s, l) => s + (l.dealValue || 0), 0) / closed.length : 0;
  const active = leads.filter((l) => {
    const st = (l.stage || '').toLowerCase();
    return !st.includes('abgeschlossen') && !st.includes('closed');
  });

  return { total, totalValue, closedCount: closed.length, conversionRate, avgDealSize, activeCount: active.length };
}

/**
 * Get conversion metrics by stage.
 */
export function getConversionByStage(leads, stages) {
  if (!leads) leads = useLeadStore.getState().leads;
  return (stages || []).map((stage, i) => {
    const count = leads.filter((l) => l.stage === stage.id).length;
    const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
    return { id: stage.id, label: stage.label, count, percentage: pct };
  });
}

/**
 * Get monthly revenue timeline.
 */
export function getRevenueTimeline(leads, months = 6) {
  if (!leads) leads = useLeadStore.getState().leads;
  const now = new Date();
  const timeline = [];
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthLeads = leads.filter((l) => {
      const created = new Date(l.createdAt);
      return created >= d && created <= monthEnd;
    });
    const value = monthLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
    timeline.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      count: monthLeads.length,
      value,
    });
  }
  return timeline;
}

/**
 * Get pipeline velocity — avg days per stage.
 */
export function getPipelineVelocity(leads) {
  if (!leads) leads = useLeadStore.getState().leads;
  const now = Date.now();
  const stageMap = {};

  for (const lead of leads) {
    const stage = lead.stage || 'unknown';
    const created = new Date(lead.updatedAt || lead.createdAt).getTime();
    const days = Math.max(1, Math.floor((now - created) / 86400000));
    if (!stageMap[stage]) stageMap[stage] = { total: 0, count: 0 };
    stageMap[stage].total += days;
    stageMap[stage].count += 1;
  }

  return Object.entries(stageMap).map(([stage, data]) => ({
    stage,
    avgDays: Math.round(data.total / data.count),
    count: data.count,
  }));
}

/**
 * Get broker type breakdown.
 */
export function getBrokerTypeBreakdown(leads) {
  if (!leads) leads = useLeadStore.getState().leads;
  const map = {};
  for (const lead of leads) {
    const type = lead.brokerType || 'unbekannt';
    if (!map[type]) map[type] = { count: 0, value: 0 };
    map[type].count += 1;
    map[type].value += lead.dealValue || 0;
  }
  return Object.entries(map).map(([type, data]) => ({ type, ...data }));
}
