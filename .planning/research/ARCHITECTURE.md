# Architecture Research

**Domain:** Multi-Agent AI Broker/Finance Dashboard
**Researched:** 2026-04-08
**Confidence:** HIGH

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │ Dashboard   │  │ Pipeline   │  │ Agent Chat  │  │ Settings /   │     │
│  │ Widgets     │  │ Kanban     │  │ Panel       │  │ BYOK Config  │     │
│  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘     │
│        └────────────────┴────────────────┴────────────────┘              │
│                          React 18 + Zustand                              │
├──────────────────────────────────────────────────────────────────────────┤
│                         CLIENT SERVICE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ useUniversal │  │ useMarket    │  │ usePipeline  │                   │
│  │ AI (BYOK)    │  │ Data         │  │ Manager      │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                  │                           │
│  ┌──────┴─────────────────┴──────────────────┴───────┐                  │
│  │              localStorage Persistence              │                  │
│  └────────────────────────┬──────────────────────────┘                  │
├───────────────────────────┼──────────────────────────────────────────────┤
│                    EXPRESS.JS API GATEWAY                                 │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ /api/agents │  │ /api/market │  │ /api/proxy  │  │ /api/context │   │
│  │ (orchestr.) │  │ (data agg.) │  │ (AI relay)  │  │ (MCP bridge) │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │
├─────────┼────────────────┼────────────────┼────────────────┼────────────┤
│                         AGENT ORCHESTRATION LAYER                        │
│  ┌──────┴──────────────────────────────────┴───────────────┐            │
│  │              LangGraph Supervisor (StateGraph)           │            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │            │
│  │  │ Lead     │ │ Market   │ │ SWOT     │ │ Offer    │   │            │
│  │  │ Scout    │ │ Analyst  │ │ Strategst│ │ Architect│   │            │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │            │
│  │  ┌──────────┐ ┌──────────┐                              │            │
│  │  │ Follow-up│ │ Deal     │                              │            │
│  │  │ Engine   │ │ Closer   │                              │            │
│  │  └──────────┘ └──────────┘                              │            │
│  └─────────────────────┬───────────────────────────────────┘            │
├────────────────────────┼─────────────────────────────────────────────────┤
│                    CONTEXT & DATA LAYER                                   │
│  ┌─────────────┐  ┌────┴────────┐  ┌──────────────────────────────┐     │
│  │ context-mode│  │ AI Provider │  │ Financial Data Providers     │     │
│  │ MCP Server  │  │ APIs (BYOK) │  │ Yahoo Finance, CoinGecko,   │     │
│  │ (sessions)  │  │             │  │ Alpha Vantage, etc.          │     │
│  └─────────────┘  └─────────────┘  └──────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Dashboard Widgets | Broker-type-specific views (crypto, real estate, insurance, etc.) | React components with Glassmorphism styling, Zustand selectors |
| Pipeline Kanban | Lead-to-Deal visual workflow (6 stages) | Drag-and-drop board, localStorage-backed state |
| Agent Chat Panel | User interaction with AI agents, streaming responses | SSE/streaming from Express, rendered with useUniversalAI |
| BYOK Config | API key management, provider selection, freemium gate | Settings panel, encrypted localStorage, usage counter |
| Express API Gateway | Route requests, rate limit, CORS, proxy AI calls server-side | Express.js with helmet, cors, rate-limit (carried from CK) |
| LangGraph Supervisor | Orchestrate 6 specialized agents, manage shared state | StateGraph with supervisor node, conditional edges |
| Specialized Agents | Domain-specific analysis (lead scoring, market data, SWOT, etc.) | LangGraph nodes with tool bindings |
| context-mode MCP | Persist agent session context across interactions (98% compression) | MCP server process, connected via stdio or SSE |
| AI Provider Proxy | Route BYOK requests to correct provider (Anthropic, OpenAI, etc.) | Server-side relay to avoid CORS, reuse CK's provider registry |
| Financial Data Aggregator | Normalize data from multiple free APIs | Express routes that cache and normalize responses |

## Recommended Project Structure

