/**
 * Plugin Manager — Extensible agent and integration system.
 *
 * Allows registration of custom pipeline agents, webhook integrations,
 * and data transformers that extend BrokerPilot's functionality.
 *
 * Built-in plugin types:
 * - 'agent'      — Custom AI pipeline step
 * - 'webhook'    — External event trigger (incoming/outgoing)
 * - 'transformer'— Data transformation before/after pipeline
 * - 'integration'— Third-party service connector
 */

/** @type {Map<string, Plugin>} */
const plugins = new Map();

/** @type {Map<string, Function[]>} */
const hooks = new Map();

/**
 * @typedef {object} Plugin
 * @property {string} id - Unique plugin identifier
 * @property {string} name - Display name
 * @property {string} type - 'agent' | 'webhook' | 'transformer' | 'integration'
 * @property {string} version - Semver version
 * @property {string} description - What this plugin does
 * @property {object} [config] - Plugin configuration schema
 * @property {Function} [execute] - Main execution function
 * @property {Function} [onInstall] - Called when plugin is installed
 * @property {Function} [onUninstall] - Called when plugin is removed
 * @property {object} [hooks] - Event hooks this plugin listens to
 */

/**
 * Register a new plugin.
 * @param {Plugin} plugin
 */
export function registerPlugin(plugin) {
  if (!plugin.id || !plugin.name || !plugin.type) {
    throw new Error('Plugin must have id, name, and type');
  }

  if (plugins.has(plugin.id)) {
    throw new Error(`Plugin "${plugin.id}" is already registered`);
  }

  const validTypes = ['agent', 'webhook', 'transformer', 'integration'];
  if (!validTypes.includes(plugin.type)) {
    throw new Error(`Invalid plugin type: ${plugin.type}. Must be one of: ${validTypes.join(', ')}`);
  }

  plugins.set(plugin.id, {
    ...plugin,
    installedAt: new Date().toISOString(),
    enabled: true,
  });

  // Register plugin hooks
  if (plugin.hooks) {
    for (const [event, handler] of Object.entries(plugin.hooks)) {
      addHook(event, handler);
    }
  }

  // Call onInstall
  if (typeof plugin.onInstall === 'function') {
    try {
      plugin.onInstall();
    } catch (err) {
      console.error(`Plugin "${plugin.id}" onInstall error:`, err.message);
    }
  }

  return { success: true, pluginId: plugin.id };
}

/**
 * Unregister a plugin.
 * @param {string} pluginId
 */
export function unregisterPlugin(pluginId) {
  const plugin = plugins.get(pluginId);
  if (!plugin) return { success: false, error: 'Plugin not found' };

  if (typeof plugin.onUninstall === 'function') {
    try {
      plugin.onUninstall();
    } catch (err) {
      console.error(`Plugin "${pluginId}" onUninstall error:`, err.message);
    }
  }

  plugins.delete(pluginId);
  return { success: true };
}

/**
 * Get all registered plugins.
 * @param {string} [type] - Filter by type
 * @returns {Plugin[]}
 */
export function getPlugins(type) {
  const all = Array.from(plugins.values());
  return type ? all.filter((p) => p.type === type) : all;
}

/**
 * Get a single plugin by ID.
 * @param {string} pluginId
 * @returns {Plugin|null}
 */
export function getPlugin(pluginId) {
  return plugins.get(pluginId) || null;
}

/**
 * Execute a plugin's main function.
 * @param {string} pluginId
 * @param {object} context - Execution context (lead data, pipeline state, etc.)
 * @returns {Promise<object>}
 */
export async function executePlugin(pluginId, context) {
  const plugin = plugins.get(pluginId);
  if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);
  if (!plugin.enabled) throw new Error(`Plugin "${pluginId}" is disabled`);
  if (typeof plugin.execute !== 'function') {
    throw new Error(`Plugin "${pluginId}" has no execute function`);
  }

  const startTime = Date.now();
  try {
    const result = await plugin.execute(context);
    return {
      pluginId,
      success: true,
      result,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    return {
      pluginId,
      success: false,
      error: err.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Enable or disable a plugin.
 * @param {string} pluginId
 * @param {boolean} enabled
 */
export function setPluginEnabled(pluginId, enabled) {
  const plugin = plugins.get(pluginId);
  if (!plugin) return { success: false, error: 'Plugin not found' };
  plugin.enabled = enabled;
  return { success: true };
}

// --- Hook System ---

/**
 * Register an event hook.
 * @param {string} event - Event name (e.g. 'lead:created', 'pipeline:complete')
 * @param {Function} handler
 */
export function addHook(event, handler) {
  if (!hooks.has(event)) hooks.set(event, []);
  hooks.get(event).push(handler);
}

/**
 * Emit an event to all registered hooks.
 * @param {string} event
 * @param {object} data
 */
export async function emitHook(event, data) {
  const handlers = hooks.get(event) || [];
  const results = [];

  for (const handler of handlers) {
    try {
      const result = await handler(data);
      results.push({ success: true, result });
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }

  return results;
}

/**
 * Available hook events:
 * - lead:created    — New lead added
 * - lead:updated    — Lead data changed
 * - lead:deleted    — Lead removed
 * - lead:stage_changed — Lead moved to new stage
 * - pipeline:started — AI pipeline started
 * - pipeline:step_complete — Individual pipeline step finished
 * - pipeline:complete — Full pipeline finished
 * - proposal:generated — New proposal created
 * - reminder:due    — Reminder is due
 * - email:sent      — Email was sent
 * - document:uploaded — Document was uploaded
 * - portal:viewed   — Client viewed portal
 * - portal:signed   — Client signed proposal
 */
export const HOOK_EVENTS = [
  'lead:created',
  'lead:updated',
  'lead:deleted',
  'lead:stage_changed',
  'pipeline:started',
  'pipeline:step_complete',
  'pipeline:complete',
  'proposal:generated',
  'reminder:due',
  'email:sent',
  'document:uploaded',
  'portal:viewed',
  'portal:signed',
];

// --- Built-in Plugins ---

// Register a sample webhook plugin
registerPlugin({
  id: 'builtin:webhook-logger',
  name: 'Webhook Logger',
  type: 'webhook',
  version: '1.0.0',
  description: 'Logs all events to console (development only)',
  hooks: {
    'lead:created': (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Plugin:webhook-logger] Lead created:', data?.name);
      }
    },
    'pipeline:complete': (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Plugin:webhook-logger] Pipeline complete for:', data?.leadId);
      }
    },
  },
});
