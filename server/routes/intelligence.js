import { Router } from 'express';
import { generateDailyReport, detectAlerts, analyzeTrend } from '../services/marketIntelligence.js';

export const intelligenceRouter = Router();

/** GET /intelligence/daily — Daily market report */
intelligenceRouter.get('/intelligence/daily', async (req, res, next) => {
  try {
    const { brokerType } = req.query;
    const report = await generateDailyReport(brokerType || null);
    res.json(report);
  } catch (err) { next(err); }
});

/** GET /intelligence/alerts — Check alerts for symbols */
intelligenceRouter.get('/intelligence/alerts', async (req, res, next) => {
  try {
    const symbols = (req.query.symbols || '').split(',').filter(Boolean).slice(0, 20);
    const alerts = await detectAlerts(symbols);
    res.json(alerts);
  } catch (err) { next(err); }
});

/** GET /intelligence/trends — Trend analysis for a symbol */
intelligenceRouter.get('/intelligence/trends', async (req, res, next) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    const trend = await analyzeTrend(symbol);
    if (!trend) return res.status(404).json({ error: 'Symbol not found' });
    res.json(trend);
  } catch (err) { next(err); }
});