```
brokerpilot/
├── client/                     # React 18 + Vite 6 frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/      # Broker-type dashboard widgets
│   │   │   ├── pipeline/       # Lead-to-Deal Kanban board
│   │   │   ├── agents/         # Agent chat panel, agent status
│   │   │   ├── market/         # Market data views (stocks, crypto, real estate)
│   │   │   ├── settings/       # BYOK config, broker profile setup
│   │   │   └── ui/             # Glassmorphism primitives (Glass, Card, etc.)
│   │   ├── hooks/
│   │   │   ├── useUniversalAI.js    # Ported from CK (6 providers, BYOK)
│   │   │   ├── useMarketData.js     # Financial data fetching + caching
│   │   │   ├── usePipeline.js       # Lead-to-Deal state management
│   │   │   ├── useAgentStream.js    # SSE connection to agent orchestrator
│   │   │   └── useBrokerProfile.js  # Broker type config + permissions
│   │   ├── stores/
│   │   │   ├── pipelineStore.js     # Zustand: leads, deals, stages
│   │   │   ├── marketStore.js       # Zustand: market data cache
│   │   │   ├── agentStore.js        # Zustand: agent state, messages
│   │   │   └── settingsStore.js     # Zustand: BYOK keys, preferences
│   │   ├── services/
│   │   │   ├── api.js               # HTTP client (fetch wrapper)
│   │   │   └── localStorage.js      # Persistence layer abstraction
│   │   ├── types/                   # JSDoc type definitions (or .d.ts)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                     # Express.js backend
│   ├── index.js                # Server entry, middleware stack
│   ├── routes/
│   │   ├── agents.js           # POST /api/agents/run, GET /api/agents/stream
│   │   ├── market.js           # GET /api/market/stocks, /crypto, /realestate
│   │   ├── proxy.js            # POST /api/proxy/ai (BYOK relay)
│   │   └── context.js          # MCP bridge endpoints
│   ├── middleware/
│   │   ├── auth.js             # BYOK key validation (not user auth)
│   │   ├── rateLimit.js        # Freemium gate (5 free/day)
│   │   └── cache.js            # In-memory cache for market data
│   ├── agents/                 # LangGraph agent definitions
│   │   ├── supervisor.js       # Supervisor graph (StateGraph)
│   │   ├── leadScout.js        # Lead qualification agent
│   │   ├── marketAnalyst.js    # Market data analysis agent
│   │   ├── swotStrategist.js   # SWOT analysis agent
│   │   ├── offerArchitect.js   # Offer generation agent
│   │   ├── followUpEngine.js   # Follow-up scheduling agent
│   │   ├── dealCloser.js       # Deal closing agent
│   │   ├── tools/              # LangChain tools (API calls, calculations)
│   │   │   ├── yahooFinance.js
│   │   │   ├── coinGecko.js
│   │   │   └── realEstate.js
│   │   └── state.js            # Shared agent state schema (Annotation)
│   ├── mcp/
│   │   └── contextBridge.js    # context-mode MCP client connection
│   └── services/
│       ├── marketData.js       # Data aggregation + normalization
│       └── aiProxy.js          # Multi-provider AI request routing
├── shared/                     # Shared types and constants
│   ├── brokerTypes.js          # Broker profile definitions
│   ├── pipelineStages.js       # Lead-to-Deal stage definitions
│   └── constants.js
├── Dockerfile
├── docker-compose.yml
├── railway.json
├── package.json
└── vite.config.js
```

### Structure Rationale

- **client/ + server/ monorepo:** Single package.json, Vite proxies to Express in dev. Mirrors CK's proven structure. Simple deployment on Railway.
- **server/agents/:** LangGraph graph definitions are colocated with the Express backend because they run server-side (LLM calls, tool execution). Separating from routes keeps orchestration logic clean.
- **server/agents/tools/:** LangChain tools wrap external API calls. Each financial data provider gets its own tool file for testability and swap-ability.
- **client/hooks/:** Business logic lives in hooks, not components. Hooks consume Zustand stores and call API services. Components stay presentational.
- **client/stores/:** Zustand over Redux -- lighter, less boilerplate, sufficient for this scale. Each domain gets its own store to avoid a monolithic state blob.
- **shared/:** Constants like broker types and pipeline stages are used by both client and server. Avoids duplication.

## Architectural Patterns

### Pattern 1: LangGraph Supervisor with Specialized Worker Agents

**What:** A central supervisor node in a StateGraph receives user requests and delegates to specialized agent nodes. Each agent has its own tools and system prompt. The supervisor reads agent outputs and decides the next step (route to another agent, ask user for input, or return final result).

