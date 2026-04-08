/**
 * Lead-Scoring Engine
 *
 * Berechnet einen Score (0-100) fuer jeden Lead basierend auf:
 *   - Profil-Vollstaendigkeit (0-20)
 *   - Deal-Wert (0-20)
 *   - Pipeline-Fortschritt (0-20)
 *   - Aktivitaet & Engagement (0-20)
 *   - Aktualitaet (0-20)
 */

const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / DAY_MS;
}

// ---------------------------------------------------------------------------
// Category scorers
// ---------------------------------------------------------------------------

function scoreProfile(lead) {
  let pts = 0;
  if (lead.email) pts += 5;
  if (lead.phone) pts += 5;
  if (lead.company) pts += 5;
  if (lead.customFields && Object.keys(lead.customFields).some((k) => lead.customFields[k])) {
    pts += 5;
  }
  return pts;
}

function scoreDealValue(lead) {
  const v = Number(lead.dealValue) || 0;
  if (v > 500_000) return 20;
  if (v > 100_000) return 15;
  if (v > 50_000) return 10;
  if (v > 10_000) return 5;
  return 0;
}

function scorePipeline(lead, stages) {
  if (!stages || stages.length === 0) return 0;
  const idx = stages.findIndex((s) => s.id === lead.stage);
  if (idx < 0) return 0;
  return Math.round((idx / (stages.length - 1)) * 20) || 0;
}

function scoreActivity(lead) {
  let pts = 0;
  const activities = lead.activities || [];

  // Aktivitaet in den letzten 7 Tagen
  const hasRecent = activities.some((a) => daysSince(a.date || a.createdAt) <= 7);
  if (hasRecent) pts += 10;

  // Mehr als 5 Aktivitaeten insgesamt
  if (activities.length > 5) pts += 5;

  // Notizen vorhanden
  if (lead.notes && lead.notes.length > 0) pts += 5;

  return pts;
}

function scoreRecency(lead) {
  const d = daysSince(lead.updatedAt);
  if (d <= 1) return 20;
  if (d <= 3) return 15;
  if (d <= 7) return 10;
  if (d <= 30) return 5;
  return 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Berechnet den Lead-Score inkl. Aufschluesselung und Tier.
 *
 * @param {object} lead
 * @param {Array}  stages — pipelineStages aus BROKER_TYPES
 * @returns {{ score: number, breakdown: object, tier: 'hot'|'warm'|'cold' }}
 */
export function calculateLeadScore(lead, stages) {
  const breakdown = {
    profile: scoreProfile(lead),
    dealValue: scoreDealValue(lead),
    pipeline: scorePipeline(lead, stages),
    activity: scoreActivity(lead),
    recency: scoreRecency(lead),
  };

  const score = breakdown.profile + breakdown.dealValue + breakdown.pipeline + breakdown.activity + breakdown.recency;
  const tier = getScoreTier(score);

  return { score, breakdown, tier };
}

/**
 * Alle Leads bewerten und absteigend nach Score sortieren.
 */
export function scoreAllLeads(leads, stages) {
  return leads
    .map((lead) => {
      const { score, breakdown, tier } = calculateLeadScore(lead, stages);
      return { lead, score, breakdown, tier };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Nur "hot" Leads (score >= 70), absteigend sortiert.
 */
export function getHotLeads(leads, stages) {
  return scoreAllLeads(leads, stages).filter((r) => r.tier === 'hot');
}

/**
 * CSS-Farbe passend zum Score.
 */
export function getScoreColor(score) {
  if (score >= 70) return 'var(--color-error)';   // rot/coral fuer hot
  if (score >= 40) return 'var(--color-warning)';  // amber fuer warm
  return 'var(--color-text-muted)';                // grau fuer cold
}

/**
 * Tier-String anhand des Scores.
 */
export function getScoreTier(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
