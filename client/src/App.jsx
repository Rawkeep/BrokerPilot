import { Routes, Route, Navigate } from 'react-router';
import { PageLayout } from './components/layout/PageLayout.jsx';
import { DashboardPage } from './components/pages/DashboardPage.jsx';
import { PipelinePage } from './components/pages/PipelinePage.jsx';
import { MarktPage } from './components/pages/MarktPage.jsx';
import { AIAgentsPage } from './components/pages/AIAgentsPage.jsx';
import { EinstellungenPage } from './components/pages/EinstellungenPage.jsx';
import { useSettingsStore } from './stores/settingsStore';
import { BROKER_TYPES } from '../../shared/brokerTypes.js';

function AppRoutes() {
  const brokerType = useSettingsStore((s) => s.brokerType);
  const defaultPage = BROKER_TYPES[brokerType]?.defaultPage || '/dashboard';

  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPage} replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/markt" element={<MarktPage />} />
        <Route path="/ai-agents" element={<AIAgentsPage />} />
        <Route path="/einstellungen" element={<EinstellungenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
  );
}

export default function App() {
  return <AppRoutes />;
}
