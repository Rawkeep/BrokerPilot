import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { PageLayout } from './components/layout/PageLayout.jsx';
import { AuthGuard } from './components/auth/AuthGuard.jsx';
import { DashboardPage } from './components/pages/DashboardPage.jsx';
import { PipelinePage } from './components/pages/PipelinePage.jsx';
import { LeadDetailPage } from './components/crm/LeadDetailPage.jsx';
import { MarktPage } from './components/pages/MarktPage.jsx';
import { AIAgentsPage } from './components/pages/AIAgentsPage.jsx';
import { EinstellungenPage } from './components/pages/EinstellungenPage.jsx';
import { CampaignsPage } from './components/pages/CampaignsPage.jsx';
import { CalendarPage } from './components/pages/CalendarPage.jsx';
import { TeamPage } from './components/pages/TeamPage.jsx';
import { AnalyticsPage } from './components/pages/AnalyticsPage.jsx';
import { WorkflowPage } from './components/pages/WorkflowPage.jsx';
import { ClientPortal } from './components/portal/ClientPortal.jsx';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore.js';
import { BROKER_TYPES } from '../../shared/brokerTypes.js';

function AppRoutes() {
  const brokerType = useSettingsStore((s) => s.brokerType);
  const defaultPage = BROKER_TYPES[brokerType]?.defaultPage || '/dashboard';
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <AuthGuard>
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPage} replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/pipeline/:leadId" element={<LeadDetailPage />} />
        <Route path="/markt" element={<MarktPage />} />
        <Route path="/ai-agents" element={<AIAgentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/kalender" element={<CalendarPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/kampagnen" element={<CampaignsPage />} />
        <Route path="/workflows" element={<WorkflowPage />} />
        <Route path="/einstellungen" element={<EinstellungenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/*" element={<AppRoutes />} />
    </Routes>
  );
}
