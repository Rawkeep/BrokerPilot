import { describe, it, expect } from 'vitest';
import { SwotStrategistOutputSchema } from '../../../shared/agentSchemas.js';
import { buildPrompt, parseResponse } from '../../../server/agents/swotStrategist.js';
import { FINANCIAL_GLOSSARY } from '../../../server/agents/systemPrompts.js';

// --- Schema Validation Tests ---

describe('SwotStrategistOutputSchema', () => {
  const validOutput = {
    titel: 'SWOT-Analyse: Muster GmbH Immobiliendeal',
    zusammenfassung: 'Der Deal zeigt solide Grundlagen mit einigen Risiken.',
    staerken: [
      { punkt: 'Starkes Budget', details: 'Das Budget uebersteigt den Marktwert um 10%' },
    ],
    schwaechen: [
      { punkt: 'Fehlende Finanzierung', details: 'Kein Finanzierungsnachweis vorhanden' },
    ],
    chancen: [
      { punkt: 'Marktwachstum', details: 'Region zeigt 5% jaehrliches Preiswachstum' },
    ],
    risiken: [
      { punkt: 'Zinsanstieg', details: 'Steigende Zinsen koennten Budget belasten' },
    ],
    handlungsempfehlung: 'Finanzierung klaeren und Angebot innerhalb von 2 Wochen unterbreiten.',
  };

  it('parses valid output successfully', () => {
    const result = SwotStrategistOutputSchema.parse(validOutput);
    expect(result.titel).toContain('SWOT');
    expect(result.staerken).toHaveLength(1);
    expect(result.schwaechen).toHaveLength(1);
    expect(result.chancen).toHaveLength(1);
    expect(result.risiken).toHaveLength(1);
  });

  it('accepts multiple items in each quadrant', () => {
    const extended = {
      ...validOutput,
      staerken: [
        { punkt: 'Punkt 1', details: 'Details 1' },
        { punkt: 'Punkt 2', details: 'Details 2' },
        { punkt: 'Punkt 3', details: 'Details 3' },
      ],
    };
    const result = SwotStrategistOutputSchema.parse(extended);
    expect(result.staerken).toHaveLength(3);
  });

  it('rejects empty titel', () => {
    expect(() =>
      SwotStrategistOutputSchema.parse({ ...validOutput, titel: '' })
    ).toThrow();
  });

  it('rejects missing handlungsempfehlung', () => {
    const { handlungsempfehlung, ...without } = validOutput;
    expect(() => SwotStrategistOutputSchema.parse(without)).toThrow();
  });

  it('rejects items with empty punkt', () => {
    expect(() =>
      SwotStrategistOutputSchema.parse({
        ...validOutput,
        staerken: [{ punkt: '', details: 'details' }],
      })
    ).toThrow();
  });

  it('rejects items with empty details', () => {
    expect(() =>
      SwotStrategistOutputSchema.parse({
        ...validOutput,
        schwaechen: [{ punkt: 'punkt', details: '' }],
      })
    ).toThrow();
  });

  it('accepts empty arrays for quadrants', () => {
    const result = SwotStrategistOutputSchema.parse({
      ...validOutput,
      staerken: [],
      schwaechen: [],
    });
    expect(result.staerken).toHaveLength(0);
    expect(result.schwaechen).toHaveLength(0);
  });
});

// --- Prompt Building Tests ---

describe('swotStrategist.buildPrompt', () => {
  const mockDeal = {
    name: 'Muster GmbH',
    company: 'Muster GmbH',
    dealValue: 750000,
    budget: 700000,
    stage: 'angebot',
    tags: ['premium', 'neubau'],
    notes: 'Interessiert an Bueroflaeche in Muenchen.',
    customFields: { objectType: 'Gewerbe', sqm: 200 },
  };

  it('returns messages array with system and user roles', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('includes German system prompt with SWOT focus', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    expect(messages[0].content).toContain('SWOT');
    expect(messages[0].content).toContain('Strategieberater');
    expect(messages[0].content).toContain('Immobilien');
  });

  it('includes financial glossary in system prompt', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    for (const term of Object.keys(FINANCIAL_GLOSSARY)) {
      expect(messages[0].content).toContain(term);
    }
  });

  it('includes deal data in user message', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    expect(messages[1].content).toContain('Muster GmbH');
    expect(messages[1].content).toContain('750000');
  });

  it('includes additional context when provided', () => {
    const context = { marketTrend: 'bullish', region: 'Muenchen' };
    const messages = buildPrompt(mockDeal, 'immobilien', context);
    expect(messages[1].content).toContain('Muenchen');
    expect(messages[1].content).toContain('bullish');
  });

  it('works without additional context', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    expect(messages[1].content).not.toContain('Zusaetzlicher Kontext');
  });

  it('works with different broker types', () => {
    const messages = buildPrompt(mockDeal, 'investment');
    expect(messages[0].content).toContain('Investment-Banking');
  });

  it('includes JSON output format in system prompt', () => {
    const messages = buildPrompt(mockDeal, 'immobilien');
    expect(messages[0].content).toContain('"staerken"');
    expect(messages[0].content).toContain('"schwaechen"');
    expect(messages[0].content).toContain('"chancen"');
    expect(messages[0].content).toContain('"risiken"');
  });
});

// --- Response Parsing Tests ---

describe('swotStrategist.parseResponse', () => {
  const validJSON = JSON.stringify({
    titel: 'SWOT-Analyse',
    zusammenfassung: 'Zusammenfassung der Analyse.',
    staerken: [{ punkt: 'Staerke 1', details: 'Details' }],
    schwaechen: [{ punkt: 'Schwaeche 1', details: 'Details' }],
    chancen: [{ punkt: 'Chance 1', details: 'Details' }],
    risiken: [{ punkt: 'Risiko 1', details: 'Details' }],
    handlungsempfehlung: 'Empfehlung hier.',
  });

  it('parses valid JSON response', () => {
    const result = parseResponse(validJSON);
    expect(result.titel).toBe('SWOT-Analyse');
    expect(result.staerken).toHaveLength(1);
  });

  it('handles markdown code fences', () => {
    const wrapped = '```json\n' + validJSON + '\n```';
    const result = parseResponse(wrapped);
    expect(result.titel).toBe('SWOT-Analyse');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseResponse('not json')).toThrow();
  });

  it('throws on schema validation failure', () => {
    const invalid = JSON.stringify({ titel: '' });
    expect(() => parseResponse(invalid)).toThrow();
  });
});
