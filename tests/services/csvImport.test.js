import { describe, it, expect } from 'vitest';
import { parseCSV, mapCSVToLeads, validateImport } from '../../client/src/services/csvImport.js';

const SAMPLE_CSV_SEMICOLON = `Name;E-Mail;Deal-Wert;Phase;Tags
Max Mueller;max@test.de;250000,5;anfrage;VIP, Neubau
Anna Schmidt;anna@test.de;100000;besichtigung;`;

const SAMPLE_CSV_COMMA = `Name,E-Mail,Deal-Wert,Phase
Max Mueller,max@test.de,250000.5,anfrage`;

const SAMPLE_WITH_BOM = '\uFEFF' + SAMPLE_CSV_SEMICOLON;

describe('CSV Import', () => {
  it('parses semicolon-delimited CSV', () => {
    const result = parseCSV(SAMPLE_CSV_SEMICOLON);
    expect(result.headers).toContain('Name');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]['Name']).toBe('Max Mueller');
  });

  it('parses comma-delimited CSV', () => {
    const result = parseCSV(SAMPLE_CSV_COMMA);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]['Name']).toBe('Max Mueller');
  });

  it('strips BOM from content', () => {
    const result = parseCSV(SAMPLE_WITH_BOM);
    expect(result.headers[0]).toBe('Name');
    expect(result.rows).toHaveLength(2);
  });

  it('maps CSV rows to lead objects', () => {
    const { rows } = parseCSV(SAMPLE_CSV_SEMICOLON);
    const leads = mapCSVToLeads(rows, 'immobilien');
    expect(leads).toHaveLength(2);
    expect(leads[0].name).toBe('Max Mueller');
    expect(leads[0].email).toBe('max@test.de');
    expect(leads[0].brokerType).toBe('immobilien');
    expect(leads[0].id).toBeTruthy();
  });

  it('parses German currency format', () => {
    const { rows } = parseCSV(SAMPLE_CSV_SEMICOLON);
    const leads = mapCSVToLeads(rows, 'immobilien');
    expect(leads[0].dealValue).toBe(250000.5);
  });

  it('parses tags from comma-separated string', () => {
    const { rows } = parseCSV(SAMPLE_CSV_SEMICOLON);
    const leads = mapCSVToLeads(rows, 'immobilien');
    expect(leads[0].tags).toEqual(['VIP', 'Neubau']);
  });

  it('validates imported leads', () => {
    const { rows } = parseCSV(SAMPLE_CSV_SEMICOLON);
    const leads = mapCSVToLeads(rows, 'immobilien');
    const result = validateImport(leads);
    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it('reports validation errors for invalid leads', () => {
    const leads = [{ name: '', brokerType: 'immobilien', stage: 'anfrage' }];
    const result = validateImport(leads);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Zeile 2');
  });
});
