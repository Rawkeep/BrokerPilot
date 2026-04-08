import { useEffect } from 'react';
import { Link } from 'react-router';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { GlassCard } from '../ui/GlassCard.jsx';
import { KPICard } from './KPICard.jsx';
import { PipelineChart } from './PipelineChart.jsx';
import { ConversionFunnel } from './ConversionFunnel.jsx';
import { RecentActivityFeed } from './RecentActivityFeed.jsx';
import { de } from '../../i18n/de.js';

function SkeletonCard() {
  return (
    <GlassCard hoverable={false} className="kpi-skeleton">
      <div className="kpi-skeleton__line kpi-skeleton__line--short" />
      <div className="kpi-skeleton__line kpi-skeleton__line--large" />
      <div className="kpi-skeleton__line kpi-skeleton__line--short" />
    </GlassCard>
  );
}

/**
 * Dashboard KPI grid — reads from leadStore and settingsStore,
 * computes KPIs, and renders cards + charts + activity feed.
 */
export function KPIGrid() {
  const leads = useLeadStore((s) => s.leads);
  const loading = useLeadStore((s) => s.loading);
  const init = useLeadStore((s) => s.init);
  const getKPIs = useLeadStore((s) => s.getKPIs);
  const brokerType = useSettingsStore((s) => s.brokerType);

  useEffect(() => {
    init();
  }, [init]);

  if (!brokerType) {
    return (
      <GlassCard hoverable={false} className="dashboard-no-broker">
        <p>{de.pages.pipeline.noBrokerType}</p>
        <Link to="/einstellungen" className="glass-button">
          {de.pages.pipeline.selectBrokerType}
        </Link>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <>
        <div className="dashboard-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    );
  }

  const stages = BROKER_TYPES[brokerType]?.pipelineStages ?? [];
  const kpis = getKPIs(brokerType, stages);

  return (
    <>
      {/* KPI Cards */}
      <div className="dashboard-grid">
        <KPICard
          title={de.crm.kpis.pipelineValue}
          value={kpis.pipelineValue}
          format="currency"
          icon="\ud83d\udcb0"
        />
        <KPICard
          title={de.crm.kpis.conversionRate}
          value={kpis.conversionRate}
          format="percent"
          icon="\ud83c\udfaf"
        />
        <KPICard
          title={de.crm.kpis.activeDeals}
          value={kpis.activeDeals}
          format="number"
          icon="\ud83d\udcc8"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        <PipelineChart data={kpis.perStage} />
        <ConversionFunnel data={kpis.perStage} total={leads.filter((l) => l.brokerType === brokerType).length} />
      </div>

      {/* Activity Feed */}
      <RecentActivityFeed activities={kpis.recentActivity} />
    </>
  );
}
