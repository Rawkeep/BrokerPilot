import { de } from '../../i18n/de.js';
import { KPIGrid } from '../dashboard/KPIGrid.jsx';
import { FollowUpWidget } from '../dashboard/FollowUpWidget.jsx';
import { AutoReportWidget } from '../dashboard/AutoReportWidget.jsx';
import { ReminderWidget } from '../dashboard/ReminderWidget.jsx';
import { LeadScoringWidget } from '../dashboard/LeadScoringWidget.jsx';
import { UpcomingWidget } from '../calendar/UpcomingWidget.jsx';
import { DemoDataLoader } from '../dashboard/DemoDataLoader.jsx';
import { OnboardingTour, useOnboarding } from '../onboarding/OnboardingTour.jsx';

export function DashboardPage() {
  const t = de.pages.dashboard;
  const { showTour, dismissTour } = useOnboarding();

  return (
    <div>
      {showTour && <OnboardingTour onComplete={dismissTour} />}
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      <DemoDataLoader />
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
