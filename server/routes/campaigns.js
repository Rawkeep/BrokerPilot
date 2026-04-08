/**
 * Campaign Routes — Drip campaign management API
 */

import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  enrollLead,
  getEnrollments,
  processScheduledEmails,
  pauseEnrollment,
  resumeEnrollment,
} from '../services/dripCampaigns.js';

export const campaignRouter = Router();

// Process scheduled emails every 5 minutes
const PROCESS_INTERVAL = 5 * 60 * 1000;
setInterval(async () => {
  try {
    const result = await processScheduledEmails();
    if (result.processed > 0) {
      console.log(`[DripCampaign] Processed ${result.processed} scheduled emails`);
    }
  } catch (err) {
    console.error('[DripCampaign] Error processing scheduled emails:', err.message);
  }
}, PROCESS_INTERVAL);

// GET /campaigns — list all campaigns
campaignRouter.get('/campaigns', async (_req, res, next) => {
  try {
    const all = await getCampaigns();
    const allEnrollments = await getEnrollments();

    const result = all.map((c) => {
      const campEnrollments = allEnrollments.filter((e) => e.campaignId === c.id);
      return {
        ...c,
        enrollmentCount: campEnrollments.length,
        emailsSent: campEnrollments.reduce((sum, e) => sum + (e.emailsSent || 0), 0),
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /campaigns/:id — single campaign with enrollment count
campaignRouter.get('/campaigns/:id', async (req, res, next) => {
  try {
    const campaign = await getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Kampagne nicht gefunden' });

    const campEnrollments = await getEnrollments(req.params.id);
    res.json({
      ...campaign,
      enrollmentCount: campEnrollments.length,
      emailsSent: campEnrollments.reduce((sum, e) => sum + (e.emailsSent || 0), 0),
    });
  } catch (err) {
    next(err);
  }
});

// POST /campaigns — create campaign
campaignRouter.post('/campaigns', async (req, res, next) => {
  try {
    const campaign = await createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

// PUT /campaigns/:id — update campaign
campaignRouter.put('/campaigns/:id', async (req, res, next) => {
  try {
    const updated = await updateCampaign(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /campaigns/:id — delete campaign
campaignRouter.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const deleted = await deleteCampaign(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /campaigns/:id/enroll — enroll a lead
campaignRouter.post('/campaigns/:id/enroll', async (req, res, next) => {
  try {
    const { leadId, leadEmail, leadName } = req.body;
    if (!leadId || !leadEmail) {
      return res.status(400).json({ error: 'leadId und leadEmail sind erforderlich' });
    }
    const enrollment = await enrollLead(req.params.id, { leadId, leadEmail, leadName });
    if (!enrollment) return res.status(404).json({ error: 'Kampagne nicht gefunden oder keine Schritte vorhanden' });
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
});

// GET /campaigns/:id/enrollments — list enrollments for a campaign
campaignRouter.get('/campaigns/:id/enrollments', async (req, res, next) => {
  try {
    const list = await getEnrollments(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// POST /campaigns/:id/enrollments/:enrollmentId/pause
campaignRouter.post('/campaigns/:id/enrollments/:enrollmentId/pause', async (req, res, next) => {
  try {
    const enrollment = await pauseEnrollment(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ error: 'Einschreibung nicht gefunden' });
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
});

// POST /campaigns/:id/enrollments/:enrollmentId/resume
campaignRouter.post('/campaigns/:id/enrollments/:enrollmentId/resume', async (req, res, next) => {
  try {
    const enrollment = await resumeEnrollment(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ error: 'Einschreibung nicht gefunden oder nicht pausiert' });
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
});

// POST /campaigns/process — manually trigger email processing
campaignRouter.post('/campaigns/process', async (_req, res, next) => {
  try {
    const result = await processScheduledEmails();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
