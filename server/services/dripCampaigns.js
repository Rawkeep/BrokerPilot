/**
 * Drip Campaign Engine
 *
 * In-memory campaign management with JSON file persistence.
 * Handles campaign CRUD, lead enrollment, and scheduled email processing.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { sendEmail } from './emailSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const ENROLLMENTS_FILE = path.join(DATA_DIR, 'enrollments.json');

// In-memory state
let campaigns = [];
let enrollments = [];
let initialized = false;

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadJSON(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveCampaigns() {
  await ensureDataDir();
  await writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
}

async function saveEnrollments() {
  await ensureDataDir();
  await writeFile(ENROLLMENTS_FILE, JSON.stringify(enrollments, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Seed templates
// ---------------------------------------------------------------------------

function getDefaultCampaigns() {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Willkommens-Serie',
      brokerType: 'immobilien',
      trigger: 'lead_created',
      enabled: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: crypto.randomUUID(),
          delayDays: 0,
          templateId: 'welcome-1',
          subject: 'Willkommen bei uns, {{leadName}}!',
          body: '<h2>Hallo {{leadName}},</h2><p>vielen Dank f\u00fcr Ihr Interesse! Wir freuen uns, Sie als neuen Kontakt begr\u00fc\u00dfen zu d\u00fcrfen.</p><p>In den n\u00e4chsten Tagen erhalten Sie von uns wertvolle Informationen rund um Ihre Immobiliensuche.</p><p>Herzliche Gr\u00fc\u00dfe,<br/>Ihr BrokerPilot-Team</p>',
          condition: null,
        },
        {
          id: crypto.randomUUID(),
          delayDays: 3,
          templateId: 'welcome-2',
          subject: 'Ihre n\u00e4chsten Schritte, {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>wir m\u00f6chten sicherstellen, dass Sie das Beste aus unserer Zusammenarbeit herausholen.</p><p>Hier sind einige hilfreiche Tipps f\u00fcr Ihre Suche:</p><ul><li>Definieren Sie Ihr Budget klar</li><li>Legen Sie Ihre Priorit\u00e4ten fest</li><li>Nutzen Sie unsere Markt\u00fcbersicht</li></ul><p>Beste Gr\u00fc\u00dfe,<br/>Ihr BrokerPilot-Team</p>',
          condition: 'lead_active',
        },
        {
          id: crypto.randomUUID(),
          delayDays: 7,
          templateId: 'welcome-3',
          subject: 'Exklusive Angebote f\u00fcr Sie, {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>basierend auf Ihren Pr\u00e4ferenzen haben wir einige exklusive Angebote f\u00fcr Sie zusammengestellt.</p><p>Antworten Sie einfach auf diese E-Mail, um einen pers\u00f6nlichen Beratungstermin zu vereinbaren.</p><p>Mit freundlichen Gr\u00fc\u00dfen,<br/>Ihr BrokerPilot-Team</p>',
          condition: 'lead_not_closed',
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Follow-up Sequenz',
      brokerType: 'immobilien',
      trigger: 'stage_change:besichtigung',
      enabled: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: crypto.randomUUID(),
          delayDays: 0,
          templateId: 'followup-1',
          subject: 'Vielen Dank f\u00fcr die Besichtigung, {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>vielen Dank, dass Sie sich die Zeit f\u00fcr eine Besichtigung genommen haben!</p><p>Haben Sie noch Fragen? Wir stehen Ihnen gerne zur Verf\u00fcgung.</p>',
          condition: null,
        },
        {
          id: crypto.randomUUID(),
          delayDays: 2,
          templateId: 'followup-2',
          subject: 'Ihre Meinung ist uns wichtig, {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>wie hat Ihnen die Besichtigung gefallen? Teilen Sie uns Ihre Eindr\u00fccke mit \u2014 wir finden die perfekte L\u00f6sung f\u00fcr Sie.</p>',
          condition: 'lead_active',
        },
        {
          id: crypto.randomUUID(),
          delayDays: 5,
          templateId: 'followup-3',
          subject: '\u00c4hnliche Objekte, die Sie interessieren k\u00f6nnten',
          body: '<h2>Hallo {{leadName}},</h2><p>wir haben weitere Objekte gefunden, die Ihren Kriterien entsprechen. Schauen Sie sich unsere neuesten Angebote an.</p>',
          condition: 'lead_not_closed',
        },
        {
          id: crypto.randomUUID(),
          delayDays: 10,
          templateId: 'followup-4',
          subject: 'Pers\u00f6nliche Beratung f\u00fcr {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>m\u00f6chten Sie einen pers\u00f6nlichen Beratungstermin vereinbaren? Wir helfen Ihnen gerne bei der Entscheidungsfindung.</p>',
          condition: 'lead_active',
        },
        {
          id: crypto.randomUUID(),
          delayDays: 14,
          templateId: 'followup-5',
          subject: 'Letztes Update von Ihrem Makler-Team',
          body: '<h2>Hallo {{leadName}},</h2><p>wir m\u00f6chten uns nochmals bei Ihnen melden. Falls Sie Unterst\u00fctzung ben\u00f6tigen, sind wir nur eine Nachricht entfernt.</p>',
          condition: 'lead_not_closed',
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Re-Engagement',
      brokerType: 'immobilien',
      trigger: 'manual',
      enabled: false,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: crypto.randomUUID(),
          delayDays: 0,
          templateId: 'reengage-1',
          subject: 'Wir vermissen Sie, {{leadName}}!',
          body: '<h2>Hallo {{leadName}},</h2><p>es ist eine Weile her, seit wir zuletzt in Kontakt waren. Haben sich Ihre Pl\u00e4ne ge\u00e4ndert?</p><p>Wir haben spannende Neuigkeiten f\u00fcr Sie!</p>',
          condition: null,
        },
        {
          id: crypto.randomUUID(),
          delayDays: 7,
          templateId: 'reengage-2',
          subject: 'Neue Marktchancen f\u00fcr {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>der Markt hat sich weiterentwickelt. Hier sind die neuesten Trends und Chancen, die f\u00fcr Sie relevant sein k\u00f6nnten.</p>',
          condition: 'lead_active',
        },
        {
          id: crypto.randomUUID(),
          delayDays: 21,
          templateId: 'reengage-3',
          subject: 'Exklusives Angebot f\u00fcr {{leadName}}',
          body: '<h2>Hallo {{leadName}},</h2><p>als besonderes Angebot m\u00f6chten wir Ihnen eine kostenlose Marktanalyse anbieten. Lassen Sie uns wissen, ob Sie interessiert sind!</p>',
          condition: 'lead_not_closed',
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

async function init() {
  if (initialized) return;
  await ensureDataDir();
  campaigns = await loadJSON(CAMPAIGNS_FILE);
  enrollments = await loadJSON(ENROLLMENTS_FILE);

  if (campaigns.length === 0) {
    campaigns = getDefaultCampaigns();
    await saveCampaigns();
  }

  initialized = true;
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function getCampaigns() {
  await init();
  return campaigns;
}

export async function getCampaign(id) {
  await init();
  return campaigns.find((c) => c.id === id) || null;
}

export async function createCampaign(campaign) {
  await init();
  const newCampaign = {
    id: crypto.randomUUID(),
    name: campaign.name || 'Neue Kampagne',
    brokerType: campaign.brokerType || 'immobilien',
    trigger: campaign.trigger || 'manual',
    steps: (campaign.steps || []).map((s) => ({
      id: s.id || crypto.randomUUID(),
      delayDays: s.delayDays ?? 0,
      templateId: s.templateId || crypto.randomUUID(),
      subject: s.subject || '',
      body: s.body || '',
      condition: s.condition || null,
    })),
    enabled: campaign.enabled ?? true,
    createdAt: new Date().toISOString(),
  };
  campaigns.push(newCampaign);
  await saveCampaigns();
  return newCampaign;
}

export async function updateCampaign(id, updates) {
  await init();
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const existing = campaigns[idx];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  if (updates.steps) {
    updated.steps = updates.steps.map((s) => ({
      id: s.id || crypto.randomUUID(),
      delayDays: s.delayDays ?? 0,
      templateId: s.templateId || crypto.randomUUID(),
      subject: s.subject || '',
      body: s.body || '',
      condition: s.condition || null,
    }));
  }

  campaigns[idx] = updated;
  await saveCampaigns();
  return updated;
}

export async function deleteCampaign(id) {
  await init();
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  campaigns.splice(idx, 1);
  // Remove associated enrollments
  enrollments = enrollments.filter((e) => e.campaignId !== id);
  await saveCampaigns();
  await saveEnrollments();
  return true;
}

// ---------------------------------------------------------------------------
// Enrollment management
// ---------------------------------------------------------------------------

export async function enrollLead(campaignId, lead) {
  await init();
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) return null;
  if (!campaign.steps || campaign.steps.length === 0) return null;

  const enrollment = {
    id: crypto.randomUUID(),
    campaignId,
    leadId: lead.leadId,
    leadEmail: lead.leadEmail,
    leadName: lead.leadName,
    currentStep: 0,
    startedAt: new Date().toISOString(),
    nextSendAt: computeNextSend(new Date(), campaign.steps[0].delayDays),
    status: 'active',
    emailsSent: 0,
  };

  enrollments.push(enrollment);
  await saveEnrollments();
  return enrollment;
}

export async function getEnrollments(campaignId) {
  await init();
  if (campaignId) {
    return enrollments.filter((e) => e.campaignId === campaignId);
  }
  return enrollments;
}

export async function pauseEnrollment(enrollmentId) {
  await init();
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return null;
  enrollment.status = 'paused';
  await saveEnrollments();
  return enrollment;
}

export async function resumeEnrollment(enrollmentId) {
  await init();
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment || enrollment.status !== 'paused') return null;
  enrollment.status = 'active';
  // Recalculate next send from now
  const campaign = campaigns.find((c) => c.id === enrollment.campaignId);
  if (campaign && enrollment.currentStep < campaign.steps.length) {
    enrollment.nextSendAt = computeNextSend(new Date(), 0);
  }
  await saveEnrollments();
  return enrollment;
}

// ---------------------------------------------------------------------------
// Scheduled email processing
// ---------------------------------------------------------------------------

function computeNextSend(fromDate, delayDays) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + delayDays);
  return d.toISOString();
}

function renderTemplate(template, lead) {
  return template
    .replace(/\{\{leadName\}\}/g, lead.leadName || '')
    .replace(/\{\{leadEmail\}\}/g, lead.leadEmail || '')
    .replace(/\{\{leadId\}\}/g, lead.leadId || '');
}

export async function processScheduledEmails() {
  await init();
  const now = new Date();
  let processed = 0;

  for (const enrollment of enrollments) {
    if (enrollment.status !== 'active') continue;
    if (new Date(enrollment.nextSendAt) > now) continue;

    const campaign = campaigns.find((c) => c.id === enrollment.campaignId);
    if (!campaign || !campaign.enabled) continue;

    const step = campaign.steps[enrollment.currentStep];
    if (!step) {
      enrollment.status = 'completed';
      continue;
    }

    // Render template with lead data
    const subject = renderTemplate(step.subject, enrollment);
    const html = renderTemplate(step.body, enrollment);

    try {
      await sendEmail({
        to: enrollment.leadEmail,
        subject,
        html,
      });
      processed++;
    } catch (err) {
      console.error(`[DripCampaign] Failed to send email for enrollment ${enrollment.id}:`, err.message);
      continue;
    }

    enrollment.emailsSent = (enrollment.emailsSent || 0) + 1;

    // Advance to next step or mark completed
    const nextStepIdx = enrollment.currentStep + 1;
    if (nextStepIdx >= campaign.steps.length) {
      enrollment.status = 'completed';
      enrollment.currentStep = nextStepIdx;
    } else {
      enrollment.currentStep = nextStepIdx;
      enrollment.nextSendAt = computeNextSend(now, campaign.steps[nextStepIdx].delayDays);
    }
  }

  if (processed > 0 || enrollments.some((e) => e.status === 'completed')) {
    await saveEnrollments();
  }

  return { processed };
}
