import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Team store — Zustand store with localStorage persistence.
 * Storage key: 'brokerpilot-team'
 *
 * State:
 * - members: Member[]
 *
 * Member shape:
 * { id, name, email, role, avatar, color, assignedLeads: [], stats: { closed, revenue, activeDeals } }
 * role: 'admin' | 'manager' | 'agent'
 */

const DEFAULT_TEAM = [
  { id: '1', name: 'Max Müller', email: 'max@broker.de', role: 'admin', avatar: null, color: '#3b82f6', assignedLeads: [], stats: { closed: 12, revenue: 850000, activeDeals: 5 } },
  { id: '2', name: 'Anna Schmidt', email: 'anna@broker.de', role: 'manager', avatar: null, color: '#8b5cf6', assignedLeads: [], stats: { closed: 8, revenue: 620000, activeDeals: 3 } },
  { id: '3', name: 'Peter Weber', email: 'peter@broker.de', role: 'agent', avatar: null, color: '#10b981', assignedLeads: [], stats: { closed: 15, revenue: 1200000, activeDeals: 7 } },
  { id: '4', name: 'Lisa Braun', email: 'lisa@broker.de', role: 'agent', avatar: null, color: '#f59e0b', assignedLeads: [], stats: { closed: 6, revenue: 430000, activeDeals: 4 } },
];

export const useTeamStore = create(
  persist(
    (set, get) => ({
      members: DEFAULT_TEAM,

      addMember: (member) =>
        set((s) => ({
          members: [...s.members, { ...member, id: member.id || crypto.randomUUID() }],
        })),

      updateMember: (id, updates) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
        })),

      assignLead: (memberId, leadId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId && !m.assignedLeads.includes(leadId)
              ? { ...m, assignedLeads: [...m.assignedLeads, leadId] }
              : m
          ),
        })),

      unassignLead: (memberId, leadId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId
              ? { ...m, assignedLeads: m.assignedLeads.filter((l) => l !== leadId) }
              : m
          ),
        })),

      getMember: (id) => get().members.find((m) => m.id === id),

      getByRole: (role) => get().members.filter((m) => m.role === role),
    }),
    {
      name: 'brokerpilot-team',
    }
  )
);
