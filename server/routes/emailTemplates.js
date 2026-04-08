/**
 * Email Templates Route
 *
 * GET  /email-templates              — list templates for a broker type
 * GET  /email-templates/:id          — get a single template
 * POST /email-templates/render       — render template with variables
 * POST /email-templates/ai-personalize — AI-powered template personalization
 */

import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  renderTemplate,
  getAllCategories,
} from '../services/emailTemplates.js';
import { relayAIRequest } from '../services/aiProxy.js';
import { freemiumGate } from '../middleware/freemiumGate.js';

export const emailTemplateRouter = Router();

/**
 * GET /api/email-templates?brokerType=immobilien
 * Returns all templates for the given broker type plus category metadata.
 */
emailTemplateRouter.get('/email-templates', (req, res) => {
  const { brokerType } = req.query;

  if (!brokerType) {
    return res.status(400).json({ error: 'Query parameter "brokerType" is required.' });
  }

  const templates = getTemplates(brokerType);
  if (templates.length === 0) {
    return res.status(404).json({ error: `No templates found for broker type "${brokerType}".` });
  }

  return res.json({
    brokerType,
    categories: getAllCategories(),
    templates,
  });
});

/**
 * GET /api/email-templates/:id?brokerType=immobilien
 * Returns a single template.
 */
emailTemplateRouter.get('/email-templates/:id', (req, res) => {
  const { brokerType } = req.query;
  const { id } = req.params;

  if (!brokerType) {
    return res.status(400).json({ error: 'Query parameter "brokerType" is required.' });
  }

  const template = getTemplate(brokerType, id);
  if (!template) {
    return res.status(404).json({ error: `Template "${id}" not found for broker type "${brokerType}".` });
  }

  return res.json(template);
});

/**
 * POST /api/email-templates/render
 * Body: { templateId, brokerType, variables }
 * Renders placeholders and returns { subject, body }.
 */
emailTemplateRouter.post('/email-templates/render', (req, res) => {
  const { templateId, brokerType, variables } = req.body;

  if (!templateId || !brokerType) {
    return res.status(400).json({ error: '"templateId" and "brokerType" are required.' });
  }

  const template = getTemplate(brokerType, templateId);
  if (!template) {
    return res.status(404).json({ error: `Template "${templateId}" not found for broker type "${brokerType}".` });
  }

  const rendered = renderTemplate(template, variables || {});
  return res.json(rendered);
});

/**
 * POST /api/email-templates/ai-personalize
 * Body: { templateId, brokerType, leadData, tone, provider, model, apiKey }
 *
 * Uses the existing AI proxy to personalize the rendered template.
 * Falls back to standard rendering if AI is unavailable.
 */
emailTemplateRouter.post('/email-templates/ai-personalize', freemiumGate, async (req, res) => {
  const { templateId, brokerType, leadData, tone, provider, model, apiKey } = req.body;

  if (!templateId || !brokerType) {
    return res.status(400).json({ error: '"templateId" and "brokerType" are required.' });
  }

  const template = getTemplate(brokerType, templateId);
  if (!template) {
    return res.status(404).json({ error: `Template "${templateId}" not found for broker type "${brokerType}".` });
  }

  // Render with lead data as variables
  const variables = {
    name: leadData?.name || '',
    company: leadData?.company || '',
    dealValue: leadData?.dealValue || '',
    brokerName: leadData?.brokerName || '',
    nextStep: leadData?.nextStep || '',
    portalLink: leadData?.portalLink || '#',
  };

  const rendered = renderTemplate(template, variables);

  // Attempt AI personalization
  if (!provider || !model) {
    return res.json({ ...rendered, aiPersonalized: false });
  }

  const toneInstruction = tone
    ? `Der Ton soll ${tone} sein.`
    : 'Der Ton soll professionell und freundlich sein.';

  const prompt = `Du bist ein E-Mail-Schreibassistent fuer einen deutschen Broker.
Personalisiere die folgende E-Mail basierend auf den Lead-Daten.
Behalte die Kernaussage und das HTML-Format bei, aber mache den Text persoenlicher und relevanter.
${toneInstruction}

Lead-Daten:
- Name: ${variables.name}
- Firma: ${variables.company}
- Deal-Volumen: ${variables.dealValue}
${leadData?.notes ? `- Notizen: ${leadData.notes}` : ''}
${leadData?.priority ? `- Prioritaet: ${leadData.priority}` : ''}

Originaler Betreff:
${rendered.subject}

Originaler E-Mail-Text (HTML):
${rendered.body}

Gib die personalisierte Version als JSON zurueck mit den Feldern "subject" und "body". Nur das JSON, kein anderer Text.`;

  try {
    const aiResult = await relayAIRequest(
      provider,
      model,
      [{ role: 'user', content: prompt }],
      apiKey || undefined
    );

    // Try to parse AI response as JSON
    const content = aiResult.content.trim();
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1].trim());

    return res.json({
      subject: parsed.subject || rendered.subject,
      body: parsed.body || rendered.body,
      aiPersonalized: true,
      usage: aiResult.usage,
    });
  } catch {
    // Fallback to standard rendered template if AI fails
    return res.json({ ...rendered, aiPersonalized: false });
  }
});
