import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config.js';
import { useLeadStore } from '../../stores/leadStore.js';

const TRIGGER_LABELS = {
  lead_created: 'Bei Lead-Erstellung',
  'stage_change:besichtigung': 'Bei Stufenwechsel: Besichtigung',
  manual: 'Manuell',
  score_hot: 'Bei Hot-Score',
};

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const CONDITION_OPTIONS = [
  { value: '', label: 'Keine Bedingung' },
  { value: 'lead_not_closed', label: 'Lead nicht abgeschlossen' },
  { value: 'lead_active', label: 'Lead aktiv' },
];

const STATUS_LABELS = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
};

function createEmptyStep() {
  return {
    id: crypto.randomUUID(),
    delayDays: 0,
    templateId: '',
    subject: '',
    body: '',
    condition: null,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepEditor({ step, index, onChange, onRemove }) {
  function update(field, value) {
    onChange(index, { ...step, [field]: value });
  }

  return (
    <div className="campaigns__step">
      <div className="campaigns__step-header">
        <span className="campaigns__step-number">{index + 1}</span>
        <span className="campaigns__step-drag">&#x2630;</span>
        <span className="campaigns__step-delay">
          <label>Verzögerung (Tage)</label>
          <input
            type="number"
            min="0"
            value={step.delayDays}
            onChange={(e) => update('delayDays', parseInt(e.target.value, 10) || 0)}
          />
        </span>
        <button className="campaigns__step-remove" onClick={() => onRemove(index)} title="Schritt entfernen">
          &times;
        </button>
      </div>
      <div className="campaigns__step-body">
        <div className="campaigns__field">
          <label>Betreff</label>
          <input
            type="text"
            value={step.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder="E-Mail Betreff ({{leadName}} verfügbar)"
          />
        </div>
        <div className="campaigns__field">
          <label>Inhalt</label>
          <textarea
            rows={4}
            value={step.body}
            onChange={(e) => update('body', e.target.value)}
            placeholder="E-Mail Inhalt (HTML, {{leadName}} verfügbar)"
          />
        </div>
        <div className="campaigns__field">
          <label>Bedingung</label>
          <select
            value={step.condition || ''}
            onChange={(e) => update('condition', e.target.value || null)}
          >
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CampaignEditor({ campaign, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    trigger: campaign?.trigger || 'manual',
    enabled: campaign?.enabled ?? true,
    steps: campaign?.steps?.length ? [...campaign.steps] : [createEmptyStep()],
  });

  function updateStep(index, updated) {
    const steps = [...form.steps];
    steps[index] = updated;
    setForm({ ...form, steps });
  }

  function removeStep(index) {
    if (form.steps.length <= 1) return;
    const steps = form.steps.filter((_, i) => i !== index);
    setForm({ ...form, steps });
  }

  function addStep() {
    setForm({
      ...form,
      steps: [...form.steps, createEmptyStep()],
    });
  }

  function handleSave() {
    onSave({
      name: form.name,
      trigger: form.trigger,
      enabled: form.enabled,
      steps: form.steps,
    });
  }

  return (
    <div className="campaigns__editor">
      <h3 className="campaigns__editor-title">
        {campaign ? 'Kampagne bearbeiten' : 'Neue Kampagne'}
      </h3>

      <div className="campaigns__field">
        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Kampagnenname"
        />
      </div>

      <div className="campaigns__field">
        <label>Trigger</label>
        <select
          value={form.trigger}
          onChange={(e) => setForm({ ...form, trigger: e.target.value })}
        >
          {TRIGGER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="campaigns__field campaigns__field--toggle">
        <label>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Kampagne aktiv
        </label>
      </div>

      <div className="campaigns__steps">
        <h4 className="campaigns__steps-title">Schritte ({form.steps.length})</h4>
        <div className="campaigns__steps-timeline">
          {form.steps.map((step, i) => (
            <StepEditor
              key={step.id}
              step={step}
              index={i}
              onChange={updateStep}
              onRemove={removeStep}
            />
          ))}
        </div>
        <button className="campaigns__add-step" onClick={addStep}>
          + Schritt hinzufügen
        </button>
      </div>

      <div className="campaigns__editor-actions">
        <button className="btn btn--primary" onClick={handleSave}>Speichern</button>
        <button className="btn btn--secondary" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}

function EnrollmentList({ campaignId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const leads = useLeadStore((s) => s.leads);

  const loadEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/enrollments`);
      if (res.ok) {
        setEnrollments(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  async function handlePause(enrollmentId) {
    const res = await fetch(
      `${API_BASE}/api/campaigns/${campaignId}/enrollments/${enrollmentId}/pause`,
      { method: 'POST' },
    );
    if (res.ok) loadEnrollments();
  }

  async function handleResume(enrollmentId) {
    const res = await fetch(
      `${API_BASE}/api/campaigns/${campaignId}/enrollments/${enrollmentId}/resume`,
      { method: 'POST' },
    );
    if (res.ok) loadEnrollments();
  }

  if (loading) return <p className="campaigns__loading">Lade Einschreibungen...</p>;
  if (enrollments.length === 0) return <p className="campaigns__empty">Keine Einschreibungen vorhanden.</p>;

  return (
    <div className="campaigns__enrollments">
      <table className="campaigns__enrollment-table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Status</th>
            <th>Schritt</th>
            <th>Eingeschrieben</th>
            <th>Nächster Versand</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e) => (
            <tr key={e.id}>
              <td>{e.leadName || e.leadEmail}</td>
              <td>
                <span className={`campaigns__status campaigns__status--${e.status}`}>
                  {STATUS_LABELS[e.status] || e.status}
                </span>
              </td>
              <td>{e.currentStep + 1}</td>
              <td>{new Date(e.startedAt).toLocaleDateString('de-DE')}</td>
              <td>
                {e.status === 'completed'
                  ? '—'
                  : new Date(e.nextSendAt).toLocaleDateString('de-DE')}
              </td>
              <td>
                {e.status === 'active' && (
                  <button className="btn btn--small btn--secondary" onClick={() => handlePause(e.id)}>
                    Pausieren
                  </button>
                )}
                {e.status === 'paused' && (
                  <button className="btn btn--small btn--primary" onClick={() => handleResume(e.id)}>
                    Fortsetzen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnrollLeadForm({ campaignId, onEnrolled }) {
  const leads = useLeadStore((s) => s.leads);
  const [selectedLeadId, setSelectedLeadId] = useState('');

  async function handleEnroll() {
    if (!selectedLeadId) return;
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        leadEmail: lead.email || lead.kontakt?.email || 'keine-email@beispiel.de',
        leadName: lead.name || lead.firma || 'Unbekannt',
      }),
    });

    if (res.ok) {
      setSelectedLeadId('');
      onEnrolled();
    }
  }

  return (
    <div className="campaigns__enroll-form">
      <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)}>
        <option value="">Lead auswählen...</option>
        {leads.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name || l.firma || l.id}
          </option>
        ))}
      </select>
      <button className="btn btn--primary btn--small" onClick={handleEnroll} disabled={!selectedLeadId}>
        Einschreiben
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | campaign object
  const [expandedEnrollments, setExpandedEnrollments] = useState(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns`);
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleSave(data) {
    const isNew = editing === 'new';
    const url = isNew
      ? `${API_BASE}/api/campaigns`
      : `${API_BASE}/api/campaigns/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setEditing(null);
      loadCampaigns();
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`${API_BASE}/api/campaigns/${id}`, { method: 'DELETE' });
    if (res.ok) loadCampaigns();
  }

  async function handleToggle(campaign) {
    await fetch(`${API_BASE}/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !campaign.enabled }),
    });
    loadCampaigns();
  }

  if (loading) {
    return <div className="campaigns"><p className="campaigns__loading">Lade Kampagnen...</p></div>;
  }

  if (editing) {
    return (
      <div className="campaigns">
        <CampaignEditor
          campaign={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="campaigns">
      <div className="campaigns__header">
        <h2 className="campaigns__title">Drip-Kampagnen</h2>
        <button className="btn btn--primary" onClick={() => setEditing('new')}>
          + Neue Kampagne
        </button>
      </div>

      <div className="campaigns__list">
        {campaigns.length === 0 && (
          <p className="campaigns__empty">Noch keine Kampagnen vorhanden.</p>
        )}

        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaigns__card">
            <div className="campaigns__card-header">
              <div className="campaigns__card-info">
                <h3 className="campaigns__card-name">{campaign.name}</h3>
                <span
                  className={`campaigns__badge campaigns__badge--${campaign.enabled ? 'active' : 'paused'}`}
                  onClick={() => handleToggle(campaign)}
                  title="Klicken zum Umschalten"
                >
                  {campaign.enabled ? 'Aktiv' : 'Pausiert'}
                </span>
              </div>
              <div className="campaigns__card-meta">
                <span>{campaign.steps?.length || 0} Schritte</span>
                <span className="campaigns__separator">&middot;</span>
                <span>{campaign.enrollmentCount || 0} eingeschrieben</span>
                <span className="campaigns__separator">&middot;</span>
                <span>{campaign.emailsSent || 0} gesendet</span>
              </div>
              <div className="campaigns__card-trigger">
                Trigger: {TRIGGER_LABELS[campaign.trigger] || campaign.trigger}
              </div>
            </div>

            <div className="campaigns__card-actions">
              <button className="btn btn--small btn--secondary" onClick={() => setEditing(campaign)}>
                Bearbeiten
              </button>
              <button
                className="btn btn--small btn--secondary"
                onClick={() =>
                  setExpandedEnrollments(
                    expandedEnrollments === campaign.id ? null : campaign.id,
                  )
                }
              >
                {expandedEnrollments === campaign.id ? 'Einschreibungen verbergen' : 'Einschreibungen'}
              </button>
              <button
                className="btn btn--small btn--danger"
                onClick={() => handleDelete(campaign.id)}
              >
                Löschen
              </button>
            </div>

            {expandedEnrollments === campaign.id && (
              <div className="campaigns__enrollment-section">
                <EnrollLeadForm campaignId={campaign.id} onEnrolled={loadCampaigns} />
                <EnrollmentList campaignId={campaign.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
