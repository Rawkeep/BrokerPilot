import { useState } from 'react';
import { useLeadStore } from '../../stores/leadStore.js';
import { useTeamStore } from '../../stores/teamStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';

const PRIORITIES = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];

export function BulkActions({ selectedLeads, onClearSelection }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateLead = useLeadStore((s) => s.updateLead);
  const deleteLead = useLeadStore((s) => s.deleteLead);
  const brokerType = useSettingsStore((s) => s.brokerType);
  const members = useTeamStore((s) => s.members);
  const assignLead = useTeamStore((s) => s.assignLead);

  const stages = BROKER_TYPES[brokerType]?.pipelineStages || [];

  if (!selectedLeads || selectedLeads.length === 0) return null;

  function toggleDropdown(name) {
    setActiveDropdown((prev) => (prev === name ? null : name));
  }

  async function handleStageChange(stageId) {
    for (const leadId of selectedLeads) {
      await updateLead(leadId, { stage: stageId });
    }
    setActiveDropdown(null);
    onClearSelection();
  }

  async function handleAddTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const leads = useLeadStore.getState().leads;
    for (const leadId of selectedLeads) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        const existingTags = lead.tags || [];
        if (!existingTags.includes(tag)) {
          await updateLead(leadId, { tags: [...existingTags, tag] });
        }
      }
    }
    setTagInput('');
    setActiveDropdown(null);
  }

  async function handleAssign(memberId) {
    for (const leadId of selectedLeads) {
      assignLead(memberId, leadId);
      await updateLead(leadId, { assignedTo: memberId });
    }
    setActiveDropdown(null);
  }

  async function handlePriority(priority) {
    for (const leadId of selectedLeads) {
      await updateLead(leadId, { priority });
    }
    setActiveDropdown(null);
  }

  async function handleDelete() {
    for (const leadId of selectedLeads) {
      await deleteLead(leadId);
    }
    setShowDeleteConfirm(false);
    onClearSelection();
  }

  return (
    <div className="bulk-actions">
      <div className="bulk-actions__bar">
        <span className="bulk-actions__count">
          {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''} ausgew\u00E4hlt
        </span>

        <div className="bulk-actions__actions">
          {/* Stage change */}
          <div className="bulk-actions__dropdown-wrap">
            <button
              className="bulk-actions__btn"
              onClick={() => toggleDropdown('stage')}
            >
              Phase \u25BE
            </button>
            {activeDropdown === 'stage' && (
              <div className="bulk-actions__dropdown bulk-actions__dropdown--above">
                {stages.map((s) => (
                  <button
                    key={s.id}
                    className="bulk-actions__dropdown-item"
                    onClick={() => handleStageChange(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag input */}
          <div className="bulk-actions__dropdown-wrap">
            <button
              className="bulk-actions__btn"
              onClick={() => toggleDropdown('tag')}
            >
              Tag +
            </button>
            {activeDropdown === 'tag' && (
              <div className="bulk-actions__dropdown bulk-actions__dropdown--above">
                <div className="bulk-actions__tag-input">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Tag eingeben..."
                    autoFocus
                  />
                  <button className="bulk-actions__tag-add" onClick={handleAddTag}>
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Member assign */}
          <div className="bulk-actions__dropdown-wrap">
            <button
              className="bulk-actions__btn"
              onClick={() => toggleDropdown('assign')}
            >
              Zuweisen \u25BE
            </button>
            {activeDropdown === 'assign' && (
              <div className="bulk-actions__dropdown bulk-actions__dropdown--above">
                {members.map((m) => (
                  <button
                    key={m.id}
                    className="bulk-actions__dropdown-item"
                    onClick={() => handleAssign(m.id)}
                  >
                    <span
                      className="bulk-actions__member-dot"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="bulk-actions__dropdown-wrap">
            <button
              className="bulk-actions__btn"
              onClick={() => toggleDropdown('priority')}
            >
              Priorit\u00E4t \u25BE
            </button>
            {activeDropdown === 'priority' && (
              <div className="bulk-actions__dropdown bulk-actions__dropdown--above">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    className="bulk-actions__dropdown-item"
                    onClick={() => handlePriority(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email */}
          <button className="bulk-actions__btn" title="E-Mail senden">
            \uD83D\uDCE7
          </button>

          {/* Delete */}
          <button
            className="bulk-actions__btn bulk-actions__btn--danger"
            onClick={() => setShowDeleteConfirm(true)}
            title="L\u00F6schen"
          >
            \uD83D\uDDD1\uFE0F
          </button>
        </div>

        <button className="bulk-actions__close" onClick={onClearSelection} aria-label="Auswahl aufheben">
          &times;
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="bulk-actions__confirm-overlay">
          <div className="bulk-actions__confirm">
            <p>
              {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''} wirklich l\u00F6schen?
            </p>
            <div className="bulk-actions__confirm-actions">
              <button
                className="bulk-actions__btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Abbrechen
              </button>
              <button
                className="bulk-actions__btn bulk-actions__btn--danger"
                onClick={handleDelete}
              >
                Endg\u00FCltig l\u00F6schen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
