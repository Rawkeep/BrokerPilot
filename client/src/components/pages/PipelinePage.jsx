import { useState } from 'react';
import { Link } from 'react-router';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { KanbanBoard } from '../crm/KanbanBoard.jsx';
import { ExportButton } from '../export/ExportButton.jsx';
import { ImportModal } from '../export/ImportModal.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useLeadStore } from '../../stores/leadStore.js';
import { de } from '../../i18n/de.js';

export function PipelinePage() {
  const t = de.pages.pipeline;
  const brokerType = useSettingsStore((s) => s.brokerType);
  const leads = useLeadStore((s) => s.leads);
  const leadCount = leads.filter((l) => l.brokerType === brokerType).length;
  const [showImport, setShowImport] = useState(false);

  if (!brokerType) {
    return (
      <div>
        <h1>{t.title}</h1>
        <p className="page-subtitle">{t.subtitle}</p>
        <div className="pipeline-no-broker">
          <GlassCard hoverable={false}>
            <p>{t.noBrokerType}</p>
            <Link to="/einstellungen">
              <GlassButton variant="primary">{t.selectBrokerType}</GlassButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pipeline-header">
        <div className="pipeline-header__info">
          <h1>{t.title}</h1>
          <p className="page-subtitle">{t.subtitle} &mdash; {leadCount} {de.crm.leads} in der Pipeline</p>
        </div>
      </div>
      <div className="pipeline-toolbar">
        <ExportButton />
        <GlassButton onClick={() => setShowImport(true)}>
          {de.export?.import || 'CSV Import'}
        </GlassButton>
      </div>
      <KanbanBoard />
      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}

export default PipelinePage;
