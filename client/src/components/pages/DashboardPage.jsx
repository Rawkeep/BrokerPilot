import { de } from '../../i18n/de.js';
import { KPIGrid } from '../dashboard/KPIGrid.jsx';

export function DashboardPage() {
  const t = de.pages.dashboard;
  return (
    <div>
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      <KPIGrid />
    </div>
  );
}
