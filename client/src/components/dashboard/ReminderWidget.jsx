import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { isSupabaseEnabled } from '../../lib/supabase.js';
import { fetchUpcomingReminders, completeReminder } from '../../services/reminderService.js';

/**
 * ReminderWidget — Shows upcoming follow-up reminders on the dashboard.
 */
export function ReminderWidget() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return;
    }
    loadReminders();
  }, []);

  async function loadReminders() {
    const { data } = await fetchUpcomingReminders(7);
    if (data) setReminders(data);
    setLoading(false);
  }

  async function handleComplete(id) {
    await completeReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (!isSupabaseEnabled) {
    return null; // Only show when Supabase is connected
  }

  const overdue = reminders.filter((r) => new Date(r.due_at) < new Date());
  const upcoming = reminders.filter((r) => new Date(r.due_at) >= new Date());

  return (
    <GlassCard hoverable={false} className="reminder-widget">
      <div className="reminder-widget__header">
        <h3 className="reminder-widget__title">
          Erinnerungen
          {overdue.length > 0 && (
            <GlassBadge variant="high">{overdue.length} überfällig</GlassBadge>
          )}
        </h3>
        <span className="reminder-widget__count">{reminders.length} offen</span>
      </div>

      {loading && <p className="reminder-widget__loading">Laden...</p>}

      {!loading && reminders.length === 0 && (
        <p className="reminder-widget__empty">Keine anstehenden Erinnerungen</p>
      )}

      {!loading && reminders.length > 0 && (
        <div className="reminder-widget__list">
          {[...overdue, ...upcoming].slice(0, 6).map((r) => {
            const isOverdue = new Date(r.due_at) < new Date();
            const dueDate = new Date(r.due_at).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={r.id}
                className={`reminder-widget__item ${isOverdue ? 'reminder-widget__item--overdue' : ''}`}
              >
                <div className="reminder-widget__item-info">
                  <span className="reminder-widget__item-title">{r.title}</span>
                  <span className="reminder-widget__item-due">{dueDate}</span>
                </div>
                <GlassButton onClick={() => handleComplete(r.id)}>
                  Erledigt
                </GlassButton>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
