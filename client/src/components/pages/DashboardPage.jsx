import { de } from '../../i18n/de.js';
import { KPIGrid } from '../dashboard/KPIGrid.jsx';
import { FollowUpWidget } from '../dashboard/FollowUpWidget.jsx';
import { AutoReportWidget } from '../dashboard/AutoReportWidget.jsx';
import { ReminderWidget } from '../dashboard/ReminderWidget.jsx';
import { LeadScoringWidget } from '../dashboard/LeadScoringWidget.jsx';
import { UpcomingWidget } from '../calendar/UpcomingWidget.jsx';

export function DashboardPage() {
  const t = de.pages.dashboard;
  return (
    <div>
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      <KPIGrid />
      <div className="dashboard-widgets">
        <LeadScoringWidget />
        <FollowUpWidget />
        <AutoReportWidget />
        <ReminderWidget />
        <UpcomingWidget />
      </div>
    </div>
  );
}
