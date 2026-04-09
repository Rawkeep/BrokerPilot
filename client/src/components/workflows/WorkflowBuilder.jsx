import { useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';

const TRIGGER_LABELS = {
  lead_created: 'Bei Lead-Erstellung',
  stage_changed: 'Bei Phasenänderung',
  score_hot: 'Score wird Hot (\u226570)',
  deal_closed: 'Bei Deal-Abschluss',
  no_activity_7d: 'Keine Aktivität (7 Tage)',
  manual: 'Manuell',
};

const STEP_ICONS = {
  send_email: '\uD83D\uDCE7',
  change_stage: '\uD83D\uDCCB',
  add_tag: '\uD83C\uDFF7\uFE0F',
  assign_member: '\uD83D\uDC64',
  create_reminder: '\u23F0',
  run_pipeline: '\uD83E\uDD16',
  webhook: '\uD83D\uDD17',
};

const STEP_LABELS = {
  send_email: 'E-Mail senden',
  change_stage: 'Phase ändern',
  add_tag: 'Tag hinzufügen',
  assign_member: 'Mitglied zuweisen',
  create_reminder: 'Erinnerung erstellen',
  run_pipeline: 'Pipeline starten',
  webhook: 'Webhook',
};

const EMAIL_TEMPLATES = [
  { id: 'welcome', label: 'Willkommen' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'closing', label: 'Abschluss' },
  { id: 'reminder', label: 'Erinnerung' },
  { id: 'info', label: 'Information' },
];

function getStepSummary(step) {
  switch (step.type) {
    case 'send_email': {
      const tpl = EMAIL_TEMPLATES.find((t) => t.id === step.templateId);
      return tpl ? tpl.label : step.templateId || '—';
    }
    case 'change_stage':
      return step.targetStage || '—';
    case 'add_tag':
      return step.tag ? `"${step.tag}"` : '—';
    case 'assign_member':
      return step.memberId || '—';
    case 'create_reminder':
      return step.reminderText || '—';
    case 'run_pipeline':
      return 'Alle Agenten';
    case 'webhook':
      return step.url || '—';
    default:
      return '';
  }
}

function getDelayLabel(hours) {
  if (!hours || hours === 0) return 'sofort';
  if (hours < 24) return `nach ${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `nach ${days}d`;
  return `nach ${days}d ${rem}h`;
}

/* ------------------------------------------------------------------ */
/*  Step Config — inline editor for each step type                    */
/* ------------------------------------------------------------------ */
function StepConfig({ step, onChange, brokerType }) {
  const stages = BROKER_TYPES[brokerType]?.pipelineStages || [];

  switch (step.type) {
    case 'send_email':
      return (
        <div className="workflow__step-config">
          <label>Vorlage</label>
          <select
            value={step.templateId || ''}
            onChange={(e) => onChange({ ...step, templateId: e.target.value })}
          >
            <option value="">— Vorlage wählen —</option>
            {EMAIL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      );
    case 'change_stage':
      return (
        <div className="workflow__step-config">
          <label>Ziel-Phase</label>
          <select
            value={step.targetStage || ''}
            onChange={(e) => onChange({ ...step, targetStage: e.target.value })}
          >
            <option value="">— Phase wählen —</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      );
    case 'add_tag':
      return (
        <div className="workflow__step-config">
          <label>Tag</label>
          <input
            type="text"
            value={step.tag || ''}
            onChange={(e) => onChange({ ...step, tag: e.target.value })}
            placeholder="Tag eingeben..."
          />
        </div>
      );
    case 'assign_member':
      return (
        <div className="workflow__step-config">
          <label>Mitglied</label>
          <input
            type="text"
            value={step.memberId || ''}
            onChange={(e) => onChange({ ...step, memberId: e.target.value })}
            placeholder="Mitglied-ID eingeben..."
          />
        </div>
      );
    case 'create_reminder':
      return (
        <div className="workflow__step-config">
          <label>Erinnerungstext</label>
          <input
            type="text"
            value={step.reminderText || ''}
            onChange={(e) => onChange({ ...step, reminderText: e.target.value })}
            placeholder="Erinnerung eingeben..."
          />
        </div>
      );
    case 'webhook':
      return (
        <div className="workflow__step-config">
          <label>Webhook URL</label>
          <input
            type="text"
            value={step.url || ''}
            onChange={(e) => onChange({ ...step, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );
    case 'run_pipeline':
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Step Type Selector                                                */
/* ------------------------------------------------------------------ */
function StepTypeSelector({ onSelect, onClose }) {
  const types = Object.keys(STEP_ICONS);
  return (
    <div className="workflow__type-selector">
      <div className="workflow__type-grid">
        {types.map((type) => (
          <button
            key={type}
            className="workflow__type-card"
            onClick={() => onSelect(type)}
          >
            <span className="workflow__type-icon">{STEP_ICONS[type]}</span>
            <span className="workflow__type-label">{STEP_LABELS[type]}</span>
          </button>
        ))}
      </div>
      <button className="workflow__type-close" onClick={onClose}>
        Abbrechen
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow Editor                                                    */
/* ------------------------------------------------------------------ */
function WorkflowEditor({ workflow, onClose }) {
  const { updateWorkflow, deleteWorkflow, addStep, removeStep } = useWorkflowStore();
  const brokerType = useSettingsStore((s) => s.brokerType);

  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [trigger, setTrigger] = useState(workflow.trigger);
  const [steps, setSteps] = useState(workflow.steps);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleSave = () => {
    updateWorkflow(workflow.id, { name, description, trigger, steps });
    onClose();
  };

  const handleDelete = () => {
    deleteWorkflow(workflow.id);
    onClose();
  };

  const handleStepChange = (index, updated) => {
    const next = [...steps];
    next[index] = updated;
    setSteps(next);
  };

  const handleStepDelayChange = (index, delay) => {
    const next = [...steps];
    next[index] = { ...next[index], delay: Number(delay) || 0 };
    setSteps(next);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleAddStep = (type) => {
    const newStep = { id: crypto.randomUUID(), type, delay: 0 };
    setSteps([...steps, newStep]);
    setShowTypeSelector(false);
  };

  const handleMoveStep = (index, direction) => {
    const next = [...steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  };

  return (
    <div className="workflow__editor">
      <h3 className="workflow__editor-title">
        Workflow bearbeiten: {workflow.name}
      </h3>

      <div className="workflow__field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow-Name..."
        />
      </div>

      <div className="workflow__field">
        <label>Beschreibung</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung..."
        />
      </div>

      <div className="workflow__field">
        <label>Trigger</label>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="workflow__timeline-section">
        <div className="workflow__trigger-node">
          <span className="workflow__trigger-dot" />
          <span className="workflow__trigger-label">
            TRIGGER: {TRIGGER_LABELS[trigger]}
          </span>
        </div>

        <div className="workflow__timeline">
          {steps.map((step, i) => (
            <div key={step.id} className="workflow__step">
              <span className="workflow__step-number">{i + 1}</span>
              <div className="workflow__step-content">
                <div className="workflow__step-header">
                  <span className="workflow__step-icon">{STEP_ICONS[step.type]}</span>
                  <span className="workflow__step-label">
                    {STEP_LABELS[step.type]}: {getStepSummary(step)}
                  </span>
                  <span className="workflow__step-delay-badge">
                    {getDelayLabel(step.delay)}
                  </span>
                  <div className="workflow__step-actions">
                    <button
                      className="workflow__step-move"
                      onClick={() => handleMoveStep(i, -1)}
                      disabled={i === 0}
                      title="Nach oben"
                    >
                      \u25B2
                    </button>
                    <button
                      className="workflow__step-move"
                      onClick={() => handleMoveStep(i, 1)}
                      disabled={i === steps.length - 1}
                      title="Nach unten"
                    >
                      \u25BC
                    </button>
                    <button
                      className="workflow__step-remove"
                      onClick={() => handleRemoveStep(i)}
                      title="Entfernen"
                    >
                      \u00D7
                    </button>
                  </div>
                </div>

                <StepConfig
                  step={step}
                  onChange={(updated) => handleStepChange(i, updated)}
                  brokerType={brokerType}
                />

                <div className="workflow__step-delay-input">
                  <label>Verzögerung (Stunden):</label>
                  <input
                    type="number"
                    min="0"
                    value={step.delay}
                    onChange={(e) => handleStepDelayChange(i, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {showTypeSelector ? (
          <StepTypeSelector
            onSelect={handleAddStep}
            onClose={() => setShowTypeSelector(false)}
          />
        ) : (
          <button
            className="workflow__add-step"
            onClick={() => setShowTypeSelector(true)}
          >
            + Schritt hinzufügen
          </button>
        )}
      </div>

      <div className="workflow__editor-actions">
        <button className="btn btn--primary" onClick={handleSave}>
          Speichern
        </button>
        <button className="btn btn--secondary" onClick={onClose}>
          Abbrechen
        </button>
        <button className="btn btn--danger" onClick={handleDelete}>
          Löschen
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow Card                                                      */
/* ------------------------------------------------------------------ */
function WorkflowCard({ workflow, onEdit }) {
  const toggleWorkflow = useWorkflowStore((s) => s.toggleWorkflow);

  return (
    <div className="workflow__card">
      <div className="workflow__card-header">
        <div className="workflow__card-info">
          <h3 className="workflow__card-name">{workflow.name}</h3>
          <span
            className={`workflow__badge ${
              workflow.enabled ? 'workflow__badge--active' : 'workflow__badge--inactive'
            }`}
            onClick={() => toggleWorkflow(workflow.id)}
          >
            {workflow.enabled ? 'Aktiv' : 'Inaktiv'}
          </span>
          {workflow.runCount > 0 && (
            <span className="workflow__run-count">
              {workflow.runCount}x ausgeführt
            </span>
          )}
        </div>
        <p className="workflow__card-description">{workflow.description}</p>
        <span className="workflow__card-trigger">
          Trigger: {TRIGGER_LABELS[workflow.trigger]}
        </span>
      </div>

      <div className="workflow__card-steps-preview">
        {workflow.steps.map((step, i) => (
          <span key={step.id} className="workflow__preview-step">
            {STEP_ICONS[step.type]}
            {i < workflow.steps.length - 1 && (
              <span className="workflow__preview-arrow">\u2192</span>
            )}
          </span>
        ))}
      </div>

      <div className="workflow__card-actions">
        <button className="btn btn--small" onClick={() => onEdit(workflow)}>
          Bearbeiten
        </button>
        <button
          className="btn btn--small btn--secondary"
          onClick={() => toggleWorkflow(workflow.id)}
        >
          {workflow.enabled ? 'Deaktivieren' : 'Aktivieren'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Builder                                                       */
/* ------------------------------------------------------------------ */
export function WorkflowBuilder() {
  const workflows = useWorkflowStore((s) => s.workflows);
  const addWorkflow = useWorkflowStore((s) => s.addWorkflow);
  const [editing, setEditing] = useState(null);

  const handleNew = () => {
    const newWorkflow = {
      name: 'Neuer Workflow',
      description: '',
      trigger: 'manual',
      enabled: false,
      steps: [],
    };
    addWorkflow(newWorkflow);
    // Get the newly added workflow (last in list)
    const latest = useWorkflowStore.getState().workflows;
    setEditing(latest[latest.length - 1]);
  };

  return (
    <div className="workflow">
      <div className="workflow__header">
        <h2 className="workflow__title">Workflow Automation</h2>
        <button className="btn btn--primary" onClick={handleNew}>
          + Neu
        </button>
      </div>

      <div className="workflow__list">
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            onEdit={(w) => setEditing(w)}
          />
        ))}
        {workflows.length === 0 && (
          <p className="workflow__empty">
            Keine Workflows vorhanden. Erstellen Sie einen neuen Workflow.
          </p>
        )}
      </div>

      {editing && (
        <WorkflowEditor
          key={editing.id}
          workflow={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
