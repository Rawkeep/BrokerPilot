import { useState } from 'react';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { downloadCSV } from '../../services/csvExport.js';
import { de } from '../../i18n/de.js';

/**
 * ExportButton — CSV export button for leads.
 *
 * Reads leads from leadStore, brokerType from settingsStore.
 * Calls downloadCSV on click and shows confirmation message.
 */
export function ExportButton() {
  const [exported, setExported] = useState(false);
  const leads = useLeadStore((s) => s.leads);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const t = de.export || {};

  function handleExport() {
    const filtered = leads.filter((l) => l.brokerType === brokerType);
    if (filtered.length === 0) return;

    downloadCSV(filtered, brokerType);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  const count = leads.filter((l) => l.brokerType === brokerType).length;

  return (
    <div className="export-button-wrapper">
      <GlassButton onClick={handleExport} disabled={count === 0}>
        {t.csv || 'CSV Export'} ({count})
      </GlassButton>
      {exported && (
        <span className="export-button__confirmation">
          {t.exported || 'CSV heruntergeladen'}
        </span>
      )}
    </div>
  );
}
