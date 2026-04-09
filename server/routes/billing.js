import { Router } from 'express';
import express from 'express';
import { getPlans, createCheckoutSession, createPortalSession, handleWebhook } from '../services/stripeService.js';

export const billingRouter = Router();

// GET /billing/plans — list available plans
billingRouter.get('/billing/plans', (_req, res) => {
  res.json(getPlans());
});

// POST /billing/checkout — create checkout session
billingRouter.post('/billing/checkout', async (req, res, next) => {
  try {
    const { planId, email } = req.body;
    if (!planId || !email) return res.status(400).json({ error: 'planId und email erforderlich' });

    const baseUrl = req.headers.origin || 'http://localhost:5173';
    const result = await createCheckoutSession({
      planId,
      customerEmail: email,
      successUrl: `${baseUrl}/einstellungen?billing=success`,
      cancelUrl: `${baseUrl}/einstellungen?billing=cancelled`,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// POST /billing/portal — create customer portal session
billingRouter.post('/billing/portal', async (req, res, next) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId erforderlich' });

    const baseUrl = req.headers.origin || 'http://localhost:5173';
    const result = await createPortalSession({
      customerId,
      returnUrl: `${baseUrl}/einstellungen`,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// Webhook handler exported separately — mounted before express.json() in server/index.js
export async function webhookHandler(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await handleWebhook(req.body, sig);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
