import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLead, validateLead, addActivity } from '../../shared/leadSchema.js';

// ---------------------------------------------------------------------------
// Unit tests for leadSchema helpers (createLead, validateLead, addActivity)
// ---------------------------------------------------------------------------

describe('createLead', () => {
  it('returns a lead with a uuid id', () => {
    const lead = createLead('immobilien');
    expect(typeof lead.id).toBe('string');
    expect(lead.id.length).toBeGreaterThan(0);
    // UUID v4 format check
    expect(lead.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('sets brokerType correctly', () => {
    expect(createLead('immobilien').brokerType).toBe('immobilien');
    expect(createLead('krypto').brokerType).toBe('krypto');
  });

  it('sets stage to first pipeline stage for immobilien (anfrage)', () => {
    const lead = createLead('immobilien');
    expect(lead.stage).toBe('anfrage');
    expect(lead.stageOrder).toBe(0);
  });

  it('sets stage to first pipeline stage for versicherung (kontakt)', () => {
    expect(createLead('versicherung').stage).toBe('kontakt');
  });

  it('sets stage to first pipeline stage for finanz (kontakt)', () => {
    expect(createLead('finanz').stage).toBe('kontakt');
  });

  it('sets stage to first pipeline stage for krypto (interesse)', () => {
    expect(createLead('krypto').stage).toBe('interesse');
  });

  it('sets stage to first pipeline stage for investment (akquise)', () => {
    expect(createLead('investment').stage).toBe('akquise');
  });

  it('has empty contact fields', () => {
    const lead = createLead('immobilien');
    expect(lead.name).toBe('');
    expect(lead.email).toBe('');
    expect(lead.phone).toBe('');
    expect(lead.company).toBe('');
  });

  it('has empty customFields object', () => {
    const lead = createLead('immobilien');
    expect(lead.customFields).toEqual({});
  });

  it('has one "created" activity entry', () => {
    const lead = createLead('immobilien');
    expect(lead.activities).toHaveLength(1);
    expect(lead.activities[0].type).toBe('created');
    expect(typeof lead.activities[0].id).toBe('string');
    expect(typeof lead.activities[0].timestamp).toBe('string');
  });

  it('has createdAt and updatedAt timestamps', () => {
    const lead = createLead('immobilien');
    expect(typeof lead.createdAt).toBe('string');
    expect(typeof lead.updatedAt).toBe('string');
    // Should be valid ISO dates
    expect(new Date(lead.createdAt).toISOString()).toBe(lead.createdAt);
  });

  it('has default priority, empty tags, empty notes, null dealValue', () => {
    const lead = createLead('immobilien');
    expect(lead.priority).toBe('medium');
    expect(lead.tags).toEqual([]);
    expect(lead.notes).toBe('');
    expect(lead.dealValue).toBeNull();
    expect(lead.budget).toBeNull();
  });
});

describe('validateLead', () => {
  it('rejects missing name', () => {
    const lead = createLead('immobilien');
    lead.name = '';
    const result = validateLead(lead);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects name > 200 chars', () => {
    const lead = createLead('immobilien');
    lead.name = 'A'.repeat(201);
    const result = validateLead(lead);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('name') || e.includes('Name'))).toBe(true);
  });

  it('rejects notes > 5000 chars', () => {
    const lead = createLead('immobilien');
    lead.name = 'Valid Name';
    lead.notes = 'X'.repeat(5001);
    const result = validateLead(lead);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('notes') || e.includes('Notizen'))).toBe(true);
  });

  it('accepts a valid lead', () => {
    const lead = createLead('immobilien');
    lead.name = 'Valid Name';
    const result = validateLead(lead);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid brokerType', () => {
    const lead = createLead('immobilien');
    lead.name = 'Test';
    lead.brokerType = 'invalid';
    const result = validateLead(lead);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid stage for the broker type', () => {
    const lead = createLead('immobilien');
    lead.name = 'Test';
    lead.stage = 'kyc'; // krypto stage, not immobilien
    const result = validateLead(lead);
    expect(result.valid).toBe(false);
  });
});

