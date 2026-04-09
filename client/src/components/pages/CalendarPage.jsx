import { CalendarView } from '../calendar/CalendarView.jsx';

export function CalendarPage() {
  return (
    <div>
      <h1>Kalender</h1>
      <p className="page-subtitle">Termine und Aktivitaeten</p>
      <CalendarView />
    </div>
  );
}

export default CalendarPage;
