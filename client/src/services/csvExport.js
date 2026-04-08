import { BROKER_TYPES } from '../../../shared/brokerTypes.js';

const BOM = '\uFEFF';
const SEP = ';';

const CORE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'E-Mail' },
  { key: 'phone', label: 'Telefon' },
  { key: 'company', label: 'Unternehmen' },
  { key: 'dealValue', label: 'Deal-Wert' },
  { key: 'priority', label: 'Prioritaet' },
  { key: 'stage', label: 'Phase' },
  { key: 'tags', label: 'Tags' },
  { key: 'notes', label: 'Notizen' },
  { key: 'createdAt', label: 'Erstellt' },
  { key: 'updatedAt', label: 'Aktualisiert' },
];

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatCurrency(value) {
  if (value == null || value === '') return '';
  return String(value).replace('.', ',');
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(SEP) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(lead, col) {
  const val = lead[col.key];
  if (col.key === 'tags') return (val || []).join(', ');
  if (col.key === 'createdAt' || col.key === 'updatedAt') return formatDate(val);
  if (col.key === 'dealValue') return formatCurrency(val);
  return val ?? '';
}

export function generateCSV(leads, brokerType) {
  const config = BROKER_TYPES[brokerType];
  const dynamicCols = (config?.leadFields || []).map((f) => ({
    key: `custom_${f.key}`,
    label: f.label,
    customKey: f.key,
    type: f.type,
  }));

  const allCols = [...CORE_COLUMNS, ...dynamicCols];
  const header = allCols.map((c) => escapeCSV(c.label)).join(SEP);

  const rows = leads.map((lead) => {
    return allCols.map((col) => {
      if (col.customKey) {
        const val = lead.customFields?.[col.customKey] ?? '';
        if (col.type === 'currency') return escapeCSV(formatCurrency(val));
        return escapeCSV(val);
      }
      return escapeCSV(formatValue(lead, col));
    }).join(SEP);
  });

  return BOM + [header, ...rows].join('\n');
}

export function downloadCSV(leads, brokerType, filename) {
  const csv = generateCSV(leads, brokerType);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `brokerpilot-leads-${brokerType}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
