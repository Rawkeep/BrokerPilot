import { Router } from 'express';
import { getPlugins, getPlugin, registerPlugin, unregisterPlugin, executePlugin, setPluginEnabled } from '../services/pluginManager.js';

export const pluginRouter = Router();

/** GET /plugins — List all plugins */
pluginRouter.get('/plugins', (_req, res) => {
  const { type } = _req.query;
  const plugins = getPlugins(type || undefined);
  res.json(plugins.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    version: p.version,
    description: p.description,
    enabled: p.enabled,
    installedAt: p.installedAt,
  })));
});

/** GET /plugins/:id — Get plugin details */
pluginRouter.get('/plugins/:id', (req, res) => {
  const plugin = getPlugin(req.params.id);
  if (!plugin) return res.status(404).json({ error: 'Plugin not found' });
  res.json({
    id: plugin.id,
    name: plugin.name,
    type: plugin.type,
    version: plugin.version,
    description: plugin.description,
    enabled: plugin.enabled,
    config: plugin.config || null,
    installedAt: plugin.installedAt,
  });
});

/** POST /plugins/:id/execute — Run a plugin */
pluginRouter.post('/plugins/:id/execute', async (req, res, next) => {
  try {
    const result = await executePlugin(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** PUT /plugins/:id/toggle — Enable/disable */
pluginRouter.put('/plugins/:id/toggle', (req, res) => {
  const { enabled } = req.body;
  const result = setPluginEnabled(req.params.id, !!enabled);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

/** DELETE /plugins/:id — Uninstall */
pluginRouter.delete('/plugins/:id', (req, res) => {
  const result = unregisterPlugin(req.params.id);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});
