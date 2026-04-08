import Papa from 'papaparse';
import { BROKER_TYPES } from '../../../shared/brokerTypes.js';
import { validateLead, createLead } from '../../../shared/leadSchema.js';

export function parseCSV(content) {
  const cleaned = content.replace(/^\uFEFF/, '');
  const result = Papa.parse(cleaned, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return {
    headers: result.meta.fields || [],
    rows: result.data || [],
    errors: result.errors || [],
  };
}

const LABEL_TO_KEY = {
  'Name': 'name',
  'E-Mail': 'email',
  'Telefon': 'phone',
  'Unternehmen': 'company',
  'Deal-Wert': 'dealValue',
  'Prioritaet': 'priority',
  'Phase': 'stage',
  'Tags': 'tags',
  'Notizen': 'notes',
  'Erstellt': 'createdAt',
  'Aktualisiert': 'updatedAt',
};

function parseGermanDate(str) {
  if (!str) return null;
  const match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return str;
  return `${match[3]}-${match[2]}-${match[1]}T00:00:00.000Z`;
}

function parseGermanNumber(str) {
  if (!str || str === '') return null;
  return parseFloat(String(str).replace(',', '.'));
}

export function mapCSVToLeads(rows, brokerType) {
  const config = BROKER_TYPES[brokerType];
  const customFieldLabels = {};
  (config?.leadFields || []).forEach((f) => {
    customFieldLabels[f.label] = f.key;
  });

  return rows.map((row) => {
    const lead = createLead(brokerType);
    const customFields = {};

    Object.entries(row).forEach(([label, value]) => {
      const coreKey = LABEL_TO_KEY[label];
      if (coreKey) {
        if (coreKey === 'dealValue') {
          lead[coreKey] = parseGermanNumber(value);
        } else if (coreKey === 'tags') {
          lead[coreKey] = value ? value.split(',').map((t) => t.trim()).filter(Boolean) : [];
        } else if (coreKey === 'createdAt' || coreKey === 'updatedAt') {
          lead[coreKey] = parseGermanDate(value) || lead[coreKey];
        } else {
          lead[coreKey] = value || '';
        }
      } else if (customFieldLabels[label]) {
        const fieldConfig = config.leadFields.find((f) => f.label === label);
        if (fieldConfig?.type === 'currency' || fieldConfig?.type === 'number') {
          customFields[customFieldLabels[label]] = parseGermanNumber(value);
        } else {
          customFields[customFieldLabels[label]] = value || '';
        }
      }
    });

    lead.customFields = customFields;
    return lead;
  });
}

export function validateImport(leads) {
  const valid = [];
  const errors = [];
  leads.forEach((lead, index) => {
    const result = validateLead(lead);
    if (result.valid) {
      valid.push(lead);
    } else {
      errors.push(`Zeile ${index + 2}: ${result.errors.join(', ')}`);
    }
  });
  return { valid, errors };
}