describe('addActivity', () => {
  it('appends an activity with id, type, timestamp, description, metadata', () => {
    let lead = createLead('immobilien');
    lead = addActivity(lead, 'note', 'Added a note', { content: 'hello' });
    expect(lead.activities).toHaveLength(2); // 'created' + 'note'
    const last = lead.activities[lead.activities.length - 1];
    expect(last.type).toBe('note');
    expect(last.description).toBe('Added a note');
    expect(last.metadata).toEqual({ content: 'hello' });
    expect(typeof last.id).toBe('string');
    expect(typeof last.timestamp).toBe('string');
  });

  it('caps activities at 100 entries, trimming oldest', () => {
    let lead = createLead('immobilien');
    // Already has 1 activity from creation
    for (let i = 0; i < 100; i++) {
      lead = addActivity(lead, 'note', `Note ${i}`);
    }
    expect(lead.activities.length).toBe(100);
    // The oldest entry (the 'created' one) should have been trimmed
    expect(lead.activities[0].type).toBe('note');
  });

  it('does not mutate the original lead', () => {
    const lead = createLead('immobilien');
    const updated = addActivity(lead, 'note', 'test');
    expect(lead.activities).toHaveLength(1);
    expect(updated.activities).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// leadStore — Zustand store with IndexedDB persistence
// ---------------------------------------------------------------------------

// Mock storageAdapter before importing leadStore
vi.mock('../../client/src/services/storage.js', () => {
  let store = {};
  return {
    storageAdapter: {
      getAll: vi.fn(async () => Object.values(store)),
      get: vi.fn(async (_, key) => store[key] || undefined),
      put: vi.fn(async (_, value) => { store[value.id] = value; }),
      delete: vi.fn(async (_, key) => { delete store[key]; }),
      clear: vi.fn(async () => { store = {}; }),
      __reset: () => { store = {}; },
      __getStore: () => store,
    },
  };
});

// Import after mock is set up
const { useLeadStore } = await import('../../client/src/stores/leadStore.js');
const { storageAdapter } = await import('../../client/src/services/storage.js');

describe('useLeadStore', () => {
  beforeEach(() => {
    storageAdapter.__reset();
    vi.clearAllMocks();
    useLeadStore.setState({ leads: [], loading: true });
  });

  describe('init', () => {
    it('loads leads from IndexedDB and sets loading=false', async () => {
      const mockLead = { id: 'test-1', name: 'Test', brokerType: 'immobilien', stage: 'anfrage' };
      storageAdapter.__getStore()['test-1'] = mockLead;

      await useLeadStore.getState().init();

      const state = useLeadStore.getState();
      expect(state.loading).toBe(false);
      expect(state.leads).toHaveLength(1);
      expect(state.leads[0].id).toBe('test-1');
      expect(storageAdapter.getAll).toHaveBeenCalledWith('leads');
    });
  });

  describe('addLead', () => {
    it('creates lead via createLead, persists, and adds to state', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'New Lead' });

      const state = useLeadStore.getState();
      expect(state.leads).toHaveLength(1);
      expect(state.leads[0].name).toBe('New Lead');
      expect(state.leads[0].brokerType).toBe('immobilien');
      expect(state.leads[0].stage).toBe('anfrage');
      expect(storageAdapter.put).toHaveBeenCalledWith('leads', expect.objectContaining({ name: 'New Lead' }));
    });
  });

  describe('updateLead', () => {
    it('merges updates, persists, updates state, adds edit activity', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'Original' });
      const id = useLeadStore.getState().leads[0].id;

      await useLeadStore.getState().updateLead(id, { name: 'Updated' });

      const lead = useLeadStore.getState().leads[0];
      expect(lead.name).toBe('Updated');
      // Should have 'created' + 'edit' activities
      expect(lead.activities.some((a) => a.type === 'edit')).toBe(true);
      expect(storageAdapter.put).toHaveBeenCalled();
    });
  });

  describe('deleteLead', () => {
    it('removes from IndexedDB and state', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'To Delete' });
      const id = useLeadStore.getState().leads[0].id;

      await useLeadStore.getState().deleteLead(id);

      expect(useLeadStore.getState().leads).toHaveLength(0);
      expect(storageAdapter.delete).toHaveBeenCalledWith('leads', id);
    });
  });

  describe('moveLead', () => {
    it('updates stage, adds stage_change activity with from/to metadata, persists', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'Mover' });
      const id = useLeadStore.getState().leads[0].id;

      await useLeadStore.getState().moveLead(id, 'besichtigung');

      const lead = useLeadStore.getState().leads[0];
      expect(lead.stage).toBe('besichtigung');
      const stageActivity = lead.activities.find((a) => a.type === 'stage_change');
      expect(stageActivity).toBeDefined();
      expect(stageActivity.metadata.from).toBe('anfrage');
      expect(stageActivity.metadata.to).toBe('besichtigung');
    });
  });

  describe('addNote', () => {
    it('adds note activity, persists', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'Note Target' });
      const id = useLeadStore.getState().leads[0].id;

      await useLeadStore.getState().addNote(id, 'This is a note');

      const lead = useLeadStore.getState().leads[0];
      const noteActivity = lead.activities.find((a) => a.type === 'note');
      expect(noteActivity).toBeDefined();
      expect(noteActivity.metadata.content).toBe('This is a note');
    });
  });

  describe('getLeadsByStage', () => {
    it('returns filtered leads by brokerType and stage', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'A' });
      await useLeadStore.getState().addLead('immobilien', { name: 'B' });
      await useLeadStore.getState().addLead('krypto', { name: 'C' });

      const result = useLeadStore.getState().getLeadsByStage('immobilien', 'anfrage');
      expect(result).toHaveLength(2);
    });
  });

  describe('getFilteredLeads', () => {
    it('delegates to filterLeads', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'Alice' });
      await useLeadStore.getState().addLead('krypto', { name: 'Bob' });

      const result = useLeadStore.getState().getFilteredLeads({ brokerType: 'immobilien' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('getKPIs', () => {
    it('delegates to computeKPIs', async () => {
      await useLeadStore.getState().addLead('immobilien', { name: 'Deal', dealValue: 50000 });

      const stages = [
        { id: 'anfrage', label: 'Anfrage', order: 0 },
        { id: 'abgeschlossen', label: 'Abgeschlossen', order: 5 },
      ];
      const kpis = useLeadStore.getState().getKPIs('immobilien', stages);
      expect(kpis.pipelineValue).toBe(50000);
      expect(kpis.activeDeals).toBe(1);
    });
  });
});
