import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useLeadStore } from '../../stores/leadStore.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';

const TYPE_LABELS = {
  besichtigung: 'Besichtigung',
  beratung: 'Beratung',
  telefonat: 'Telefonat',
  videokonferenz: 'Videokonferenz',
  notartermin: 'Notartermin',
  'follow-up': 'Follow-up',
  intern: 'Intern',
};

const TYPE_COLORS = {
  besichtigung: '#3b82f6',
  beratung: '#8b5cf6',
  telefonat: '#10b981',
  videokonferenz: '#06b6d4',
  notartermin: '#ef4444',
  'follow-up': '#f59e0b',
  intern: '#6b7280',
};

const DURATION_OPTIONS = [
  { value: '15min', label: '15 Min.' },
  { value: '30min', label: '30 Min.' },
  { value: '1h', label: '1 Stunde' },
  { value: '2h', label: '2 Stunden' },
  { value: 'ganztag', label: 'Ganzer Tag' },
];

const REMINDER_OPTIONS = [
  { value: '', label: 'Keine Erinnerung' },
  { value: '15min', label: '15 Min. vorher' },
  { value: '30min', label: '30 Min. vorher' },
  { value: '1h', label: '1 Stunde vorher' },
  { value: '1d', label: '1 Tag vorher' },
];

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday-based: 0=Mo, 6=So
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, month: m, year: y, outside: true });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, outside: false });
  }
  // Next month padding
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ day: d, month: m, year: y, outside: true });
    }
  }
  return cells;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateDE(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function groupByDate(events) {
  const groups = {};
  for (const ev of events) {
    if (!groups[ev.date]) groups[ev.date] = [];
    groups[ev.date].push(ev);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

const EMPTY_EVENT = {
  title: '',
  leadId: '',
  leadName: '',
  type: 'beratung',
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  duration: '1h',
  location: '',
  notes: '',
  reminder: '',
};

export function CalendarView() {
  const navigate = useNavigate();
  const events = useCalendarStore((s) => s.events);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const toggleComplete = useCalendarStore((s) => s.toggleComplete);
  const getUpcoming = useCalendarStore((s) => s.getUpcoming);
  const getByDate = useCalendarStore((s) => s.getByDate);
  const getOverdue = useCalendarStore((s) => s.getOverdue);
  const leads = useLeadStore((s) => s.leads);

  const [view, setView] = useState('agenda');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_EVENT });
  const [selectedDate, setSelectedDate] = useState(null);

  // Month view state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const todayStr = today.toISOString().slice(0, 10);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (filterType) list = list.filter((e) => e.type === filterType);
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [events, filterType]);

  const overdueEvents = useMemo(() => {
    let list = getOverdue();
    if (filterType) list = list.filter((e) => e.type === filterType);
    return list;
  }, [events, filterType]);

  const upcomingEvents = useMemo(() => {
    let list = getUpcoming(30);
    if (filterType) list = list.filter((e) => e.type === filterType);
    return list;
  }, [events, filterType]);

  // Month grid data
  const monthCells = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  function openNewModal(date) {
    setEditingEvent(null);
    setFormData({
      ...EMPTY_EVENT,
      date: date || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEditModal(event) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      leadId: event.leadId || '',
      leadName: event.leadName || '',
      type: event.type,
      date: event.date,
      time: event.time || '',
      duration: event.duration || '1h',
      location: event.location || '',
      notes: event.notes || '',
      reminder: event.reminder || '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!formData.title.trim() || !formData.date) return;
    const lead = leads.find((l) => l.id === formData.leadId);
    const eventData = {
      ...formData,
      leadName: lead ? lead.name : formData.leadName,
      reminder: formData.reminder || null,
    };
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      addEvent(eventData);
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (editingEvent) {
      deleteEvent(editingEvent.id);
      setModalOpen(false);
    }
  }

  function handleFieldChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function handleDayClick(cell) {
    const dateStr = toDateStr(cell.year, cell.month, cell.day);
    setSelectedDate(dateStr);
  }

  // Day detail events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    let list = getByDate(selectedDate);
    if (filterType) list = list.filter((e) => e.type === filterType);
    return list;
  }, [selectedDate, events, filterType]);

  return (
    <div className="calendar">
      {/* Top bar */}
      <div className="calendar__header">
        <div className="calendar__view-toggle">
          <button
            className={`calendar__toggle-btn ${view === 'agenda' ? 'calendar__toggle-btn--active' : ''}`}
            onClick={() => setView('agenda')}
          >
            Agenda
          </button>
          <button
            className={`calendar__toggle-btn ${view === 'month' ? 'calendar__toggle-btn--active' : ''}`}
            onClick={() => setView('month')}
          >
            Monat
          </button>
        </div>

        <div className="calendar__actions">
          <select
            className="calendar__filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Alle Typen</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <GlassButton variant="primary" onClick={() => openNewModal()}>
            + Neuer Termin
          </GlassButton>
        </div>
      </div>

      {/* Agenda View */}
      {view === 'agenda' && (
        <div className="calendar__agenda">
          {/* Overdue section */}
          {overdueEvents.length > 0 && (
            <div className="calendar__overdue-section">
              <h3 className="calendar__section-title calendar__section-title--overdue">
                Ueberfaellig ({overdueEvents.length})
              </h3>
              {overdueEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  overdue
                  onEdit={() => openEditModal(ev)}
                  onToggle={() => toggleComplete(ev.id)}
                  onLeadClick={() => ev.leadId && navigate(`/pipeline/${ev.leadId}`)}
                />
              ))}
            </div>
          )}

          {/* Upcoming grouped by date */}
          {upcomingEvents.length > 0 ? (
            groupByDate(upcomingEvents).map(([date, dayEvents]) => (
              <div key={date} className="calendar__day-group">
                <h3 className="calendar__section-title">
                  {date === todayStr ? 'Heute' : formatDateDE(date)}
                </h3>
                {dayEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onEdit={() => openEditModal(ev)}
                    onToggle={() => toggleComplete(ev.id)}
                    onLeadClick={() => ev.leadId && navigate(`/pipeline/${ev.leadId}`)}
                  />
                ))}
              </div>
            ))
          ) : (
            overdueEvents.length === 0 && (
              <GlassCard hoverable={false} className="calendar__empty">
                <p>Keine anstehenden Termine</p>
                <GlassButton variant="primary" onClick={() => openNewModal()}>
                  Ersten Termin erstellen
                </GlassButton>
              </GlassCard>
            )
          )}
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="calendar__month">
          <div className="calendar__month-nav">
            <button className="calendar__nav-btn" onClick={prevMonth}>&lt;</button>
            <span className="calendar__month-label">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button className="calendar__nav-btn" onClick={nextMonth}>&gt;</button>
          </div>

          <div className="calendar__month-grid">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="calendar__weekday-header">{wd}</div>
            ))}
            {monthCells.map((cell, i) => {
              const dateStr = toDateStr(cell.year, cell.month, cell.day);
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <div
                  key={i}
                  className={[
                    'calendar__day-cell',
                    cell.outside ? 'calendar__day-cell--outside' : '',
                    isToday ? 'calendar__day-cell--today' : '',
                    isSelected ? 'calendar__day-cell--selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(cell)}
                >
                  <span className="calendar__day-number">{cell.day}</span>
                  {dayEvents.length > 0 && (
                    <div className="calendar__day-dots">
                      {dayEvents.slice(0, 4).map((ev) => (
                        <span
                          key={ev.id}
                          className="calendar__day-dot"
                          style={{ backgroundColor: TYPE_COLORS[ev.type] || '#6b7280' }}
                        />
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="calendar__day-more">+{dayEvents.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day detail panel */}
          {selectedDate && (
            <GlassCard hoverable={false} className="calendar__day-detail">
              <div className="calendar__day-detail-header">
                <h3>{formatDateDE(selectedDate)}</h3>
                <GlassButton onClick={() => openNewModal(selectedDate)}>
                  + Termin
                </GlassButton>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="calendar__day-detail-empty">Keine Termine an diesem Tag</p>
              ) : (
                selectedDayEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    compact
                    onEdit={() => openEditModal(ev)}
                    onToggle={() => toggleComplete(ev.id)}
                    onLeadClick={() => ev.leadId && navigate(`/pipeline/${ev.leadId}`)}
                  />
                ))
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="calendar__modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="calendar__modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="calendar__modal-title">
              {editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}
            </h2>

            <div className="calendar__modal-form">
              <label className="calendar__form-label">
                Titel *
                <input
                  type="text"
                  className="calendar__form-input"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Terminbezeichnung"
                  autoFocus
                />
              </label>

              <label className="calendar__form-label">
                Lead
                <select
                  className="calendar__form-input"
                  value={formData.leadId}
                  onChange={(e) => handleFieldChange('leadId', e.target.value)}
                >
                  <option value="">-- Kein Lead --</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}{lead.company ? ` (${lead.company})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="calendar__form-label">
                Typ
                <select
                  className="calendar__form-input"
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <div className="calendar__form-row">
                <label className="calendar__form-label">
                  Datum *
                  <input
                    type="date"
                    className="calendar__form-input"
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                  />
                </label>
                <label className="calendar__form-label">
                  Uhrzeit
                  <input
                    type="time"
                    className="calendar__form-input"
                    value={formData.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                  />
                </label>
              </div>

              <label className="calendar__form-label">
                Dauer
                <select
                  className="calendar__form-input"
                  value={formData.duration}
                  onChange={(e) => handleFieldChange('duration', e.target.value)}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              <label className="calendar__form-label">
                Ort
                <input
                  type="text"
                  className="calendar__form-input"
                  value={formData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="Adresse oder Link"
                />
              </label>

              <label className="calendar__form-label">
                Notizen
                <textarea
                  className="calendar__form-input calendar__form-textarea"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Zusaetzliche Informationen..."
                  rows={3}
                />
              </label>

              <label className="calendar__form-label">
                Erinnerung
                <select
                  className="calendar__form-input"
                  value={formData.reminder || ''}
                  onChange={(e) => handleFieldChange('reminder', e.target.value)}
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="calendar__modal-actions">
              {editingEvent && (
                <GlassButton className="calendar__modal-delete" onClick={handleDelete}>
                  Loeschen
                </GlassButton>
              )}
              <div className="calendar__modal-actions-right">
                <GlassButton onClick={() => setModalOpen(false)}>Abbrechen</GlassButton>
                <GlassButton variant="primary" onClick={handleSave}>
                  Speichern
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, overdue, compact, onEdit, onToggle, onLeadClick }) {
  return (
    <div
      className={[
        'calendar__event-card',
        overdue ? 'calendar__event-card--overdue' : '',
        event.completed ? 'calendar__event-card--completed' : '',
        compact ? 'calendar__event-card--compact' : '',
      ].filter(Boolean).join(' ')}
    >
      <button
        className={`calendar__event-check ${event.completed ? 'calendar__event-check--done' : ''}`}
        onClick={onToggle}
        title={event.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
      >
        {event.completed ? '\u2713' : ''}
      </button>

      <div className="calendar__event-info" onClick={onEdit}>
        <div className="calendar__event-top">
          {event.time && (
            <span className="calendar__event-time">{event.time}</span>
          )}
          <span className="calendar__event-title">{event.title}</span>
        </div>
        <div className="calendar__event-meta">
          <span
            className="calendar__event-type"
            style={{ backgroundColor: TYPE_COLORS[event.type] || '#6b7280' }}
          >
            {TYPE_LABELS[event.type] || event.type}
          </span>
          {event.leadName && (
            <button
              className="calendar__event-lead"
              onClick={(e) => { e.stopPropagation(); onLeadClick(); }}
            >
              {event.leadName}
            </button>
          )}
          {event.location && (
            <span className="calendar__event-location">{event.location}</span>
          )}
        </div>
      </div>
    </div>
  );
}
