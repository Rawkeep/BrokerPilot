import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks
const { mockRelayAIRequest, mockEnrichData } = vi.hoisted(() => ({
  mockRelayAIRequest: vi.fn(),
  mockEnrichData: vi.fn(),
}));

vi.mock('../../server/services/aiProxy.js', () => ({
  relayAIRequest: mockRelayAIRequest,
}));

vi.mock('../../server/services/yahooFinance.js', () => ({
  getQuote: vi.fn(),
}));

vi.mock('../../server/services/coinGecko.js', () => ({
  getCryptoMarkets: vi.fn(),
}));

// Mock marketAnalyst.enrichData specifically
vi.mock('../../server/agents/marketAnalyst.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    enrichData: mockEnrichData,
  };
});

import { runPipeline } from '../../server/pipeline/pipelineGraph.js';
import { PIPELINE_STEPS, createInitialState } from '../../server/pipeline/pipelineState.js';

// --- Canned AI Responses ---

const validQualifierOutput = {
  score: 85,
  kategorie: 'heiss',
  zusammenfassung: 'Sehr guter Lead mit hohem Budget.',
  begruendung: [{ faktor: 'Budget', bewertung: 'positiv', details: 'Hohes Budget vorhanden' }],
  empfohleneAktionen: ['Sofort kontaktieren'],
  naechsterSchritt: 'Termin vereinbaren',
};

const validAnalystOutput = {
  symbol: 'AAPL',
  assetName: 'Apple Inc.',
  assetType: 'aktie',
  marktdaten: { preis: 178.72, veraenderung24h: 1.33, marktkapitalisierung: 2800000000000, kgv: 29.5 },
  analyse: 'Starke Fundamentaldaten.',
  empfehlung: 'kaufen',
  konfidenz: 'hoch',
  risiken: ['Hohe Bewertung'],
  chancen: ['KI-Wachstum'],
};

const validSwotOutput = {
  titel: 'SWOT-Analyse fuer Test Lead',
  zusammenfassung: 'Umfassende Analyse.',
  staerken: [{ punkt: 'Starkes Budget', details: 'Budget ueber Durchschnitt' }],
  schwaechen: [{ punkt: 'Keine Historie', details: 'Neuer Kontakt' }],
  chancen: [{ punkt: 'Marktwachstum', details: 'Sektor waechst' }],
  risiken: [{ punkt: 'Wettbewerb', details: 'Viele Konkurrenten' }],
  handlungsempfehlung: 'Schnell handeln.',
};

const enrichedMarketData = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  preis: 178.72,
  veraenderung: 2.35,
  veraenderungProzent: 1.33,
  volumen: 55123456,
  marktkapitalisierung: 2800000000000,
  kgv: 29.5,
  hoch52: 199.62,
  tief52: 124.17,
  waehrung: 'USD',
};

const leadData = {
  name: 'Test Lead',
  email: 'test@example.com',
  company: 'Test GmbH',
  dealValue: 250000,
  budget: 300000,
  stage: 'qualification',
  customFields: { symbol: 'AAPL', assetType: 'aktie' },
};

const brokerType = 'immobilien';

const aiConfig = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test-key' };

// --- Helper: set up all mocks to succeed ---

function mockAllSuccess() {
  let callCount = 0;
  mockRelayAIRequest.mockImplementation(() => {
    callCount++;
    const outputs = [validQualifierOutput, validAnalystOutput, validSwotOutput];
    return Promise.resolve({
      content: JSON.stringify(outputs[callCount - 1]),
      model: 'gpt-4o-mini',
      provider: 'openai',
      usage: { inputTokens: 500, outputTokens: 300 },
    });
  });

  mockEnrichData.mockResolvedValue(enrichedMarketData);
}

// --- Tests ---

describe('pipelineState', () => {
  it('PIPELINE_STEPS contains qualifier, analyst, swot in order', () => {
    expect(PIPELINE_STEPS).toEqual(['qualifier', 'analyst', 'swot']);
  });

  it('createInitialState returns correct shape', () => {
    const state = createInitialState(leadData, brokerType, aiConfig);

    expect(state.leadData).toBe(leadData);
    expect(state.brokerType).toBe(brokerType);
    expect(state.aiConfig).toBe(aiConfig);
    expect(state.qualifierResult).toBeNull();
    expect(state.analystResult).toBeNull();
    expect(state.swotResult).toBeNull();
    expect(state.completedSteps).toEqual([]);
    expect(state.failedSteps).toEqual([]);
    expect(state.isPartial).toBe(false);
  });
});

