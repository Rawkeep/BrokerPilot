import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Calendar store — persists events to localStorage.
 * Storage key: 'brokerpilot-calendar'
 *
 * Event shape:
 * { id, title, leadId, leadName, type, date, time, duration, location, notes, reminder, completed, createdAt }
 * type: 'besichtigung'|'beratung'|'telefonat'|'videokonferenz'|'notartermin'|'follow-up'|'intern'
 * reminder: null | '15min' | '30min' | '1h' | '1d'
 */
export const useCalendarStore = create(
  persist(
    (set, get) => ({
      events: [],

      addEvent(event) {
        const newEvent = {
          id: crypto.randomUUID(),
          title: '',
          leadId: null,
          leadName: '',
          type: 'beratung',
          date: '',
          time: '',
          duration: '1h',
          location: '',
          notes: '',
          reminder: null,
          completed: false,
          createdAt: new Date().toISOString(),
          ...event,
        };
        set((s) => ({ events: [...s.events, newEvent] }));
        return newEvent;
      },

      updateEvent(id, updates) {
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteEvent(id) {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      toggleComplete(id) {
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, completed: !e.completed } : e
          ),
        }));
      },

      getUpcoming(days = 7) {
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() + days);
        const todayStr = now.toISOString().slice(0, 10);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return get()
          .events.filter(
            (e) => !e.completed && e.date >= todayStr && e.date <= cutoffStr
          )
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.time || '').localeCompare(b.time || '');
          });
      },

      getByLead(leadId) {
        return get().events.filter((e) => e.leadId === leadId);
      },

      getByDate(dateStr) {
        return get()
          .events.filter((e) => e.date === dateStr)
          .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      },

      getOverdue() {
        const todayStr = new Date().toISOString().slice(0, 10);
        const nowTime = new Date().toTimeString().slice(0, 5);
        return get()
          .events.filter((e) => {
            if (e.completed) return false;
            if (e.date < todayStr) return true;
            if (e.date === todayStr && e.time && e.time < nowTime) return true;
            return false;
          })
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.time || '').localeCompare(b.time || '');
          });
      },
    }),
    {
      name: 'brokerpilot-calendar',
    }
  )
);
