import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { GlassCard } from '../ui/GlassCard.jsx';

const TYPE_COLORS = {
  besichtigung: '#3b82f6',
  beratung: '#8b5cf6',
  telefonat: '#10b981',
  videokonferenz: '#06b6d4',
  notartermin: '#ef4444',
  'follow-up': '#f59e0b',
  intern: '#6b7280',
};

export function UpcomingWidget() {
  const navigate = useNavigate();
  const getUpcoming = useCalendarStore((s) => s.getUpcoming);
  const events = useCalendarStore((s) => s.events);

  const upcoming = useMemo(() => getUpcoming(7).slice(0, 5), [events]);

  function formatTime(ev) {
    const today = new Date().toISOString().slice(0, 10);
    const [, m, d] = ev.date.split('-');
    const dateLabel = ev.date === today ? 'Heute' : `${d}.${m}.`;
    return ev.time ? `${dateLabel}, ${ev.time}` : dateLabel;
  }

  return (
    <GlassCard hoverable={false} className="upcoming-widget">
      <div className="upcoming-widget__header">
        <h3 className="upcoming-widget__title">Naechste Termine</h3>
        <button
          className="upcoming-widget__link"
          onClick={() => navigate('/kalender')}
        >
          Alle anzeigen
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="upcoming-widget__empty">Keine anstehenden Termine</p>
      ) : (
        <div className="upcoming-widget__list">
          {upcoming.map((ev) => (
            <div
              key={ev.id}
              className="upcoming-widget__item"
              onClick={() => navigate('/kalender')}
            >
              <span
                className="upcoming-widget__dot"
                style={{ backgroundColor: TYPE_COLORS[ev.type] || '#6b7280' }}
              />
              <div className="upcoming-widget__item-info">
                <span className="upcoming-widget__item-title">{ev.title}</span>
                <span className="upcoming-widget__item-meta">
                  {formatTime(ev)}
                  {ev.leadName && ` \u2014 ${ev.leadName}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
