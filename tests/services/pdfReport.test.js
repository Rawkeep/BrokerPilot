import { describe, it, expect } from 'vitest';
import { generateLeadQualifierPDF, generateMarketAnalystPDF, generateSWOTPDF, generatePipelinePDF } from '../../client/src/services/pdfReport.js';

const mockLead = { name: 'Max Mueller', brokerType: 'immobilien' };

const qualifierResult = {
  score: 85,
  kategorie: 'Hoch',
  zusammenfassung: 'Starker Lead mit hohem Potenzial',
  begruendung: 'Budget passt, Zeitrahmen realistisch',
  empfohleneAktionen: ['Besichtigung vereinbaren', 'Finanzierung pruefen'],
  risikoFaktoren: ['Marktlage unsicher'],
};

const analystResult = {
  asset: 'AAPL',
  empfehlung: 'kaufen',
  konfidenz: 82,
  zusammenfassung: 'Apple zeigt starkes Wachstum',
  analyse: 'Umsatz steigt, Marge stabil',
  datenquellen: ['Yahoo Finance', 'Unternehmensberichte'],
};

const swotResult = {
  staerken: ['Gute Lage', 'Modernes Objekt'],
  schwaechen: ['Hoher Preis'],
  chancen: ['Steigende Nachfrage'],
  risiken: ['Zinserhoehung'],
  zusammenfassung: 'Solide Investitionsmoeglichkeit',
  handlungsempfehlung: 'Kaufen und langfristig halten',
};

describe('PDF Report Generation', () => {
  it('generates Lead Qualifier PDF without error', () => {
    const doc = generateLeadQualifierPDF(mockLead, qualifierResult);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates Market Analyst PDF without error', () => {
    const doc = generateMarketAnalystPDF(analystResult);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates SWOT PDF without error', () => {
    const doc = generateSWOTPDF(mockLead, swotResult);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates Pipeline PDF with all results', () => {
    const doc = generatePipelinePDF(mockLead, {
      leadQualifier: qualifierResult,
      marketAnalyst: analystResult,
      swotStrategist: swotResult,
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles empty/partial results gracefully', () => {
    const doc = generatePipelinePDF(mockLead, {});
    expect(doc).toBeDefined();
  });
});
