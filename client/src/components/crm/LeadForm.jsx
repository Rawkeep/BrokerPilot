import { useState, useEffect } from 'react';
import { GlassModal } from '../ui/GlassModal.jsx';
import { GlassInput } from '../ui/GlassInput.jsx';
import { GlassSelect } from '../ui/GlassSelect.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { useLeadStore } from '../../stores/leadStore.js';
import { BROKER_TYPES } from '../../../../shared/brokerTypes.js';
import { de } from '../../i18n/de.js';

const PRIORITY_OPTIONS = [
  { value: 'low', label: de.crm.priorities.low },
  { value: 'medium', label: de.crm.priorities.medium },
  { value: 'high', label: de.crm.priorities.high },
];

function getInitialFormData(lead, brokerType, defaultStage) {
  if (lead) {
    return {
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      dealValue: lead.dealValue ?? '',
      priority: lead.priority || 'medium',
      notes: lead.notes || '',
      tags: (lead.tags || []).join(', '),
      customFields: { ...(lead.customFields || {}) },
    };
  }
  return {
    name: '',
    email: '',
    phone: '',
    company: '',
    dealValue: '',
    priority: 'medium',
    notes: '',
    tags: '',
    customFields: {},
  };
}

export function LeadForm({ open, onClose, lead, brokerType, defaultStage }) {
  const addLead = useLeadStore((s) => s.addLead);
  const updateLead = useLeadStore((s) => s.updateLead);

  const [formData, setFormData] = useState(() =>
    getInitialFormData(lead, brokerType, defaultStage)
  );
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(lead);
  const config = BROKER_TYPES[brokerType];
  const dynamicFields = config?.leadFields || [];

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(lead, brokerType, defaultStage));
      setErrors({});
    }
  }, [open, lead, brokerType, defaultStage]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleCustomFieldChange(key, value) {
    setFormData((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value },
    }));
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Name ist erforderlich';
    } else if (formData.name.length > 200) {
      errs.name = 'Name darf maximal 200 Zeichen lang sein';
    }
    if (formData.notes && formData.notes.length > 5000) {
      errs.notes = 'Notizen dürfen maximal 5000 Zeichen lang sein';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      dealValue: formData.dealValue ? Number(formData.dealValue) : null,
      priority: formData.priority,
      notes: formData.notes,
      tags,
      customFields: formData.customFields,
    };

    if (isEditing) {
      await updateLead(lead.id, data);
    } else {
      const createData = { ...data };
      if (defaultStage) {
        createData.stage = defaultStage;
      }
      await addLead(brokerType, createData);
    }

    onClose();
  }

  function renderDynamicField(field) {
    const value = formData.customFields[field.key] ?? '';

    if (field.type === 'select' && field.options) {
      return (
        <GlassSelect
          key={field.key}
          label={field.label}
          name={field.key}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
          options={[
            { value: '', label: '-- Auswählen --' },
            ...field.options.map((opt) => ({ value: opt, label: opt })),
          ]}
        />
      );
    }

    let inputType = 'text';
    if (field.type === 'number' || field.type === 'currency') inputType = 'number';
    if (field.type === 'date') inputType = 'date';

    return (
      <GlassInput
        key={field.key}
        label={field.type === 'currency' ? `${field.label} (EUR)` : field.label}
        name={field.key}
        type={inputType}
        value={value}
        onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
      />
    );
  }

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEditing ? de.crm.editLead : de.crm.newLead}
    >
      <form className="lead-form" onSubmit={handleSubmit}>
        <GlassInput
          label={de.crm.name}
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <div className="lead-form__row">
          <GlassInput
            label={de.crm.email}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <GlassInput
            label={de.crm.phone}
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="lead-form__row">
          <GlassInput
            label={de.crm.company}
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
          <GlassInput
            label={de.crm.dealValue}
            name="dealValue"
            type="number"
            value={formData.dealValue}
            onChange={handleChange}
          />
        </div>

        <GlassSelect
          label={de.crm.priority}
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={PRIORITY_OPTIONS}
        />

        {dynamicFields.length > 0 && (
          <>
            <div className="lead-form__section-title">
              {config.label}
            </div>
            {dynamicFields.map(renderDynamicField)}
          </>
        )}

        <GlassInput
          label={de.crm.tagsLabel}
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Tag1, Tag2, Tag3"
        />

        <div className="glass-input-wrapper">
          <label htmlFor="notes" className="glass-input-label">
            {de.crm.notes}
          </label>
          <textarea
            id="notes"
            name="notes"
            className="glass-input"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
          />
          {errors.notes && <span className="glass-input-error">{errors.notes}</span>}
        </div>

        <div className="lead-form__actions">
          <GlassButton type="button" onClick={onClose}>
            {de.common.cancel}
          </GlassButton>
          <GlassButton type="submit" variant="primary">
            {de.common.save}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
