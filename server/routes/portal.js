import { Router } from 'express';
import crypto from 'crypto';

export const portalRouter = Router();

/** In-memory portal store (use Supabase in production) */
const portals = new Map();

/** POST /portal/create — Generate a portal link */
portalRouter.post('/portal/create', (req, res) => {
  const { leadId, leadName, proposal, userId, expiresInDays = 30 } = req.body;
  if (!leadId || !proposal) {
    return res.status(400).json({ error: 'leadId and proposal required' });
  }

  const token = crypto.randomUUID();
  const portal = {
    token,
    leadId,
    leadName: leadName || 'Kunde',
    userId,
    proposal,
    signature: null,
    signedAt: null,
    messages: [],
    documents: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInDays * 86400000).toISOString(),
  };

  portals.set(token, portal);
  res.json({ token, url: `/portal/${token}` });
});

/** GET /portal/:token — Get portal data (PUBLIC) */
portalRouter.get('/portal/:token', (req, res) => {
  const portal = portals.get(req.params.token);
  if (!portal) return res.status(404).json({ error: 'Portal nicht gefunden' });
  if (new Date(portal.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Portal abgelaufen' });
  }

  res.json({
    leadName: portal.leadName,
    proposal: portal.proposal,
    documents: portal.documents,
    isSigned: !!portal.signature,
    signedAt: portal.signedAt,
    expiresAt: portal.expiresAt,
  });
});

/** POST /portal/:token/sign — E-sign the proposal */
portalRouter.post('/portal/:token/sign', (req, res) => {
  const portal = portals.get(req.params.token);
  if (!portal) return res.status(404).json({ error: 'Portal nicht gefunden' });
  if (portal.signature) return res.status(409).json({ error: 'Bereits unterschrieben' });

  const { signatureData, signerName } = req.body;
  if (!signatureData) return res.status(400).json({ error: 'signatureData required' });

  portal.signature = signatureData;
  portal.signerName = signerName || '';
  portal.signedAt = new Date().toISOString();

  res.json({ success: true, signedAt: portal.signedAt });
});

/** POST /portal/:token/message — Client sends a message */
portalRouter.post('/portal/:token/message', (req, res) => {
  const portal = portals.get(req.params.token);
  if (!portal) return res.status(404).json({ error: 'Portal nicht gefunden' });

  const { message, senderName } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  portal.messages.push({
    id: crypto.randomUUID(),
    message,
    senderName: senderName || 'Kunde',
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true });
});
