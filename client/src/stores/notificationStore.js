import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Notification store — Zustand store with localStorage persistence.
 * Storage key: 'brokerpilot-notifications'
 *
 * Notification shape:
 * { id, type, title, message, leadId?, link?, read, createdAt }
 * type: 'info' | 'success' | 'warning' | 'error' | 'lead' | 'deal' | 'reminder' | 'ai'
 */

const DEMO_NOTIFICATIONS = [
  { id: crypto.randomUUID(), type: 'deal', title: 'Deal abgeschlossen!', message: 'Robert Schneider — \u20AC1.2M Notartermin erfolgreich', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: crypto.randomUUID(), type: 'lead', title: 'Neuer Hot-Lead', message: 'Michael Braun hat Score 92 erreicht', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: crypto.randomUUID(), type: 'reminder', title: 'Erinnerung', message: 'Follow-up Anruf mit Sarah Klein', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: crypto.randomUUID(), type: 'ai', title: 'KI-Analyse fertig', message: 'SWOT-Analyse f\u00FCr TechStart GmbH abgeschlossen', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: crypto.randomUUID(), type: 'success', title: 'E-Mail gesendet', message: 'Willkommens-Mail an Julia Fischer', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      _initDemo() {
        if (get().notifications.length === 0) {
          set({ notifications: DEMO_NOTIFICATIONS });
        }
      },

      addNotification({ type, title, message, leadId, link }) {
        const notification = {
          id: crypto.randomUUID(),
          type,
          title,
          message,
          leadId: leadId || null,
          link: link || null,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          notifications: [notification, ...s.notifications],
        }));
        return notification;
      },

      markRead(id) {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllRead() {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      deleteNotification(id) {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll() {
        set({ notifications: [] });
      },

      getUnread() {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'brokerpilot-notifications',
    }
  )
);

// Auto-seed demo notifications on first load
useNotificationStore.getState()._initDemo();
