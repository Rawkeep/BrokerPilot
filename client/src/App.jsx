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
        <Route path="/einstellungen" element={<EinstellungenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
    </AuthGuard>
  );
}

export default function App() {
  return <AppRoutes />;
}