**When to use:** Always -- this is the core orchestration pattern for the 6-agent system.

**Trade-offs:** More complex than a simple chain, but essential for the lead-to-deal pipeline where different agents need to run in sequence or parallel depending on the request. Supervisor adds one LLM call overhead per routing decision.

**Example:**
```javascript
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';

// Shared state flowing through all agents
const AgentState = Annotation.Root({
  messages: Annotation({ reducer: (a, b) => [...a, ...b] }),
  leadData: Annotation(),
  marketData: Annotation(),
  currentStage: Annotation(),       // pipeline stage
  brokerType: Annotation(),         // immobilien, versicherung, finanz, krypto, investment
  activeTool: Annotation(),
});

// Supervisor decides which agent runs next
function supervisorNode(state) {
  // LLM call: given current state, which agent should handle this?
  // Returns: { next: 'marketAnalyst' | 'swotStrategist' | ... | '__end__' }
}

const graph = new StateGraph(AgentState)
  .addNode('supervisor', supervisorNode)
  .addNode('leadScout', leadScoutNode)
  .addNode('marketAnalyst', marketAnalystNode)
  .addNode('swotStrategist', swotStrategistNode)
  .addNode('offerArchitect', offerArchitectNode)
  .addNode('followUpEngine', followUpEngineNode)
  .addNode('dealCloser', dealCloserNode)
  .addEdge(START, 'supervisor')
  .addConditionalEdges('supervisor', routeToAgent)
  // Each agent routes back to supervisor after completing
  .addEdge('leadScout', 'supervisor')
  .addEdge('marketAnalyst', 'supervisor')
  .addEdge('swotStrategist', 'supervisor')
  .addEdge('offerArchitect', 'supervisor')
  .addEdge('followUpEngine', 'supervisor')
  .addEdge('dealCloser', 'supervisor');

export const pipeline = graph.compile();
```

### Pattern 2: Server-Side AI Proxy (BYOK Relay)

**What:** The client sends the user's API key and provider choice to the Express backend. The backend relays the request to the chosen AI provider, handling CORS restrictions and adding rate limiting. Keys never persist server-side -- they are passed per-request from the client's encrypted localStorage.

**When to use:** For all direct AI chat interactions (non-agent). Agent orchestration uses keys differently (injected into LangGraph config).

**Trade-offs:** Adds network hop but solves CORS (Anthropic blocks browser-direct calls). Also enables server-side usage tracking for the freemium gate.

**Example:**
```javascript
// server/routes/proxy.js
router.post('/ai', freemiumGate, async (req, res) => {
  const { provider, model, messages, apiKey } = req.body;

  // Validate provider exists in registry
  const config = PROVIDER_REGISTRY[provider];
  if (!config) return res.status(400).json({ error: 'Unknown provider' });

  // Relay to provider
  const response = await fetch(`${config.baseUrl}${config.chatPath}`, {
    method: 'POST',
    headers: buildHeaders(config, apiKey),
    body: JSON.stringify({ model, messages }),
  });

  // Stream back to client via SSE
  res.setHeader('Content-Type', 'text/event-stream');
  response.body.pipe(res);
});
```

### Pattern 3: Normalized Market Data Aggregation

**What:** A server-side service layer fetches from multiple financial APIs (Yahoo Finance, CoinGecko, Alpha Vantage), normalizes the responses into a unified schema, caches results in memory (node-cache, 5-min TTL), and serves them through a single `/api/market` endpoint family.

**When to use:** All market data requests. Never call external financial APIs directly from the client.

**Trade-offs:** Server becomes a bottleneck for data freshness (cache lag), but dramatically simplifies the client and avoids exposing API keys for premium data sources.

**Example:**
```javascript
// Unified market data schema
const normalizedAsset = {
  symbol: 'BTC',
  name: 'Bitcoin',
  price: 67432.50,
  change24h: 2.3,
  changePercent24h: 0.034,
  volume24h: 28500000000,
  marketCap: 1320000000000,
  source: 'coingecko',
  assetType: 'crypto',    // 'stock' | 'crypto' | 'realestate'
  updatedAt: '2026-04-08T12:00:00Z',
};
```

## Data Flow

### Lead-to-Deal Pipeline Flow (Primary)

