# Phase 5 Research: AI Agents

**Researched:** 2026-04-08
**Confidence:** HIGH (all building blocks exist in codebase)

## Architecture Decision: Direct Agent Orchestration (No LangGraph in v1)

The ROADMAP mentions LangGraph for multi-agent orchestration, but Phase 5 scope is three independent agents triggered individually (not a chained pipeline). LangGraph adds ~500KB of dependencies and complexity for a pattern that is simply: build system prompt + inject data + call AI proxy + validate output with Zod.

**Decision:** Use the existing `relayAIRequest()` from `server/services/aiProxy.js` directly. Each agent is a plain function that:
1. Gathers context data (lead data, market data via existing services)
2. Builds a German system prompt with structured output instructions
3. Calls `relayAIRequest()` with the user's BYOK key
4. Parses and validates the response with Zod

LangGraph becomes relevant in v2 when AGT-05/06/07 and ORCH-01/02/03 require chained multi-agent pipelines. This approach avoids premature abstraction while delivering all v1 agent requirements.

## SSE Streaming Pattern

The existing `aiProxy.js` uses `response.json()` (non-streaming). For SSE streaming (UI-04), the agent route needs:

1. **SSE endpoint:** `GET /api/agents/stream/:runId` — client connects via EventSource
2. **Agent trigger:** `POST /api/agents/run` — starts agent, returns `runId`, emits SSE events as steps complete
3. **Event types:**
   - `agent:start` — agent name, lead info
   - `agent:enriching` — data enrichment step (market data fetch)
   - `agent:thinking` — AI model called, waiting for response
   - `agent:result` — structured output (Zod-validated)
   - `agent:error` — error details
   - `agent:done` — final completion

SSE is chosen over WebSocket because: simpler API, auto-reconnect built into EventSource, sufficient for unidirectional server-to-client streaming, and no additional dependencies needed.

## Agent Output Schemas (Zod v4)

### Lead Qualifier (AGT-01)
```javascript
z.object({
  score: z.number().min(0).max(100),
  kategorie: z.enum(['heiss', 'warm', 'kalt', 'unqualifiziert']),
  zusammenfassung: z.string(),
  begruendung: z.array(z.object({
    faktor: z.string(),
    bewertung: z.enum(['positiv', 'neutral', 'negativ']),
    details: z.string(),
  })),
  empfohleneAktionen: z.array(z.string()),
  naechsterSchritt: z.string(),
})
```

### Market Analyst (AGT-02)
```javascript
z.object({
  symbol: z.string(),
  assetName: z.string(),
  assetType: z.enum(['aktie', 'krypto', 'immobilie']),
  marktdaten: z.object({
    preis: z.number(),
    veraenderung24h: z.number().optional(),
    marktkapitalisierung: z.number().optional(),
    kgv: z.number().optional(),
  }),
  analyse: z.string(),
  empfehlung: z.enum(['kaufen', 'halten', 'verkaufen']),
  konfidenz: z.enum(['hoch', 'mittel', 'niedrig']),
  risiken: z.array(z.string()),
  chancen: z.array(z.string()),
})
```

### SWOT Strategist (AGT-03)
```javascript
z.object({
  titel: z.string(),
  zusammenfassung: z.string(),
  staerken: z.array(z.object({ punkt: z.string(), details: z.string() })),
  schwaechen: z.array(z.object({ punkt: z.string(), details: z.string() })),
  chancen: z.array(z.object({ punkt: z.string(), details: z.string() })),
  risiken: z.array(z.object({ punkt: z.string(), details: z.string() })),
  handlungsempfehlung: z.string(),
})
```

## German System Prompt Strategy (AGT-04)

Each agent gets a German system prompt with:
1. **Role definition** in German financial terminology
2. **DACH market context** (EUR, German regulatory references, local market conventions)
3. **Output format instructions** with JSON schema description embedded in the prompt
4. **Financial glossary** appended to system prompt (e.g., KGV=Kurs-Gewinn-Verhaeltnis, EBIT, Rendite, Volatilitaet)

The system prompts instruct the AI to always respond in German and output valid JSON matching the schema. The response content is extracted via regex/JSON.parse and validated with Zod.

## Data Enrichment Strategy

- **Lead Qualifier:** Uses lead data from request body (no external API call needed)
- **Market Analyst:** Calls existing `getQuote()` from `server/services/yahooFinance.js` and/or `getCryptoMarkets()` from `server/services/coinGecko.js` to inject live data into the prompt
- **SWOT Strategist:** Uses lead data + optional market data from request body

## Frontend SSE Hook Pattern

```javascript
// useAgentStream.js
function useAgentStream() {
  // Returns: { triggerAgent, events, isStreaming, result, error }
  // Uses EventSource API to connect to /api/agents/stream/:runId
  // Stores results in agentStore for persistence
}
```

## Sources

- Existing codebase: `server/services/aiProxy.js`, `server/routes/ai.js`, `shared/aiProviders.js`
- Existing codebase: `server/services/yahooFinance.js`, `server/services/coinGecko.js`
- Existing codebase: `client/src/hooks/useAIRequest.js`, `client/src/stores/aiStore.js`
- MDN EventSource API: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- Zod v4 documentation (already in project dependencies)

---
*Research for Phase 5: AI Agents (BrokerPilot)*
