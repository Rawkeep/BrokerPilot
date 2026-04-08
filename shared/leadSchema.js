import { v4 as uuidv4 } from 'uuid';
import { BROKER_TYPES } from './brokerTypes.js';

const CLOSED_STAGES = ['abgeschlossen', 'closing'];

/**
 * Factory: creates a new lead for the given broker type.
 * @param {string} brokerType
 * @returns {object} lead
 */
export function createLead(brokerType) {
  const config = BROKER_TYPES[brokerType];
  const firstStage = config?.pipelineStages?.[0];
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    brokerType,
    stage: firstStage?.id ?? '',
    stageOrder: 0,

    // Contact
    name: '',
    email: '',
    phone: '',
    company: '',

    // Financial
    dealValue: null,
    budget: null,

    // Metadata
    tags: [],
    notes: '',
    priority: 'medium',

    // Broker-specific
    customFields: {},

    // Activity timeline
    activities: [
      {
        id: uuidv4(),
        type: 'created',
        timestamp: now,
        description: 'Lead erstellt',
        metadata: {},
      },
    ],

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validates a lead object.
 * @param {object} lead
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLead(lead) {
  const errors = [];

  // Name required, max 200
  if (!lead.name || lead.name.trim().length === 0) {
    errors.push('name is required');
  } else if (lead.name.length > 200) {
    errors.push('name must be 200 characters or fewer');
  }

  // Notes max 5000
  if (lead.notes && lead.notes.length > 5000) {
    errors.push('notes must be 5000 characters or fewer');
  }

  // brokerType must be valid
  if (!BROKER_TYPES[lead.brokerType]) {
    errors.push('Invalid brokerType');
  } else {
    // Stage must be valid for this broker type
    const validStageIds = BROKER_TYPES[lead.brokerType].pipelineStages.map((s) => s.id);
    if (!validStageIds.includes(lead.stage)) {
      errors.push(`Invalid stage "${lead.stage}" for brokerType "${lead.brokerType}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Appends an activity to a lead (immutable). Caps at 100 entries.
 * @param {object} lead
 * @param {string} type
 * @param {string} description
 * @param {object} metadata
 * @returns {object} new lead with activity appended
 */
export function addActivity(lead, type, description, metadata = {}) {
  const activity = {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    description,
    metadata,
  };

  let activities = [...lead.activities, activity];
  if (activities.length > 100) {
    activities = activities.slice(activities.length - 100);
  }

  return {
    ...lead,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Pure filter function for leads.
 * @param {object[]} leads
 * @param {object} filters - { brokerType, stage, search, tags, dateFrom, dateTo, priority }
 * @returns {object[]}
 */
export function filterLeads(leads, filters) {
  return leads.filter((lead) => {
    if (filters.brokerType && lead.brokerType !== filters.brokerType) return false;
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = `${lead.name || ''} ${lead.email || ''} ${lead.company || ''} ${lead.notes || ''}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.tags?.length) {
      if (!filters.tags.some((t) => lead.tags.includes(t))) return false;
    }
    if (filters.dateFrom) {
      if (new Date(lead.createdAt) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      if (new Date(lead.createdAt) > new Date(filters.dateTo)) return false;
    }
    if (filters.priority && lead.priority !== filters.priority) return false;
    return true;
  });
}

/**
 * Computes KPI metrics from a leads array.
 * @param {object[]} leads
 * @param {object[]} stages - pipeline stage definitions
 * @returns {{ pipelineValue: number, conversionRate: number, activeDeals: number, perStage: object[], recentActivity: object[] }}
 */
export function computeKPIs(leads, stages) {
  if (!leads.length) {
    return {
      pipelineValue: 0,
      conversionRate: 0,
      activeDeals: 0,
      perStage: stages.map((s) => ({ stage: s.id, label: s.label, count: 0, value: 0 })),
      recentActivity: [],
    };
  }

  const isClosed = (stage) => CLOSED_STAGES.includes(stage);

  const pipelineValue = leads
    .filter((l) => !isClosed(l.stage))
    .reduce((sum, l) => sum + (l.dealValue || 0), 0);

  const closedCount = leads.filter((l) => isClosed(l.stage)).length;
  const conversionRate = leads.length > 0 ? closedCount / leads.length : 0;

  const activeDeals = leads.filter((l) => !isClosed(l.stage)).length;

  const perStage = stages.map((s) => {
    const stageLeads = leads.filter((l) => l.stage === s.id);
    return {
      stage: s.id,
      label: s.label,
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0),
    };
  });

  const recentActivity = leads
    .flatMap((l) => l.activities.map((a) => ({ ...a, leadId: l.id, leadName: l.name })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  return { pipelineValue, conversionRate, activeDeals, perStage, recentActivity };
}
