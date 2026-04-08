import { describe, it, expect } from 'vitest';
import { BROKER_TYPES } from '../../shared/brokerTypes.js';

const ALL_BROKER_KEYS = ['immobilien', 'krypto', 'finanz', 'versicherung', 'investment'];
const VALID_FIELD_TYPES = ['text', 'number', 'currency', 'select', 'date'];

describe('brokerTypes — pipelineStages', () => {
  it.each(ALL_BROKER_KEYS)('%s has a pipelineStages array with at least 4 stages', (key) => {
    const bt = BROKER_TYPES[key];
    expect(bt.pipelineStages).toBeDefined();
    expect(Array.isArray(bt.pipelineStages)).toBe(true);
    expect(bt.pipelineStages.length).toBeGreaterThanOrEqual(4);
  });

  it.each(ALL_BROKER_KEYS)('%s stages each have id (string), label (string), order (number)', (key) => {
    for (const stage of BROKER_TYPES[key].pipelineStages) {
      expect(typeof stage.id).toBe('string');
      expect(stage.id.length).toBeGreaterThan(0);
      expect(typeof stage.label).toBe('string');
      expect(stage.label.length).toBeGreaterThan(0);
      expect(typeof stage.order).toBe('number');
    }
  });

  it.each(ALL_BROKER_KEYS)('%s stage orders are sequential starting from 0', (key) => {
    const stages = BROKER_TYPES[key].pipelineStages;
    stages.forEach((stage, idx) => {
      expect(stage.order).toBe(idx);
    });
  });

  it.each(ALL_BROKER_KEYS)('%s has a final closed stage (abgeschlossen or closing)', (key) => {
    const stages = BROKER_TYPES[key].pipelineStages;
    const lastStage = stages[stages.length - 1];
    expect(['abgeschlossen', 'closing']).toContain(lastStage.id);
  });

  it('immobilien has correct stages', () => {
    const ids = BROKER_TYPES.immobilien.pipelineStages.map((s) => s.id);
    expect(ids).toEqual(['anfrage', 'besichtigung', 'finanzierung', 'angebot', 'notartermin', 'abgeschlossen']);
  });

  it('versicherung has correct stages', () => {
    const ids = BROKER_TYPES.versicherung.pipelineStages.map((s) => s.id);
    expect(ids).toEqual(['kontakt', 'bedarfsanalyse', 'angebot', 'antrag', 'police', 'abgeschlossen']);
  });

  it('finanz has correct stages', () => {
    const ids = BROKER_TYPES.finanz.pipelineStages.map((s) => s.id);
    expect(ids).toEqual(['kontakt', 'beratung', 'analyse', 'angebot', 'abschluss', 'abgeschlossen']);
  });

  it('krypto has correct stages', () => {
    const ids = BROKER_TYPES.krypto.pipelineStages.map((s) => s.id);
    expect(ids).toEqual(['interesse', 'kyc', 'portfolio', 'investment', 'monitoring', 'abgeschlossen']);
  });

  it('investment has correct stages', () => {
    const ids = BROKER_TYPES.investment.pipelineStages.map((s) => s.id);
    expect(ids).toEqual(['akquise', 'duediligence', 'bewertung', 'verhandlung', 'signing', 'closing']);
  });
});

describe('brokerTypes — leadFields', () => {
  it.each(ALL_BROKER_KEYS)('%s has a leadFields array with at least 3 fields', (key) => {
    const bt = BROKER_TYPES[key];
    expect(bt.leadFields).toBeDefined();
    expect(Array.isArray(bt.leadFields)).toBe(true);
    expect(bt.leadFields.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ALL_BROKER_KEYS)('%s leadFields each have key, label, type', (key) => {
    for (const field of BROKER_TYPES[key].leadFields) {
      expect(typeof field.key).toBe('string');
      expect(field.key.length).toBeGreaterThan(0);
      expect(typeof field.label).toBe('string');
      expect(field.label.length).toBeGreaterThan(0);
      expect(typeof field.type).toBe('string');
      expect(VALID_FIELD_TYPES).toContain(field.type);
    }
  });

  it.each(ALL_BROKER_KEYS)('%s select-type fields have a non-empty options array', (key) => {
    const selectFields = BROKER_TYPES[key].leadFields.filter((f) => f.type === 'select');
    for (const field of selectFields) {
      expect(Array.isArray(field.options)).toBe(true);
      expect(field.options.length).toBeGreaterThan(0);
    }
  });
});

describe('brokerTypes — existing properties preserved', () => {
  it.each(ALL_BROKER_KEYS)('%s still has label, defaultPage, navOrder, accentColor', (key) => {
    const bt = BROKER_TYPES[key];
    expect(typeof bt.label).toBe('string');
    expect(typeof bt.defaultPage).toBe('string');
    expect(Array.isArray(bt.navOrder)).toBe(true);
    expect(typeof bt.accentColor).toBe('string');
  });
});
