import { create } from 'zustand';
import { storageAdapter } from '../services/storage.js';
import { createLead, addActivity, filterLeads, computeKPIs, validateLead } from '../../../shared/leadSchema.js';

/**
 * Lead store — Zustand store with manual IndexedDB persistence.
 *
 * State:
 * - leads: Lead[]
 * - loading: boolean
 *
 * Actions:
 * - init() — load all leads from IndexedDB
 * - addLead(brokerType, data) — create + persist + add to state
 * - updateLead(id, updates) — merge + edit activity + persist
 * - deleteLead(id) — remove from IndexedDB + state
 * - moveLead(id, newStage) — stage change + activity + persist
 * - addNote(id, content) — note activity + persist
 *
 * Selectors:
 * - getLeadsByStage(brokerType, stage)
 * - getFilteredLeads(filters)
 * - getKPIs(brokerType, stages)
 */
export const useLeadStore = create((set, get) => ({
  leads: [],
  loading: true,

  async init() {
    const leads = await storageAdapter.getAll('leads');
    set({ leads, loading: false });
  },

  async addLead(brokerType, data = {}) {
    const lead = { ...createLead(brokerType), ...data };
    await storageAdapter.put('leads', lead);
    set((s) => ({ leads: [...s.leads, lead] }));
    return lead;
  },

  async updateLead(id, updates) {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    let updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
    updated = addActivity(updated, 'edit', 'Lead bearbeitet', { fields: Object.keys(updates) });
    await storageAdapter.put('leads', updated);
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
  },

  async deleteLead(id) {
    await storageAdapter.delete('leads', id);
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
  },

  async moveLead(id, newStage) {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    const oldStage = lead.stage;
    let updated = { ...lead, stage: newStage, updatedAt: new Date().toISOString() };
    updated = addActivity(updated, 'stage_change', `Phase: ${oldStage} → ${newStage}`, { from: oldStage, to: newStage });
    await storageAdapter.put('leads', updated);
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
  },

  async addNote(id, content) {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    let updated = addActivity(lead, 'note', content, { content });
    await storageAdapter.put('leads', updated);
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
  },

  getLeadsByStage(brokerType, stage) {
    return get().leads.filter(
      (l) => l.brokerType === brokerType && l.stage === stage
    );
  },

  getFilteredLeads(filters) {
    return filterLeads(get().leads, filters);
  },

  getKPIs(brokerType, stages) {
    const filtered = brokerType
      ? get().leads.filter((l) => l.brokerType === brokerType)
      : get().leads;
    return computeKPIs(filtered, stages);
  },
}));
