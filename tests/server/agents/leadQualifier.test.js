import { describe, it, expect } from 'vitest';
import { LeadQualifierOutputSchema } from '../../../shared/agentSchemas.js';
import { buildPrompt, parseResponse } from '../../../server/agents/leadQualifier.js';
import { FINANCIAL_GLOSSARY } from '../../../server/agents/systemPrompts.js';

// --- Schema Validation Tests ---

describe('LeadQualifierOutputSchema', () => {
  const validOutput = {
    score: 75,
    kategorie: 'warm',
    zusammenfassung: 'Guter Lead mit solidem Budget und aktivem Engagement.',
    begruendung: [
      { faktor: 'Budget', bewertung: 'positiv', details: 'Budget liegt im oberen Bereich' },
      { faktor: 'Kontaktqualitaet', bewertung: 'neutral', details: 'E-Mail vorhanden, Telefon fehlt' },
    ],
    empfohleneAktionen: ['Telefonischen Kontakt aufnehmen', 'Besichtigungstermin vorschlagen'],
    naechsterSchritt: 'Persoenliches Beratungsgespraech vereinbaren',
  };

  it('parses valid output successfully', () => {
    const result = LeadQualifierOutputSchema.parse(validOutput);
    expect(result.score).toBe(75);
    expect(result.kategorie).toBe('warm');
    expect(result.begruendung).toHaveLength(2);
    expect(result.empfohleneAktionen).toHaveLength(2);
  });

  it('rejects score above 100', () => {
    expect(() =>
      LeadQualifierOutputSchema.parse({ ...validOutput, score: 150 })
    ).toThrow();
  });

  it('rejects score below 0', () => {
    expect(() =>
      LeadQualifierOutputSchema.parse({ ...validOutput, score: -5 })
    ).toThrow();
  });

  it('rejects invalid kategorie', () => {
    expect(() =>
      LeadQualifierOutputSchema.parse({ ...validOutput, kategorie: 'invalid' })
    ).toThrow();
  });

  it('rejects empty zusammenfassung', () => {
    expect(() =>
      LeadQualifierOutputSchema.parse({ ...validOutput, zusammenfassung: '' })
    ).toThrow();
  });

  it('rejects begruendung with invalid bewertung', () => {
    expect(() =>
      LeadQualifierOutputSchema.parse({
        ...validOutput,
        begruendung: [{ faktor: 'Test', bewertung: 'unknown', details: 'x' }],
      })
    ).toThrow();
  });

  it('accepts all valid kategorie values', () => {
    for (const kat of ['heiss', 'warm', 'kalt', 'unqualifiziert']) {
      const result = LeadQualifierOutputSchema.parse({ ...validOutput, kategorie: kat });
      expect(result.kategorie).toBe(kat);
    }
  });

  it('accepts score of exactly 0', () => {
    const result = LeadQualifierOutputSchema.parse({ ...validOutput, score: 0 });
    expect(result.score).toBe(0);
  });

  it('accepts score of exactly 100', () => {
    const result = LeadQualifierOutputSchema.parse({ ...validOutput, score: 100 });
    expect(result.score).toBe(100);
  });
});

// --- Prompt Building Tests ---

describe('leadQualifier.buildPrompt', () => {
  const mockLead = {
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '+49 170 1234567',
    company: 'Muster GmbH',
    dealValue: 500000,
    budget: 450000,
    stage: 'besichtigung',
    priority: 'high',
    tags: ['premium'],
    notes: 'Interessiert an Neubau.',
    customFields: { objectType: 'Wohnung' },
    activities: [
      { type: 'call', description: 'Erstgespraech', timestamp: '2026-01-15T10:00:00Z' },
    ],
    createdAt: '2026-01-10T09:00:00Z',
  };

  it('returns a messages array with system and user roles', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('includes German system prompt with broker type', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    expect(messages[0].content).toContain('Immobilien');
    expect(messages[0].content).toContain('Lead-Qualifizierungs-Spezialist');
  });

  it('includes financial glossary terms in system prompt', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    const systemContent = messages[0].content;
    // Check for key glossary terms
    expect(systemContent).toContain('KGV');
    expect(systemContent).toContain('EBIT');
    expect(systemContent).toContain('Rendite');
    expect(systemContent).toContain('Volatilitaet');
  });

  it('includes all glossary terms', () => {
    const messages = buildPrompt(mockLead, 'finanz');
    const systemContent = messages[0].content;
    for (const term of Object.keys(FINANCIAL_GLOSSARY)) {
      expect(systemContent).toContain(term);
    }
  });

  it('includes lead data in user message as JSON', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    const userContent = messages[1].content;
    expect(userContent).toContain('Max Mustermann');
    expect(userContent).toContain('max@example.com');
    expect(userContent).toContain('500000');
  });

  it('includes JSON output format instructions', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    const systemContent = messages[0].content;
    expect(systemContent).toContain('"score"');
    expect(systemContent).toContain('"kategorie"');
    expect(systemContent).toContain('"zusammenfassung"');
  });

  it('includes pipeline stages for the broker type', () => {
    const messages = buildPrompt(mockLead, 'immobilien');
    expect(messages[0].content).toContain('Besichtigung');
    expect(messages[0].content).toContain('Finanzierung');
  });

  it('works with different broker types', () => {
    const messages = buildPrompt(mockLead, 'krypto');
    expect(messages[0].content).toContain('Krypto');
  });
});

// --- Response Parsing Tests ---

describe('leadQualifier.parseResponse', () => {
  const validJSON = JSON.stringify({
    score: 85,
    kategorie: 'heiss',
    zusammenfassung: 'Sehr guter Lead.',
    begruendung: [
      { faktor: 'Budget', bewertung: 'positiv', details: 'Hohes Budget' },
    ],
    empfohleneAktionen: ['Sofort kontaktieren'],
    naechsterSchritt: 'Termin vereinbaren',
  });

  it('parses valid JSON response', () => {
    const result = parseResponse(validJSON);
    expect(result.score).toBe(85);
    expect(result.kategorie).toBe('heiss');
  });

  it('handles JSON wrapped in markdown code fences', () => {
    const wrapped = '```json\n' + validJSON + '\n```';
    const result = parseResponse(wrapped);
    expect(result.score).toBe(85);
  });

  it('handles JSON with leading text', () => {
    const withText = 'Here is the analysis:\n' + validJSON;
    const result = parseResponse(withText);
    expect(result.score).toBe(85);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseResponse('not json at all')).toThrow('Failed to parse');
  });

  it('throws on valid JSON that fails schema validation', () => {
    const invalid = JSON.stringify({ score: 200, kategorie: 'invalid' });
    expect(() => parseResponse(invalid)).toThrow('validation failed');
  });
});
