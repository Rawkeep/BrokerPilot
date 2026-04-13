import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { PageLayout } from './components/layout/PageLayout.jsx';
import { AuthGuard } from './components/auth/AuthGuard.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { LoadingSpinner } from './components/LoadingSpinner.jsx';
import { useSettingsStore } from './stores/settingsStore';
import { useAuthStore } from './stores/authStore.js';
import { CookieBanner } from './components/landing/CookieBanner.jsx';
import { BROKER_TYPES } from '../../shared/brokerTypes.js';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('./components/pages/DashboardPage.jsx'));
const PipelinePage = lazy(() => import('./components/pages/PipelinePage.jsx'));
const LeadDetailPage = lazy(() => import('./components/crm/LeadDetailPage.jsx'));
const MarktPage = lazy(() => import('./components/pages/MarktPage.jsx'));
const AIAgentsPage = lazy(() => import('./components/pages/AIAgentsPage.jsx'));
const EinstellungenPage = lazy(() => import('./components/pages/EinstellungenPage.jsx'));
const AnalyticsPage = lazy(() => import('./components/pages/AnalyticsPage.jsx'));
const CalendarPage = lazy(() => import('./components/pages/CalendarPage.jsx'));
const TeamPage = lazy(() => import('./components/pages/TeamPage.jsx'));
const CampaignsPage = lazy(() => import('./components/pages/CampaignsPage.jsx'));
const WorkflowPage = lazy(() => import('./components/pages/WorkflowPage.jsx'));
const TradingPage = lazy(() => import('./components/pages/TradingPage.jsx'));
const LearningHub = lazy(() => import('./components/learning/LearningHub.jsx'));
const ClientPortal = lazy(() => import('./components/portal/ClientPortal.jsx'));
const LandingPage = lazy(() => import('./components/landing/LandingPage.jsx').then(m => ({ default: m.LandingPage })));
const ImpressumPage = lazy(() => import('./components/landing/LegalPages.jsx').then(m => ({ default: m.ImpressumPage })));
const DatenschutzPage = lazy(() => import('./components/landing/LegalPages.jsx').then(m => ({ default: m.DatenschutzPage })));
const AGBPage = lazy(() => import('./components/landing/LegalPages.jsx').then(m => ({ default: m.AGBPage })));

function AppRoutes() {
  const brokerType = useSettingsStore((s) => s.brokerType);
  const defaultPage = BROKER_TYPES[brokerType]?.defaultPage || '/dashboard';
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <AuthGuard>
        <PageLayout>
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/trading" element={<TradingPage />} />
              <Route path="/einstellungen" element={<EinstellungenPage />} />
              <Route path="/akademie" element={<LearningHub />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageLayout>
      </AuthGuard>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/agb" element={<AGBPage />} />
          <Route path="/portal/:token" element={<ClientPortal />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Suspense>
      <CookieBanner />
    </ErrorBoundary>
  );
}
