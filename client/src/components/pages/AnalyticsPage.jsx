import { TeamDashboard } from '../analytics/TeamDashboard.jsx';
import { ReportExport } from '../analytics/ReportExport.jsx';

export function AnalyticsPage() {
  return (
    <div>
      <h1>Team Analytics</h1>
      <p className="page-subtitle">Performance-Uebersicht und Kennzahlen</p>
      <TeamDashboard />
      <ReportExport />
    </div>
  );
}