```
[User enters lead info in Pipeline UI]
    |
    v
[usePipeline hook] --> localStorage (persist lead)
    |
    v
[POST /api/agents/run { action: 'qualify', leadData, brokerType }]
    |
    v
[Express route] --> [LangGraph Supervisor]
    |                       |
    |    ┌──────────────────┼──────────────────┐
    |    v                  v                  v
    | [Lead Scout]    [Market Analyst]   [SWOT Strategist]
    | (qualify lead)  (fetch market data) (analyze strengths)
    |    |                  |                  |
    |    └──────────────────┼──────────────────┘
    |                       v
    |              [Offer Architect]
    |              (generate proposal)
    |                       |
    v                       v
[SSE stream] <---- [Supervisor returns result]
    |
    v
[agentStore updates] --> [Pipeline UI re-renders]
    |
    v
[localStorage persists updated lead + agent outputs]
```

### Market Data Flow

```
[Dashboard mounts / polling interval fires]
    |
    v
[useMarketData hook] --> check marketStore cache
    |                         |
    | (cache miss)            | (cache hit)
    v                         v
[GET /api/market/crypto]   [return cached data]
    |
    v
[Express cache middleware] --> check node-cache (5min TTL)
    |                              |
    | (miss)                       | (hit)
    v                              v
[marketData service]          [return cached]
    |
    ├─> CoinGecko API (crypto)
    ├─> Yahoo Finance API (stocks)
    └─> Real estate API (Immobilien)
    |
    v
[Normalize to unified schema] --> cache in node-cache
    |
    v
[JSON response] --> marketStore update --> Dashboard re-renders
```

### BYOK AI Chat Flow

```
[User types in Agent Chat Panel]
    |
    v
[useAgentStream hook] reads settingsStore for { provider, model, apiKey }
    |
    v
[POST /api/proxy/ai { provider, model, messages, apiKey }]
    |
    v
[Express: validate provider, check freemium counter]
    |
    v
[Relay to AI provider API with user's key]
    |
    v
[SSE stream back] --> [useAgentStream processes chunks]
    |
    v
[agentStore.addMessage()] --> [Chat Panel re-renders]
```

### Context Persistence Flow

```
[Agent completes a pipeline step]
    |
    v
[LangGraph checkpoint saves state]
    |
    v
[context-mode MCP client] --> [MCP server process]
    |                              |
    | (compress context 98%)       | (store session)
    v                              v
[Compressed session blob]    [File/memory store]
    |
    v
[Next agent invocation] --> [MCP retrieves context]
    |
    v
[LangGraph resumes with full context at fraction of token cost]
```

### State Management

