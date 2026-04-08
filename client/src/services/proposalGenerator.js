/**
 * Proposal Generator — Builds structured offer/proposal from pipeline results.
 *
 * Takes lead data + all 3 agent results and generates a complete,
 * ready-to-send proposal document structure.
 */

import { BROKER_TYPES } from '../../../shared/brokerTypes.js';

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Generate a structured proposal from pipeline results.
 *
 * @param {object} lead - Full lead object
 * @param {object} pipelineResults - { qualifierResult, analystResult, swotResult }
 * @returns {object} Structured proposal document
 */
export function generateProposal(lead, pipelineResults) {
  const qualifierResult = pipelineResults.leadQualifier || pipelineResults.qualifierResult;
  const analystResult = pipelineResults.marketAnalyst || pipelineResults.analystResult;
  const swotResult = pipelineResults.swotStrategist || pipelineResults.swotResult;
  const config = BROKER_TYPES[lead.brokerType];
  const brokerLabel = config?.label || lead.brokerType;
  const today = dateFmt.format(new Date());

  // Build proposal sections
  const proposal = {
    meta: {
      generatedAt: new Date().toISOString(),
      date: today,
      brokerType: brokerLabel,
      leadName: lead.name,
      company: lead.company || '',
      dealValue: lead.dealValue ? currencyFmt.format(lead.dealValue) : '-',
    },

    // Section 1: Executive Summary
    zusammenfassung: buildSummary(lead, qualifierResult, analystResult),

    // Section 2: Lead Assessment
    bewertung: qualifierResult ? {
      score: qualifierResult.score,
      kategorie: qualifierResult.kategorie,
      zusammenfassung: qualifierResult.zusammenfassung,
      faktoren: qualifierResult.begruendung || [],
    } : null,

    // Section 3: Market Analysis
    marktanalyse: analystResult ? {
      empfehlung: analystResult.empfehlung,
      konfidenz: analystResult.konfidenz,
      analyse: analystResult.analyse,
      risiken: analystResult.risiken || [],
      chancen: analystResult.chancen || [],
      marktdaten: analystResult.marktdaten,
    } : null,

    // Section 4: Strategic Assessment (SWOT)
    strategie: swotResult ? {
      zusammenfassung: swotResult.zusammenfassung,
      staerken: swotResult.staerken || [],
      schwaechen: swotResult.schwaechen || [],
      chancen: swotResult.chancen || [],
      risiken: swotResult.risiken || [],
      empfehlung: swotResult.handlungsempfehlung,
    } : null,

    // Section 5: Recommended Actions
    empfehlungen: buildRecommendations(qualifierResult, analystResult, swotResult),

    // Section 6: Next Steps
    naechsteSchritte: buildNextSteps(lead, qualifierResult),
  };

  return proposal;
}

function buildSummary(lead, qualifier, analyst) {
  const parts = [];

  parts.push(`Angebot fuer ${lead.name}${lead.company ? ` (${lead.company})` : ''}.`);

  if (qualifier) {
    parts.push(`Lead-Bewertung: ${qualifier.score}/100 (${qualifier.kategorie}).`);
  }

  if (analyst) {
    const empfMap = { kaufen: 'Kaufempfehlung', halten: 'Halteempfehlung', verkaufen: 'Verkaufsempfehlung' };
    parts.push(`Markteinschaetzung: ${empfMap[analyst.empfehlung] || analyst.empfehlung} mit ${analyst.konfidenz}er Konfidenz.`);
  }

  if (lead.dealValue) {
    parts.push(`Deal-Volumen: ${currencyFmt.format(lead.dealValue)}.`);
  }

  return parts.join(' ');
}

