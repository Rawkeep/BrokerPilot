import { useState, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { generatePerformanceReport, downloadReport } from '../../services/reportGenerator.js';
import { API_BASE } from '../../config.js';

const PERIODS = [
  { id: 'month', label: 'Diesen Monat' },
  { id: 'last30', label: 'Letzte 30 Tage' },
  { id: 'quarter', label: 'Dieses Quartal' },
  { id: 'year', label: 'Dieses Jahr' },
];

const SECTION_OPTIONS = [
  { id: 'kpi', label: 'KPI-Uebersicht' },
  { id: 'pipeline', label: 'Pipeline-Analyse' },
  { id: 'topDeals', label: 'Top-Deals' },
  { id: 'activities', label: 'Aktivitaeten' },
];

export function ReportExport() {
  const leads = useLeadStore((s) => s.leads);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const config = brokerType ? BROKER_TYPES[brokerType] : null;

  const [period, setPeriod] = useState('month');
  const [sections, setSections] = useState({
    kpi: true,
    pipeline: true,
    topDeals: true,
    activities: true,
  });
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const toggleSection = useCallback((id) => {
    setSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const buildReport = useCallback(async () => {
    return generatePerformanceReport({
      leads,
      brokerType,
      stages: config?.pipelineStages || [],
      period,
      teamName: config?.label || 'BrokerPilot',
      sections,
    });
  }, [leads, brokerType, config, period, sections]);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      const blob = await buildReport();
      const date = new Date().toISOString().slice(0, 10);
      downloadReport(blob, `BrokerPilot-Bericht-${date}.pdf`);
    } catch (err) {
      console.error('Fehler beim Erstellen des Berichts:', err);
    } finally {
      setLoading(false);
    }
  }, [buildReport]);

  const handleEmail = useCallback(async () => {
    setEmailLoading(true);
    try {
      const blob = await buildReport();
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const date = new Date().toISOString().slice(0, 10);
      await fetch(`${API_BASE}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `BrokerPilot Performance-Bericht ${date}`,
          attachment: base64,
          filename: `BrokerPilot-Bericht-${date}.pdf`,
        }),
      });
    } catch (err) {
      console.error('Fehler beim E-Mail-Versand:', err);
    } finally {
      setEmailLoading(false);
    }
  }, [buildReport]);

  const hasAnySectionSelected = Object.values(sections).some(Boolean);

  return (
    <GlassCard className="report-export">
      <h3 className="report-export__title">Bericht generieren</h3>

      {/* Zeitraum */}
      <div className="report-export__field">
        <span className="report-export__label">Zeitraum</span>
        <div className="report-export__period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`report-export__period-tab${period === p.id ? ' report-export__period-tab--active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inhalte */}
      <div className="report-export__field">
        <span className="report-export__label">Inhalt</span>
        <div className="report-export__sections">
          {SECTION_OPTIONS.map((opt) => (
            <label key={opt.id} className="report-export__checkbox">
              <input
                type="checkbox"
                checked={sections[opt.id]}
                onChange={() => toggleSection(opt.id)}
              />
              <span className="report-export__checkmark" />
              <span className="report-export__checkbox-label">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Aktionen */}
      <div className="report-export__actions">
        <button
          type="button"
          className="report-export__btn report-export__btn--primary"
          onClick={handleDownload}
          disabled={loading || !hasAnySectionSelected}
        >
          {loading ? (
            <span className="report-export__spinner" />
          ) : null}
          {loading ? 'Wird erstellt\u2026' : 'PDF herunterladen'}
        </button>
        <button
          type="button"
          className="report-export__btn report-export__btn--secondary"
          onClick={handleEmail}
          disabled={emailLoading || !hasAnySectionSelected}
        >
          {emailLoading ? (
            <span className="report-export__spinner" />
          ) : null}
          {emailLoading ? 'Wird gesendet\u2026' : 'Per E-Mail senden'}
        </button>
      </div>
    </GlassCard>
  );
}