```
┌──────────────────────────────────────────────────────────┐
│                    Zustand Stores                         │
│                                                          │
│  pipelineStore ──> leads[], deals[], stages              │
│  marketStore ────> assets[], watchlist[], lastFetched     │
│  agentStore ─────> messages[], activeAgent, isStreaming   │
│  settingsStore ──> apiKeys{}, provider, brokerType       │
│                                                          │
│  All stores: subscribe() for reactivity                  │
│  All stores: persist middleware -> localStorage           │
└──────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Lead qualification:** User input --> Supervisor --> Lead Scout (score) --> Market Analyst (context) --> SWOT Strategist (analysis) --> Offer Architect (proposal) --> back to UI. Each step persisted to localStorage and optionally to MCP context.
2. **Market data:** Polling/on-demand --> server cache --> external APIs --> normalized response --> client cache --> reactive UI update.
3. **AI proxy:** Client sends BYOK key per-request --> server relays --> streams response back. Key never stored server-side.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | Current architecture. localStorage per-user, Express monolith, in-memory cache. No changes needed. |
| 100-1k users | Add Redis for server-side market data cache (shared across instances). Add basic session management. Consider PostgreSQL for opt-in cloud sync. |
| 1k-10k users | Extract agent orchestration into separate service. Add queue (BullMQ) for long-running agent pipelines. Move from localStorage to cloud-first persistence. |
| 10k+ users | Microservices split: API gateway, agent service, market data service. Kubernetes. Paid data provider tiers. This is well beyond v1 scope. |

### Scaling Priorities

1. **First bottleneck:** Market data API rate limits. Free tiers (CoinGecko: 10-30 req/min, Yahoo Finance: varies) will hit limits fast. Mitigation: aggressive server-side caching, request deduplication, staggered polling.
2. **Second bottleneck:** LLM costs for agent orchestration. Each lead-to-deal pipeline run involves 4-6 LLM calls (supervisor routing + agent execution). Mitigation: freemium gate, BYOK model, cheaper models for routing decisions (Haiku/GPT-4o-mini for supervisor, user-selected model for content generation).

## Anti-Patterns

### Anti-Pattern 1: Client-Side Agent Orchestration

**What people do:** Run LangGraph/LangChain in the browser to avoid building a backend.
**Why it's wrong:** Exposes all API keys in browser memory, cannot use server-side tools (file I/O, database), LangGraph.js bundles are large, and agent state is lost on tab close.
**Do this instead:** Run LangGraph on the Express backend. Stream results to the client via SSE. Client is a thin presentation layer for agent output.

### Anti-Pattern 2: Monolithic Agent (One Giant Prompt)

**What people do:** Stuff all 6 agent capabilities into a single system prompt with instructions to "act as the appropriate specialist."
**Why it's wrong:** Context pollution -- lead scoring context confuses market analysis. Token waste -- sending everything every time. Impossible to test or improve individual capabilities.
**Do this instead:** Supervisor pattern with dedicated agent nodes. Each agent has a focused system prompt and specific tools. Supervisor routes based on task.

### Anti-Pattern 3: Direct External API Calls from React

**What people do:** Call CoinGecko, Yahoo Finance, etc. directly from React components.
**Why it's wrong:** Exposes API keys (if needed), no caching layer, CORS issues with some providers, every user makes redundant calls for the same data.
**Do this instead:** Server-side data aggregation layer with caching. Single normalized API for the client.

### Anti-Pattern 4: Storing BYOK Keys in Plain Text

**What people do:** Store API keys as plain strings in localStorage.
**Why it's wrong:** XSS vulnerability exposes all provider keys.
**Do this instead:** Encrypt keys in localStorage using a key derived from a user passphrase (or at minimum, obfuscate). Send keys over HTTPS only. Never log or persist keys server-side.

### Anti-Pattern 5: Blocking UI on Agent Pipeline

**What people do:** Await the entire lead-to-deal pipeline (4-6 LLM calls, 30-60 seconds) before showing any result.
**Why it's wrong:** User stares at a spinner for a minute. Feels broken.
**Do this instead:** Stream intermediate results via SSE. Show each agent's output as it completes. Update the pipeline Kanban stage in real-time. Users see progress, not a loading screen.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| CoinGecko API | REST, server-side, 5-min cache | Free tier: 10-30 req/min. Use `/simple/price` and `/coins/markets` endpoints |
| Yahoo Finance | REST via `yahoo-finance2` npm, server-side | Unofficial API, may break. Have fallback (Alpha Vantage) |
| Alpha Vantage | REST, server-side, API key required | Free: 25 req/day. Backup for stocks data |
| Anthropic API | REST, server-side proxy | CORS blocks browser-direct. Must relay through Express |
| OpenAI API | REST, browser-direct possible but proxy preferred | For consistency, route all providers through proxy |
| Google Gemini | REST, browser-direct works | Route through proxy for freemium tracking |
| Mistral API | REST, browser-direct works | Route through proxy for consistency |
| OpenRouter | REST, browser-direct works | Meta-provider, useful as fallback router |
| context-mode MCP | stdio or SSE, server-side only | Runs as child process alongside Express. 98% context compression |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client <-> Express | REST + SSE over HTTP | Vite proxy in dev, same-origin in prod |
| Express routes <-> LangGraph | Direct function calls | Same Node.js process in v1. Extract to queue later |
| LangGraph <-> AI providers | REST via LangChain model wrappers | User's BYOK key injected per-invocation |
| LangGraph <-> Financial tools | Direct function calls (tool nodes) | Tools are thin wrappers around marketData service |
| Express <-> context-mode MCP | MCP client SDK (stdio transport) | MCP server runs as child process, managed by Express lifecycle |
| Zustand stores <-> localStorage | Zustand persist middleware | Automatic sync, configurable serialization |

## Suggested Build Order

Based on dependency analysis, here is the recommended build sequence:

### Phase 1: Foundation (No agents, no LLM)
1. **Project scaffolding** -- Vite + React + Express monorepo, Glassmorphism UI primitives (ported from CK)
2. **Zustand stores + localStorage persistence** -- settingsStore, pipelineStore with persist middleware
3. **BYOK settings UI** -- Provider selection, key management, encrypted storage
4. **Static pipeline Kanban** -- Lead stages, manual drag between stages, CRUD operations

**Rationale:** Everything else depends on the UI shell and state management. Building this first gives a working app to demo even without AI.

### Phase 2: Market Data Layer
4. **Express market data routes** -- `/api/market/crypto`, `/stocks`, cache middleware
5. **Financial API integrations** -- CoinGecko, Yahoo Finance tools with normalization
6. **Dashboard widgets** -- Live prices, charts, watchlists consuming market data
7. **useMarketData hook** -- Polling, cache-aware fetching

**Rationale:** Market data is independent of the agent system. Building it second provides real utility (dashboard) while the more complex agent layer is designed.

### Phase 3: AI Integration (Single agent, no orchestration)
8. **AI proxy route** -- `/api/proxy/ai` with BYOK relay and freemium gate
9. **useUniversalAI port** -- Adapt CK hook for BrokerPilot's API structure
10. **Agent chat panel** -- Streaming AI conversation UI
11. **Freemium gate** -- 5 free requests/day counter in localStorage + server validation

**Rationale:** Prove AI works end-to-end with a simple chat before building the complex multi-agent system.

### Phase 4: Multi-Agent Orchestration
12. **LangGraph supervisor graph** -- StateGraph with supervisor + conditional routing
13. **Specialized agents** -- Lead Scout, Market Analyst, SWOT Strategist, Offer Architect, Follow-up Engine, Deal Closer
14. **Agent tools** -- LangChain tools wrapping financial APIs and data services
15. **SSE streaming** -- Stream agent pipeline progress to client in real-time
16. **Pipeline automation** -- Agents automatically advance leads through stages

**Rationale:** This is the core differentiator. Requires all previous phases: UI (Phase 1), market data (Phase 2), and AI proxy (Phase 3).

### Phase 5: Context Persistence + Polish
17. **context-mode MCP integration** -- Session persistence, context compression
18. **Broker profiles** -- Type-specific dashboards and agent configurations
19. **Cloud sync preparation** -- Abstract localStorage behind a storage interface
20. **German localization pass** -- Full i18n of UI strings

**Rationale:** MCP integration is an enhancement, not a blocker. Broker profiles customize what already works. Cloud sync is future-proofing.

## Sources

- [LangGraph Multi-Agent Architecture Patterns (2026)](https://dev.to/ottoaria/langgraph-in-2026-build-multi-agent-ai-systems-that-actually-work-3h5)
- [LangChain Multi-Agent Documentation](https://docs.langchain.com/oss/python/langchain/multi-agent)
- [LangGraph Supervisor Pattern](https://reference.langchain.com/python/langgraph/supervisor/)
- [Production Multi-Agent Communication with LangGraph](https://www.marktechpost.com/2026/03/01/how-to-design-a-production-grade-multi-agent-communication-system-using-langgraph-structured-message-bus-acp-logging-and-persistent-shared-state-architecture/)
- [LangGraph.js GitHub](https://github.com/langchain-ai/langgraphjs)
- [Financial Analysis Agent with LangGraph (AWS)](https://aws.amazon.com/blogs/machine-learning/build-an-intelligent-financial-analysis-agent-with-langgraph-and-strands-agents/)
- [Building Financial Market Analysis AI Agent System](https://www.analyticsvidhya.com/blog/2025/02/financial-market-analysis-ai-agent/)
- [The Supervisor Pattern for Multi-Agent Systems](https://dev.to/programmingcentral/the-supervisor-pattern-stop-writing-monolithic-agents-and-start-orchestrating-teams-2olk)
- [MCP Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture)
- [React for FinTech AI Dashboards](https://fullstacktechies.com/react-js-for-fintech-predictive-ai-dashboard/)
- [Agentic AI Frontend Architecture 2026](https://bryancode.dev/en/blog/the-rise-of-agentic-ai-building-autonomous-frontend-workflows-in-2026)
- Circle Keeper (CK) codebase -- existing useUniversalAI.js hook and Express server pattern

---
*Architecture research for: Multi-Agent AI Broker/Finance Dashboard (BrokerPilot)*
*Researched: 2026-04-08*
