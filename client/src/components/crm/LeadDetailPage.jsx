import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { GlassTag } from '../ui/GlassTag.jsx';
import { ActivityTimeline } from './ActivityTimeline.jsx';
import { TagManager } from './TagManager.jsx';
import { LeadForm } from './LeadForm.jsx';
import { AgentTriggerPanel } from '../agents/AgentTriggerPanel.jsx';
import { PipelineTrigger } from '../pipeline/PipelineTrigger.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { de } from '../../i18n/de.js';

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const leads = useLeadStore((s) => s.leads);
  const deleteLead = useLeadStore((s) => s.deleteLead);
  const addNote = useLeadStore((s) => s.addNote);
  const updateLead = useLeadStore((s) => s.updateLead);
  const brokerType = useSettingsStore((s) => s.brokerType);

  const [noteText, setNoteText] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const lead = leads.find((l) => l.id === leadId);

  if (!lead) {
    return (
      <div className="lead-detail">
        <GlassCard hoverable={false}>
          <p>{de.crm.detail.notFound}</p>
          <Link to="/pipeline">
            <GlassButton>{de.crm.detail.backToPipeline}</GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const config = BROKER_TYPES[lead.brokerType] || BROKER_TYPES[brokerType];
  const stages = config?.pipelineStages || [];
  const dynamicFields = config?.leadFields || [];
  const currentStage = stages.find((s) => s.id === lead.stage);

  const allTags = [...new Set(leads.flatMap((l) => l.tags || []))];

  async function handleAddNote() {
    const text = noteText.trim();
    if (!text) return;
    await addNote(leadId, text);
    setNoteText('');
  }

  async function handleDelete() {
    if (window.confirm(de.crm.deleteConfirm)) {
      await deleteLead(leadId);
      navigate('/pipeline');
    }
  }

  function handleTagsChange(newTags) {
    updateLead(leadId, { tags: newTags });
  }

  function handleNoteKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  }

  return (
    <div className="lead-detail">
      <div className="lead-detail__nav">
        <Link to="/pipeline">
          <GlassButton>{de.crm.detail.backToPipeline}</GlassButton>
        </Link>
      </div>

      <div className="lead-detail__grid">
        {/* Left column: Lead info */}
        <GlassCard hoverable={false} className="lead-detail__info">
          <h1 className="lead-detail__name">{lead.name}</h1>

          {/* Contact info */}
          <div className="lead-detail__section">
            <h3 className="lead-detail__section-title">{de.crm.detail.contactInfo}</h3>
            {lead.company && (
              <div className="lead-detail__field">
                <span className="lead-detail__label">{de.crm.company}</span>
                <span className="lead-detail__value">{lead.company}</span>
              </div>
            )}
            {lead.email && (
              <div className="lead-detail__field">
                <span className="lead-detail__label">{de.crm.email}</span>
                <span className="lead-detail__value">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="lead-detail__field">
                <span className="lead-detail__label">{de.crm.phone}</span>
                <span className="lead-detail__value">{lead.phone}</span>
              </div>
            )}
          </div>

          {/* Stage and priority */}
          <div className="lead-detail__badges">
            {currentStage && (
              <GlassBadge>{currentStage.label}</GlassBadge>
            )}
            <GlassBadge variant={lead.priority}>
              {de.crm.priorities[lead.priority] || lead.priority}
            </GlassBadge>
          </div>

          {/* Deal value */}
          {lead.dealValue != null && lead.dealValue > 0 && (
            <div className="lead-detail__field">
              <span className="lead-detail__label">{de.crm.dealValue}</span>
              <span className="lead-detail__value lead-detail__value--accent">
                {currencyFmt.format(lead.dealValue)}
              </span>
            </div>
          )}

          {/* Custom fields */}
          {dynamicFields.length > 0 && (
            <div className="lead-detail__section">
              <h3 className="lead-detail__section-title">{de.crm.detail.customFields}</h3>
              {dynamicFields.map((field) => {
                const val = lead.customFields?.[field.key];
                if (!val) return null;
                const display = field.type === 'currency' ? currencyFmt.format(Number(val)) : val;
                return (
                  <div key={field.key} className="lead-detail__field">
                    <span className="lead-detail__label">{field.label}</span>
                    <span className="lead-detail__value">{display}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="lead-detail__section">
            <h3 className="lead-detail__section-title">{de.crm.tags}</h3>
            {lead.tags?.length > 0 && (
              <div className="lead-detail__tags">
                {lead.tags.map((tag) => (
                  <GlassTag key={tag} label={tag} />
                ))}
              </div>
            )}
            <TagManager
              tags={lead.tags || []}
              onChange={handleTagsChange}
              allTags={allTags}
            />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="lead-detail__section">
              <h3 className="lead-detail__section-title">{de.crm.notes}</h3>
              <p className="lead-detail__notes">{lead.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="lead-detail__actions">
            <GlassButton variant="primary" onClick={() => setShowEditForm(true)}>
              {de.common.edit}
            </GlassButton>
            <GlassButton className="lead-detail__delete-btn" onClick={handleDelete}>
              {de.crm.deleteLead}
            </GlassButton>
          </div>
        </GlassCard>

        {/* AI Agents section */}
        <GlassCard hoverable={false} className="lead-detail__agents">
          <AgentTriggerPanel lead={lead} />
        </GlassCard>

        {/* Pipeline section */}
        <GlassCard hoverable={false} className="lead-detail__pipeline">
          <PipelineTrigger lead={lead} />
        </GlassCard>

        {/* Right column: Activity timeline */}
        <GlassCard hoverable={false} className="lead-detail__timeline">
          <h2 className="lead-detail__section-title">{de.crm.detail.activities}</h2>

          {/* Note input */}
          <div className="lead-detail__note-input">
            <GlassInput
              placeholder={de.crm.detail.notePlaceholder}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleNoteKeyDown}
            />
            <GlassButton variant="primary" onClick={handleAddNote} disabled={!noteText.trim()}>
              {de.crm.detail.addNote}
            </GlassButton>
          </div>

          <ActivityTimeline activities={lead.activities} stages={stages} />
        </GlassCard>
      </div>

      <LeadForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        lead={lead}
        brokerType={lead.brokerType}
      />
    </div>
  );
}
