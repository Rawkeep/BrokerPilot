import { describe, it, expect } from 'vitest';
import { filterLeads, computeKPIs } from '../../shared/leadSchema.js';

// ---------------------------------------------------------------------------
// Helper: build a minimal lead for testing
// ---------------------------------------------------------------------------
function makeLead(overrides = {}) {
  return {
    id: overrides.id || 'lead-1',
    brokerType: 'immobilien',
    stage: 'anfrage',
    stageOrder: 0,
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: null,
    company: 'Muster GmbH',
    dealValue: 100000,
    budget: null,
    tags: [],
    notes: '',
    priority: 'medium',
    customFields: {},
    activities: [],
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// filterLeads
// ---------------------------------------------------------------------------
describe('filterLeads', () => {
  const leads = [
    makeLead({ id: '1', brokerType: 'immobilien', stage: 'anfrage', name: 'Alice', email: 'alice@test.de', company: 'AlphaCorp', tags: ['vip'], priority: 'high', createdAt: '2026-03-01T00:00:00.000Z' }),
    makeLead({ id: '2', brokerType: 'krypto', stage: 'kyc', name: 'Bob', email: 'bob@test.de', company: 'BetaCo', tags: ['cold'], priority: 'low', createdAt: '2026-04-01T00:00:00.000Z' }),
    makeLead({ id: '3', brokerType: 'immobilien', stage: 'besichtigung', name: 'Charlie', email: 'charlie@test.de', company: null, tags: ['vip', 'warm'], priority: 'medium', createdAt: '2026-04-05T00:00:00.000Z' }),
  ];

  it('returns all leads when filters are empty', () => {
    expect(filterLeads(leads, {})).toHaveLength(3);
  });

  it('filters by brokerType', () => {
    const result = filterLeads(leads, { brokerType: 'immobilien' });
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.brokerType === 'immobilien')).toBe(true);
  });

  it('filters by stage', () => {
    const result = filterLeads(leads, { stage: 'kyc' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by search text (case-insensitive, searches name+email+company+notes)', () => {
    expect(filterLeads(leads, { search: 'alice' })).toHaveLength(1);
    expect(filterLeads(leads, { search: 'BETACO' })).toHaveLength(1);
    expect(filterLeads(leads, { search: 'test.de' })).toHaveLength(3);
  });

  it('filters by tags (any match)', () => {
    expect(filterLeads(leads, { tags: ['vip'] })).toHaveLength(2);
    expect(filterLeads(leads, { tags: ['cold'] })).toHaveLength(1);
    expect(filterLeads(leads, { tags: ['vip', 'cold'] })).toHaveLength(3);
  });

  it('filters by dateFrom', () => {
    const result = filterLeads(leads, { dateFrom: '2026-04-01T00:00:00.000Z' });
    expect(result).toHaveLength(2);
  });

  it('filters by dateTo', () => {
    const result = filterLeads(leads, { dateTo: '2026-03-31T23:59:59.999Z' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by priority', () => {
    expect(filterLeads(leads, { priority: 'high' })).toHaveLength(1);
    expect(filterLeads(leads, { priority: 'low' })).toHaveLength(1);
  });

  it('combines multiple filters', () => {
    const result = filterLeads(leads, { brokerType: 'immobilien', tags: ['vip'] });
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// computeKPIs
// ---------------------------------------------------------------------------
describe('computeKPIs', () => {
  const stages = [
    { id: 'anfrage', label: 'Anfrage', order: 0 },
    { id: 'besichtigung', label: 'Besichtigung', order: 1 },
    { id: 'abgeschlossen', label: 'Abgeschlossen', order: 2 },
  ];

  it('returns zeros for empty leads', () => {
    const kpis = computeKPIs([], stages);
    expect(kpis.pipelineValue).toBe(0);
    expect(kpis.conversionRate).toBe(0);
    expect(kpis.activeDeals).toBe(0);
    expect(kpis.recentActivity).toHaveLength(0);
  });

  it('pipelineValue sums dealValue of non-closed leads', () => {
    const leads = [
      makeLead({ id: '1', stage: 'anfrage', dealValue: 50000 }),
      makeLead({ id: '2', stage: 'besichtigung', dealValue: 80000 }),
      makeLead({ id: '3', stage: 'abgeschlossen', dealValue: 120000 }),
    ];
    const kpis = computeKPIs(leads, stages);
    expect(kpis.pipelineValue).toBe(130000);
  });

  it('conversionRate = closed / total', () => {
    const leads = [
      makeLead({ id: '1', stage: 'anfrage' }),
      makeLead({ id: '2', stage: 'abgeschlossen' }),
      makeLead({ id: '3', stage: 'abgeschlossen' }),
      makeLead({ id: '4', stage: 'besichtigung' }),
    ];
    const kpis = computeKPIs(leads, stages);
    expect(kpis.conversionRate).toBe(0.5);
  });

  it('activeDeals counts non-closed leads', () => {
    const leads = [
      makeLead({ id: '1', stage: 'anfrage' }),
      makeLead({ id: '2', stage: 'abgeschlossen' }),
    ];
    const kpis = computeKPIs(leads, stages);
    expect(kpis.activeDeals).toBe(1);
  });

  it('perStage returns correct counts and values per stage', () => {
    const leads = [
      makeLead({ id: '1', stage: 'anfrage', dealValue: 10000 }),
      makeLead({ id: '2', stage: 'anfrage', dealValue: 20000 }),
      makeLead({ id: '3', stage: 'besichtigung', dealValue: 50000 }),
    ];
    const kpis = computeKPIs(leads, stages);
    expect(kpis.perStage).toHaveLength(3);
    const anfrage = kpis.perStage.find((s) => s.stage === 'anfrage');
    expect(anfrage.count).toBe(2);
    expect(anfrage.value).toBe(30000);
    const besichtigung = kpis.perStage.find((s) => s.stage === 'besichtigung');
    expect(besichtigung.count).toBe(1);
    expect(besichtigung.value).toBe(50000);
  });

  it('recentActivity returns last 20 events sorted newest-first', () => {
    const leads = [
      makeLead({
        id: '1',
        name: 'A',
        activities: [
          { id: 'a1', type: 'created', timestamp: '2026-04-01T10:00:00.000Z', description: 'Created', metadata: {} },
          { id: 'a2', type: 'note', timestamp: '2026-04-03T10:00:00.000Z', description: 'Note added', metadata: {} },
        ],
      }),
      makeLead({
        id: '2',
        name: 'B',
        activities: [
          { id: 'b1', type: 'created', timestamp: '2026-04-02T10:00:00.000Z', description: 'Created', metadata: {} },
        ],
      }),
    ];
    const kpis = computeKPIs(leads, stages);
    expect(kpis.recentActivity).toHaveLength(3);
    expect(kpis.recentActivity[0].id).toBe('a2'); // newest
    expect(kpis.recentActivity[0].leadId).toBe('1');
    expect(kpis.recentActivity[0].leadName).toBe('A');
  });

  it('handles investment broker closing stage', () => {
    const investStages = [
      { id: 'akquise', label: 'Akquise', order: 0 },
      { id: 'closing', label: 'Closing', order: 1 },
    ];
    const leads = [
      makeLead({ id: '1', stage: 'akquise', dealValue: 100000 }),
      makeLead({ id: '2', stage: 'closing', dealValue: 200000 }),
    ];
    const kpis = computeKPIs(leads, investStages);
    expect(kpis.pipelineValue).toBe(100000);
    expect(kpis.conversionRate).toBe(0.5);
    expect(kpis.activeDeals).toBe(1);
  });
});
