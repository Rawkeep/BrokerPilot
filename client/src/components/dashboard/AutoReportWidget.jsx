import { useState, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * AutoReportWidget — Generates on-demand pipeline summary reports.
 */
export function AutoReportWidget() {
  const leads = useLeadStore((s) => s.leads);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const [showReport, setShowReport] = useState(false);

  const report = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const filtered = brokerType
      ? leads.filter((l) => l.brokerType === brokerType)
      : leads;

    const thisWeek = filtered.filter((l) => new Date(l.createdAt) >= weekAgo);
    const thisMonth = filtered.filter((l) => new Date(l.createdAt) >= monthAgo);

    const totalValue = filtered.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const weekValue = thisWeek.reduce((sum, l) => sum + (l.dealValue || 0), 0);

    const closed = filtered.filter((l) => {
      const stage = (l.stage || '').toLowerCase();
      return stage.includes('abgeschlossen') || stage.includes('closing') || stage.includes('closed');
    });

    const config = brokerType ? BROKER_TYPES[brokerType] : null;
    const stages = config?.pipelineStages || [];

    // Stage distribution
    const stageDistribution = stages.map((s) => ({
      label: s.label,
      count: filtered.filter((l) => l.stage === s.id).length,
    })).filter((s) => s.count > 0);

    // Priority distribution
    const priorities = {
      high: filtered.filter((l) => l.priority === 'high').length,
      medium: filtered.filter((l) => l.priority === 'medium').length,
      low: filtered.filter((l) => l.priority === 'low').length,
    };

    return {
      total: filtered.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      closed: closed.length,
      totalValue,
      weekValue,
      conversionRate: filtered.length > 0 ? ((closed.length / filtered.length) * 100).toFixed(1) : '0',
      stageDistribution,
      priorities,
      brokerLabel: config?.label || 'Alle',
      generatedAt: now.toLocaleString('de-DE'),
    };
  }, [leads, brokerType]);

  function handleDownloadText() {
    const lines = [
      `BrokerPilot Bericht — ${report.brokerLabel}`,
      `Generiert: ${report.generatedAt}`,
      '═══════════════════════════════════════',
      '',
      `Leads gesamt: ${report.total}`,
      `Neue Leads diese Woche: ${report.thisWeek}`,
      `Neue Leads diesen Monat: ${report.thisMonth}`,
      `Abgeschlossen: ${report.closed}`,
      `Abschlussquote: ${report.conversionRate}%`,
      '',
      `Pipeline-Wert gesamt: ${currencyFmt.format(report.totalValue)}`,
      `Wert diese Woche: ${currencyFmt.format(report.weekValue)}`,
      '',
      'Verteilung nach Phase:',
      ...report.stageDistribution.map((s) => `  ${s.label}: ${s.count}`),
      '',
      'Prioritaeten:',
      `  Hoch: ${report.priorities.high}`,
      `  Mittel: ${report.priorities.medium}`,
      `  Niedrig: ${report.priorities.low}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brokerpilot-bericht-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <GlassCard hoverable={false} className="auto-report-widget">
      <div className="auto-report-widget__header">
        <h3 className="auto-report-widget__title">Automatische Berichte</h3>
        <GlassButton onClick={() => setShowReport((v) => !v)}>
          {showReport ? 'Einklappen' : 'Bericht anzeigen'}
        </GlassButton>
      </div>

      {showReport && (
        <div className="auto-report-widget__content">
          <div className="auto-report-widget__grid">
            <div className="auto-report-widget__stat">
              <span className="auto-report-widget__stat-value">{report.total}</span>
              <span className="auto-report-widget__stat-label">Leads gesamt</span>
            </div>
            <div className="auto-report-widget__stat">
              <span className="auto-report-widget__stat-value">{report.thisWeek}</span>
              <span className="auto-report-widget__stat-label">Neue diese Woche</span>
            </div>
            <div className="auto-report-widget__stat">
              <span className="auto-report-widget__stat-value">{report.conversionRate}%</span>
              <span className="auto-report-widget__stat-label">Abschlussquote</span>
            </div>
            <div className="auto-report-widget__stat">
              <span className="auto-report-widget__stat-value">{currencyFmt.format(report.totalValue)}</span>
              <span className="auto-report-widget__stat-label">Pipeline-Wert</span>
            </div>
          </div>

          {report.stageDistribution.length > 0 && (
            <div className="auto-report-widget__stages">
              <h4>Phase-Verteilung</h4>
              {report.stageDistribution.map((s) => (
                <div key={s.label} className="auto-report-widget__stage-row">
                  <span>{s.label}</span>
                  <span className="auto-report-widget__stage-count">{s.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="auto-report-widget__actions">
            <GlassButton variant="primary" onClick={handleDownloadText}>
              Bericht herunterladen
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