describe('pipelineGraph.runPipeline', () => {
  let emittedEvents;
  let emit;

  beforeEach(() => {
    vi.clearAllMocks();
    emittedEvents = [];
    emit = (event, data) => emittedEvents.push({ event, data });
  });

  // --- Test 1: Graph returns an executable pipeline ---

  it('runPipeline returns a result object with invoke-like interface', async () => {
    mockAllSuccess();

    const result = await runPipeline(leadData, brokerType, aiConfig, emit);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('qualifierResult');
    expect(result).toHaveProperty('analystResult');
    expect(result).toHaveProperty('swotResult');
    expect(result).toHaveProperty('completedSteps');
    expect(result).toHaveProperty('failedSteps');
    expect(result).toHaveProperty('isPartial');
  });

  // --- Test 2: All 3 steps execute in order with results ---

  it('executes all 3 steps in order and returns results for each', async () => {
    mockAllSuccess();

    const result = await runPipeline(leadData, brokerType, aiConfig, emit);

    // All steps completed
    expect(result.completedSteps).toEqual(['qualifier', 'analyst', 'swot']);
    expect(result.failedSteps).toEqual([]);
    expect(result.isPartial).toBe(false);

    // Each result populated
    expect(result.qualifierResult.score).toBe(85);
    expect(result.qualifierResult.kategorie).toBe('heiss');
    expect(result.analystResult.symbol).toBe('AAPL');
    expect(result.analystResult.empfehlung).toBe('kaufen');
    expect(result.swotResult.titel).toBe('SWOT-Analyse fuer Test Lead');

    // relayAIRequest called 3 times (once per agent)
    expect(mockRelayAIRequest).toHaveBeenCalledTimes(3);

    // enrichData called once (analyst step only)
    expect(mockEnrichData).toHaveBeenCalledTimes(1);
  });

  // --- Test 3: Qualifier fails, pipeline continues ---

  it('when qualifier agent throws, pipeline continues with partial results', async () => {
    let callCount = 0;
    mockRelayAIRequest.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Qualifier AI timeout'));
      }
      const outputs = [null, validAnalystOutput, validSwotOutput];
      return Promise.resolve({
        content: JSON.stringify(outputs[callCount - 1]),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });
    });

    mockEnrichData.mockResolvedValue(enrichedMarketData);

    const result = await runPipeline(leadData, brokerType, aiConfig, emit);

    // Qualifier failed, others succeeded
    expect(result.failedSteps).toContain('qualifier');
    expect(result.completedSteps).toContain('analyst');
    expect(result.completedSteps).toContain('swot');
    expect(result.isPartial).toBe(true);

    // Qualifier result is null, others populated
    expect(result.qualifierResult).toBeNull();
    expect(result.analystResult).not.toBeNull();
    expect(result.swotResult).not.toBeNull();
  });

  // --- Test 4: ALL agents fail, pipeline returns with all in failedSteps ---

  it('when ALL agents fail, returns all 3 in failedSteps with isPartial true', async () => {
    mockRelayAIRequest.mockRejectedValue(new Error('Provider down'));
    mockEnrichData.mockRejectedValue(new Error('Enrichment failed'));

    const result = await runPipeline(leadData, brokerType, aiConfig, emit);

    expect(result.failedSteps).toEqual(['qualifier', 'analyst', 'swot']);
    expect(result.completedSteps).toEqual([]);
    expect(result.isPartial).toBe(true);
    expect(result.qualifierResult).toBeNull();
    expect(result.analystResult).toBeNull();
    expect(result.swotResult).toBeNull();

    // Pipeline did NOT throw
  });

  // --- Test 5: Events emitted in correct order ---

  it('emits SSE events in correct order: start, step:start/done for each, done', async () => {
    mockAllSuccess();

    await runPipeline(leadData, brokerType, aiConfig, emit);

    const eventNames = emittedEvents.map((e) => e.event);

    // First event is pipeline:start
    expect(eventNames[0]).toBe('pipeline:start');
    expect(emittedEvents[0].data.steps).toEqual(['qualifier', 'analyst', 'swot']);

    // Last event is pipeline:done
    expect(eventNames[eventNames.length - 1]).toBe('pipeline:done');

    // Check step ordering — each step has start then done
    const qualStartIdx = eventNames.indexOf('pipeline:step:start');
    const qualDoneIdx = eventNames.indexOf('pipeline:step:done');
    expect(qualStartIdx).toBeLessThan(qualDoneIdx);
    expect(emittedEvents[qualStartIdx].data.step).toBe('qualifier');

    // Qualifier before analyst before swot
    const stepStartEvents = emittedEvents.filter((e) => e.event === 'pipeline:step:start');
    expect(stepStartEvents.map((e) => e.data.step)).toEqual(['qualifier', 'analyst', 'swot']);

    const stepDoneEvents = emittedEvents.filter((e) => e.event === 'pipeline:step:done');
    expect(stepDoneEvents.map((e) => e.data.step)).toEqual(['qualifier', 'analyst', 'swot']);

    // Thinking events are interspersed
    expect(eventNames).toContain('agent:thinking');

    // Enriching event from analyst step
    expect(eventNames).toContain('agent:enriching');
  });

  // --- Test 5b: Error events emitted for failed steps ---

  it('emits pipeline:step:error for failed steps and pipeline:step:done for successful ones', async () => {
    let callCount = 0;
    mockRelayAIRequest.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Qualifier failed'));
      }
      const outputs = [null, validAnalystOutput, validSwotOutput];
      return Promise.resolve({
        content: JSON.stringify(outputs[callCount - 1]),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });
    });

    mockEnrichData.mockResolvedValue(enrichedMarketData);

    await runPipeline(leadData, brokerType, aiConfig, emit);

    const errorEvents = emittedEvents.filter((e) => e.event === 'pipeline:step:error');
    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0].data.step).toBe('qualifier');
    expect(errorEvents[0].data.error).toBe('Qualifier failed');

    const doneEvents = emittedEvents.filter((e) => e.event === 'pipeline:step:done');
    expect(doneEvents).toHaveLength(2);
    expect(doneEvents.map((e) => e.data.step)).toEqual(['analyst', 'swot']);
  });

  // --- Test 6: SWOT receives qualifier and analyst results as context ---

  it('SWOT agent receives qualifier and analyst results as context', async () => {
    mockAllSuccess();

    // Spy on the 3rd relayAIRequest call to inspect the SWOT prompt
    await runPipeline(leadData, brokerType, aiConfig, emit);

    // The 3rd call to relayAIRequest is the SWOT call
    const swotCall = mockRelayAIRequest.mock.calls[2];
    expect(swotCall).toBeDefined();

    // The messages array (3rd arg) should contain context with prior results
    const messages = swotCall[2]; // [provider, model, messages, apiKey]
    const userMessage = messages.find((m) => m.role === 'user');
    expect(userMessage).toBeDefined();

    // The user message should contain qualifierResult and analystResult context
    expect(userMessage.content).toContain('qualifierResult');
    expect(userMessage.content).toContain('analystResult');
  });

  // --- Test 6b: SWOT works without context when prior steps failed ---

  it('SWOT works when qualifier and analyst both failed (empty context)', async () => {
    // Qualifier fails at relayAIRequest, Analyst fails at enrichData (before relayAIRequest),
    // so only 2 relayAIRequest calls happen: qualifier (reject) + swot (resolve)
    mockRelayAIRequest
      .mockRejectedValueOnce(new Error('Qualifier failed'))
      .mockResolvedValueOnce({
        content: JSON.stringify(validSwotOutput),
        model: 'gpt-4o-mini',
        provider: 'openai',
      });

    mockEnrichData.mockRejectedValue(new Error('Enrichment failed'));

    const result = await runPipeline(leadData, brokerType, aiConfig, emit);

    expect(result.failedSteps).toContain('qualifier');
    expect(result.failedSteps).toContain('analyst');
    expect(result.completedSteps).toContain('swot');
    expect(result.swotResult).not.toBeNull();
    expect(result.swotResult.titel).toBe('SWOT-Analyse fuer Test Lead');
  });

  // --- Test: apiKey never appears in emitted events ---

  it('never includes apiKey in emitted event data', async () => {
    mockAllSuccess();

    await runPipeline(leadData, brokerType, aiConfig, emit);

    const serialized = JSON.stringify(emittedEvents);
    expect(serialized).not.toContain('sk-test-key');
  });

  // --- Test: pipeline:done includes final result shape ---

  it('pipeline:done event includes complete result shape', async () => {
    mockAllSuccess();

    await runPipeline(leadData, brokerType, aiConfig, emit);

    const doneEvent = emittedEvents.find((e) => e.event === 'pipeline:done');
    expect(doneEvent).toBeDefined();
    expect(doneEvent.data.completedSteps).toEqual(['qualifier', 'analyst', 'swot']);
    expect(doneEvent.data.failedSteps).toEqual([]);
    expect(doneEvent.data.isPartial).toBe(false);
    expect(doneEvent.data.qualifierResult).toBeDefined();
    expect(doneEvent.data.analystResult).toBeDefined();
    expect(doneEvent.data.swotResult).toBeDefined();
  });
});
