import { describe, it, expect } from 'vitest';
import { generateCSV } from '../../client/src/services/csvExport.js';

const mockLead = {
  name: 'Max Mueller',
  email: 'max@test.de',
  phone: '+49 123',
  company: 'Firma GmbH',
  dealValue: 250000.5,
  priority: 'high',
  stage: 'anfrage',
  tags: ['VIP', 'Neubau'],
  notes: 'Testnotiz',
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-05T12:00:00.000Z',
  customFields: { objectType: 'Wohnung', budget: 300000 },
};

describe('CSV Export', () => {
  it('starts with UTF-8 BOM', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('uses semicolon as delimiter', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    const headerLine = csv.split('\n')[0].replace('\uFEFF', '');
    expect(headerLine).toContain(';');
    expect(headerLine.split(';').length).toBeGreaterThan(5);
  });

  it('includes German column headers', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv).toContain('Name');
    expect(csv).toContain('E-Mail');
    expect(csv).toContain('Telefon');
    expect(csv).toContain('Deal-Wert');
    expect(csv).toContain('Erstellt');
  });

  it('formats dates as DD.MM.YYYY', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv).toContain('01.04.2026');
    expect(csv).toContain('05.04.2026');
  });

  it('formats currency with comma decimal', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv).toContain('250000,5');
  });

  it('joins tags with comma', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv).toContain('VIP, Neubau');
  });

  it('includes broker-type-specific columns for immobilien', () => {
    const csv = generateCSV([mockLead], 'immobilien');
    expect(csv).toContain('Objekttyp');
    expect(csv).toContain('Wohnung');
    expect(csv).toContain('Budget');
  });

  it('handles empty leads array', () => {
    const csv = generateCSV([], 'immobilien');
    expect(csv).toContain('Name');
    expect(csv.split('\n')).toHaveLength(1);
  });
});
