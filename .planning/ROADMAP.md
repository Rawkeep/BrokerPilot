# Roadmap: BrokerPilot

## Overview

BrokerPilot delivers a KI-powered broker dashboard in five phases: first the infrastructure, persistence, and design system foundation; then the CRM with Kanban pipeline and lead management; then live market data integrations; then the BYOK AI proxy layer with safety controls; and finally the three AI agents (Lead Qualifier, Market Analyst, SWOT Strategist) that deliver the core differentiator. Each phase produces a demoable, verifiable increment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Infrastructure** - Express backend, persistence layer, Glassmorphism design system, German UI shell, deployment
- [ ] **Phase 2: CRM & Pipeline** - Broker profiles, lead CRUD, Kanban pipeline, dashboard KPIs, search/filter
- [ ] **Phase 3: Market Data** - Live stock and crypto prices, server-side caching, financial charts
- [ ] **Phase 4: AI Integration Layer** - BYOK multi-provider proxy, freemium gate, output validation, cost guards
- [ ] **Phase 5: AI Agents** - Lead Qualifier, Market Analyst, SWOT Strategist with SSE streaming and German prompts

## Phase Details

### Phase 1: Foundation & Infrastructure
**Goal**: A deployable application shell with backend, persistence, encrypted key storage, Glassmorphism dark-mode UI, and German language structure
**Depends on**: Nothing (first phase)
**Requirements**: INF-01, INF-02, INF-03, INF-04, DATA-01, DATA-02, DATA-03, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. User can open the app and see a Glassmorphism UI with working dark/light mode toggle and system preference detection
  2. User can navigate a German-language shell that is responsive across mobile, tablet, and desktop
  3. User data persists across browser sessions (IndexedDB for data, localStorage for settings)
  4. User can enter a BYOK API key and it is stored encrypted in the browser (retrievable but not readable in DevTools)
  5. App is deployed on Railway with health check passing and Docker build succeeding
**Plans:** 4 plans
Plans:
- [ ] 01-01-PLAN.md -- Project scaffolding, Express 5 backend, Docker/Railway deployment
- [ ] 01-02-PLAN.md -- StorageAdapter (IndexedDB), CryptoService (AES-256-GCM), Zustand stores
- [ ] 01-03-PLAN.md -- Glassmorphism design system, multi-theme CSS, glass UI components
- [ ] 01-04-PLAN.md -- App shell, navigation, German i18n, settings page, integration checkpoint
**UI hint**: yes

### Phase 2: CRM & Pipeline
**Goal**: Users can manage their broker business with configurable profiles, lead management, a visual Kanban pipeline, and a KPI dashboard
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06
**Success Criteria** (what must be TRUE):
  1. User can select a broker profile (Immobilien, Versicherung, Finanz, Krypto, Investment-Banking) and the pipeline stages and fields adapt accordingly
  2. User can create, edit, delete, search, and filter leads with broker-type-specific fields
  3. User can drag-and-drop leads between pipeline stages on a visual Kanban board
  4. User can open a lead detail page showing the full activity timeline
  5. User can view a dashboard with KPIs: pipeline value, conversion rate, active deals, recent activity
**Plans:** 4 plans
Plans:
- [ ] 02-01-PLAN.md -- Data layer: broker type config extension, lead schema, leadStore with TDD
- [ ] 02-02-PLAN.md -- Kanban pipeline: dnd-kit integration, KanbanBoard/Column/Card, LeadForm modal
- [ ] 02-03-PLAN.md -- Lead detail page with activity timeline, search/filter UI, tag management
- [ ] 02-04-PLAN.md -- Dashboard KPIs: KPI cards, pipeline chart, conversion funnel, activity feed
**UI hint**: yes

### Phase 3: Market Data
**Goal**: Users can view live financial data for stocks and crypto with professional charts, all backed by server-side caching
**Depends on**: Phase 2
**Requirements**: MKT-01, MKT-02, MKT-03, MKT-04
**Success Criteria** (what must be TRUE):
  1. User can search for a stock ticker and see live quotes with basic fundamentals (price, change, market cap)
  2. User can view live crypto prices, market cap, and 24h changes for top coins
  3. User can view candlestick and line charts for stock and crypto data
  4. Market data loads within seconds and is visibly cached (subsequent requests within 5 minutes return instantly)
**Plans:** 2 plans
Plans:
- [ ] 03-01-PLAN.md -- Server-side API routes: Yahoo Finance + CoinGecko proxy with cache, data normalization, TDD
- [ ] 03-02-PLAN.md -- MarktPage UI: tabbed Aktien/Krypto layout, stock search, crypto table, lightweight-charts integration
**UI hint**: yes

### Phase 4: AI Integration Layer
**Goal**: Users can connect their preferred AI provider and make AI requests through a secure, cost-controlled backend proxy
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria** (what must be TRUE):
  1. User can connect any of 6 AI providers (Claude, GPT, Gemini, Mistral, Groq, OpenRouter) via BYOK API key and get a response
  2. User without an API key can make up to 5 free AI requests per day before being prompted to add a key
  3. AI responses are validated against schemas (no raw unstructured output reaches the UI)
  4. Runaway AI requests are stopped by iteration limits, token budgets, and circuit breakers
**Plans:** 2 plans
Plans:
- [ ] 04-01-PLAN.md -- Backend AI proxy: multi-provider adapter (6 providers), Zod validation, freemium gate, cost guards, circuit breaker (TDD)
- [ ] 04-02-PLAN.md -- Frontend AI hooks: useAIRequest, provider config in Einstellungen, AI response panel, BYOK integration
**UI hint**: yes

### Phase 5: AI Agents
**Goal**: Users can trigger specialized AI agents on their leads and deals to get instant qualification scores, market analysis, and SWOT assessments in German
**Depends on**: Phase 3, Phase 4
**Requirements**: AGT-01, AGT-02, AGT-03, AGT-04, UI-04
**Success Criteria** (what must be TRUE):
  1. User can trigger the Lead Qualifier agent on any lead and receive a structured score with reasoning and recommended actions
  2. User can trigger the Market Analyst agent to get a written analysis with live data and buy/hold/sell reasoning
  3. User can trigger the SWOT Strategist agent to get a structured SWOT matrix for any deal or investment opportunity
  4. Agent results stream to the UI in real-time via SSE with visible progress indicators
  5. All agent outputs are in German with accurate financial terminology
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
(Note: Phase 4 depends only on Phase 1; Phase 5 depends on both Phase 3 and Phase 4)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Infrastructure | 0/4 | Planning complete | - |
| 2. CRM & Pipeline | 0/4 | Planning complete | - |
| 3. Market Data | 0/2 | Planning complete | - |
| 4. AI Integration Layer | 0/2 | Planning complete | - |
| 5. AI Agents | 0/TBD | Not started | - |