function buildRecommendations(qualifier, analyst, swot) {
  const recs = [];

  if (qualifier?.empfohleneAktionen) {
    recs.push(...qualifier.empfohleneAktionen);
  }

  if (analyst?.empfehlung === 'kaufen') {
    recs.push('Investitionsmoeglichkeit zeitnah pruefen und Kunden informieren');
  } else if (analyst?.empfehlung === 'verkaufen') {
    recs.push('Risiken kommunizieren und alternative Anlageoptionen vorstellen');
  }

  if (swot?.handlungsempfehlung) {
    recs.push(swot.handlungsempfehlung);
  }

  return [...new Set(recs)]; // deduplicate
}

function buildNextSteps(lead, qualifier) {
  const steps = [];

  if (qualifier?.naechsterSchritt) {
    steps.push(qualifier.naechsterSchritt);
  }

  steps.push('Angebot mit dem Kunden besprechen');
  steps.push('Zeitplan fuer naechste Schritte vereinbaren');

  const stage = (lead.stage || '').toLowerCase();
  if (stage.includes('erst') || stage.includes('anfrage') || stage.includes('interesse')) {
    steps.push('Detaillierte Bedarfsanalyse durchfuehren');
  }

  return steps;
}

/**
 * Generate plain-text proposal for quick copy/paste or email.
 *
 * @param {object} proposal - Output from generateProposal()
 * @returns {string} Formatted text
 */
export function proposalToText(proposal) {
  const lines = [];

  lines.push('═══════════════════════════════════════');
  lines.push(`  ANGEBOT — ${proposal.meta.leadName}`);
  lines.push(`  ${proposal.meta.brokerType} | ${proposal.meta.date}`);
  lines.push('═══════════════════════════════════════');
  lines.push('');

  // Summary
  lines.push('ZUSAMMENFASSUNG');
  lines.push('───────────────');
  lines.push(proposal.zusammenfassung);
  lines.push('');

  // Assessment
  if (proposal.bewertung) {
    lines.push(`LEAD-BEWERTUNG: ${proposal.bewertung.score}/100 (${proposal.bewertung.kategorie})`);
    lines.push('───────────────');
    lines.push(proposal.bewertung.zusammenfassung);
    lines.push('');
  }

  // Market Analysis
  if (proposal.marktanalyse) {
    const empfMap = { kaufen: 'KAUFEN', halten: 'HALTEN', verkaufen: 'VERKAUFEN' };
    lines.push(`MARKTANALYSE — Empfehlung: ${empfMap[proposal.marktanalyse.empfehlung] || proposal.marktanalyse.empfehlung}`);
    lines.push('───────────────');
    lines.push(proposal.marktanalyse.analyse);
    if (proposal.marktanalyse.chancen.length > 0) {
      lines.push('');
      lines.push('Chancen:');
      proposal.marktanalyse.chancen.forEach((c) => lines.push(`  + ${c}`));
    }
    if (proposal.marktanalyse.risiken.length > 0) {
      lines.push('');
      lines.push('Risiken:');
      proposal.marktanalyse.risiken.forEach((r) => lines.push(`  - ${r}`));
    }
    lines.push('');
  }

  // SWOT
  if (proposal.strategie) {
    lines.push('STRATEGISCHE ANALYSE (SWOT)');
    lines.push('───────────────');
    lines.push(proposal.strategie.zusammenfassung);
    lines.push('');
    if (proposal.strategie.empfehlung) {
      lines.push(`Handlungsempfehlung: ${proposal.strategie.empfehlung}`);
      lines.push('');
    }
  }

  // Recommendations
  if (proposal.empfehlungen.length > 0) {
    lines.push('EMPFEHLUNGEN');
    lines.push('───────────────');
    proposal.empfehlungen.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push('');
  }

  // Next Steps
  if (proposal.naechsteSchritte.length > 0) {
    lines.push('NAECHSTE SCHRITTE');
    lines.push('───────────────');
    proposal.naechsteSchritte.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }

  lines.push('───────────────');
  lines.push(`Generiert am ${proposal.meta.date} | BrokerPilot KI-Pipeline`);

  return lines.join('\n');
}
