# Project Research Summary

**Project:** BrokerPilot -- Multi-Agent AI Broker Dashboard
**Domain:** AI-powered CRM + financial analysis for DACH brokers (real estate, insurance, finance, crypto, investment banking)
**Researched:** 2026-04-08
**Confidence:** MEDIUM-HIGH

## Executive Summary

BrokerPilot is a multi-agent AI broker dashboard that combines CRM lead management with AI-driven financial analysis across five broker verticals in the DACH market. The expert approach for this type of product is a two-tier architecture: a React SPA frontend with Zustand state management handles the CRM/dashboard UI and simple AI chat (via an existing BYOK hook from Circle Keeper), while an Express backend runs LangGraph for multi-agent orchestration where six specialized agents form a Lead-to-Deal pipeline. The stack is proven -- React 18, Vite 8, Express 5, LangGraph for agents, Zustand for state, localStorage/IndexedDB for persistence, and free financial APIs (Yahoo Finance + CoinGecko) for market data. No database is needed for v1.

The recommended build approach is strictly dependency-ordered: foundation (UI shell, state management, BYOK settings, lead CRUD) first, then market data integrations, then single-agent AI, then multi-agent orchestration, and finally polish/localization. This order exists because every AI agent depends on working lead data and market APIs, and the multi-agent supervisor depends on proven individual agents. Skipping ahead to the "wow" features (multi-agent pipeline) before the foundation is solid will produce an unreliable product.

The three highest-impact risks are: (1) agent infinite loops causing cost explosions -- a $47K real-world case exists; mitigate with hard iteration limits, token budgets, and circuit breakers from the first agent onward; (2) financial data hallucination by LLM agents, which is catastrophic in a broker context; mitigate with Zod schema validation on every agent output and mandatory source citations; and (3) localStorage limitations (5MB cap, XSS exposure of API keys); mitigate by using IndexedDB for data, encrypting keys, and building a StorageAdapter abstraction from Day 1. German language quality degradation in LLMs is a secondary but real risk that requires English system prompts with German output instructions and a domain-specific financial glossary.

## Key Findings

### Recommended Stack

The stack deliberately splits AI concerns: simple chat uses the frontend `useUniversalAI.js` hook (ported from CK) for direct browser-to-API calls, while multi-agent orchestration runs server-side via LangGraph on Express. This avoids over-engineering simple interactions while enabling complex workflows. All six BYOK providers (Anthropic, OpenAI, Gemini, Mistral, Groq, OpenRouter) are supported through LangChain provider packages, with the user's API key passed per-request and never stored server-side.

**Core technologies:**
- **React 18 + Vite 8:** UI framework and build tool -- proven in CK, mature ecosystem
- **Express 5:** Backend API server -- now `latest` on npm, native async error handling
- **LangGraph (@langchain/langgraph):** Multi-agent orchestration -- graph-based state machines with supervisor pattern, provider-agnostic (fits BYOK)
- **Zustand:** Client state management -- minimal footprint, store-based approach fits multi-panel dashboard
- **lightweight-charts + Recharts:** Financial candlestick charts (TradingView open-source) + dashboard analytics charts
- **Zod 4:** Schema validation for API responses, form inputs, and agent output parsing
- **localStorage + IndexedDB:** Persistence layer -- no database in v1

**Critical version constraint:** All `@langchain/*` packages must share the same `@langchain/core` instance. Pin `@langchain/core@^1.1.39` across all provider packages.

### Expected Features

**Must have (table stakes):**
- Lead capture and contact management with broker-type-specific fields
- Visual Kanban deal pipeline with configurable stages per broker type
- BYOK AI integration (6 providers) with freemium gate (5 free/day)
- Live market data: stocks (Yahoo Finance), crypto (CoinGecko)
- Dashboard with KPIs (pipeline value, conversion rate, active deals)
- German-language UI as default locale
- Dark mode (inherited from CK)
- localStorage persistence

**Should have (differentiators -- the "wow"):**
- AI Lead Qualification Agent (30-second scoring vs. 30-minute manual)
- AI Market Analyst Agent (one-click analysis with live data)
- AI SWOT Strategist Agent (one-click SWOT matrix)
- Multi-broker-type profiles (Immobilien, Versicherung, Finanz, Krypto, Investment)
- Deal comparison matrix

**Defer (v1.x after validation):**
- AI Offer Architect, AI Follow-up Engine (add when individual agents are proven)
- Lead-to-Deal full automation via LangGraph (add when individual agents are reliable)
- Crypto portfolio tracker, portfolio risk scoring

**Defer (v2+):**
- Cloud sync/backup, team features, email/calendar integration, wallet connection, PDF reports

**Anti-features (deliberately not building):**
- Trade execution (regulatory nightmare)
- Real-time WebSocket data (polling is sufficient)
- Custom model training (use prompt engineering + context injection)
- AI chat as primary UX (brokers need dashboards, not conversation threads)

### Architecture Approach

The system follows a four-layer architecture: Presentation (React + Zustand), Client Services (hooks + localStorage), Express API Gateway (routes + middleware + caching), and Agent Orchestration (LangGraph supervisor with 6 specialized worker agents). The supervisor pattern is essential -- a central StateGraph node routes requests to specialized agents (Lead Scout, Market Analyst, SWOT Strategist, Offer Architect, Follow-up Engine, Deal Closer), each with its own tools and system prompt. Market data flows through a normalized server-side aggregation layer with 5-minute caching to avoid rate limit issues.

**Major components:**
1. **Pipeline Kanban + Lead Management** -- drag-drop deal stages, CRUD operations, broker-type-aware fields
2. **LangGraph Supervisor Graph** -- StateGraph orchestrating 6 agents with conditional routing and shared state
3. **Market Data Aggregation Layer** -- server-side normalization of Yahoo Finance + CoinGecko with caching
4. **BYOK AI Proxy** -- Express relay for AI provider calls with freemium gate and usage tracking
5. **Zustand Store Layer** -- four domain stores (pipeline, market, agent, settings) with localStorage/IndexedDB persist

### Critical Pitfalls

1. **Agent infinite loops / cost explosions** -- Set `maxIterations=5` and token budgets per agent, implement global session cost ceiling ($0.50/pipeline run), add circuit breaker pattern (3 consecutive failures = halt). Address in Phase 1.
2. **Financial data hallucination** -- Never display agent-generated numbers without cross-referencing actual API responses. Zod-validate every agent output. Require source citations. Add "Keine Anlageberatung" disclaimer. Address in Phase 3.
3. **API keys exposed via XSS** -- Encrypt keys in localStorage with PBKDF2, strict CSP headers, no inline scripts. Address in Phase 1.
4. **Yahoo Finance unreliability** -- Build `MarketDataProvider` abstraction from Day 1 with fallback chain (Alpha Vantage, Finnhub). Cache aggressively (15-min delay is acceptable). Address in Phase 1 (abstraction) and Phase 2 (implementation).
5. **localStorage 5MB limit** -- Use IndexedDB for data, localStorage only for config. Implement StorageAdapter pattern, storage monitoring, and data lifecycle management. Address in Phase 1.
6. **German LLM quality degradation** -- Write system prompts in English, instruct German output. Include 50+ term financial glossary. Use Claude/GPT-4 class models for German. Address in Phase 3.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and CRM Shell
**Rationale:** Everything depends on the UI shell, state management, and persistence layer. The BYOK system and lead management are prerequisites for all AI features. Building this first produces a demoable app even without AI.
**Delivers:** Working CRM with lead CRUD, Kanban pipeline, broker profile selection, BYOK settings, Glassmorphism design system, encrypted key storage, StorageAdapter (localStorage + IndexedDB)
**Addresses:** Lead management, visual pipeline, broker profiles, BYOK setup, dark mode, German UI structure, data persistence
**Avoids:** localStorage 5MB limit (IndexedDB from start), API key XSS exposure (encryption from start), data provider lock-in (abstraction layer from start)

### Phase 2: Market Data and Dashboard
**Rationale:** Market data is independent of the agent system and provides immediate utility. The server-side aggregation layer built here is reused by AI agents later. Building this second validates the Express backend and caching patterns.
**Delivers:** Live stock/crypto prices, financial charts (lightweight-charts + Recharts), dashboard KPIs, server-side caching, data freshness indicators
**Uses:** Express 5, yahoo-finance2, CoinGecko API, lightweight-charts, Recharts, node-cache
**Implements:** Normalized Market Data Aggregation pattern, server-side cache with 5-min TTL
**Avoids:** CoinGecko rate limits (batch endpoints, centralized fetch), Yahoo Finance unreliability (fallback chain)

### Phase 3: AI Agent System
**Rationale:** Individual AI agents require working lead data (Phase 1) and market data APIs (Phase 2). Build single agents first before orchestration. This is where the core differentiators land.
**Delivers:** AI Lead Qualifier, AI Market Analyst, AI SWOT Strategist, AI chat proxy, freemium gate, SSE streaming, agent output validation
**Uses:** LangGraph, @langchain/* providers, Zod for output validation
**Implements:** Server-Side AI Proxy pattern, individual agent nodes with tool bindings
**Avoids:** Agent hallucination (Zod validation + source citations), infinite loops (iteration limits + circuit breakers), German quality issues (English prompts + glossary)

### Phase 4: Multi-Agent Orchestration
**Rationale:** The supervisor pattern requires proven individual agents. This phase wires them together into the Lead-to-Deal pipeline -- the flagship differentiator.
**Delivers:** LangGraph supervisor graph, sequential agent pipeline (qualify -> analyze -> SWOT -> offer), SSE streaming of intermediate results, pipeline automation (agents advance deal stages)
**Uses:** LangGraph StateGraph, supervisor pattern with conditional edges
**Implements:** LangGraph Supervisor with Specialized Worker Agents pattern
**Avoids:** Monolithic agent anti-pattern (each agent stays focused), blocking UI (SSE streaming of each step), cost explosions (global session cost ceiling)

### Phase 5: Polish, Localization, and Extension
**Rationale:** Enhancement features that build on the proven core. MCP context persistence, AI Follow-up Engine, Offer Architect, deal comparison matrix, full German localization pass.
**Delivers:** context-mode MCP integration, remaining AI agents, advanced features (portfolio tracking, risk scoring, deal comparison), export/import, full i18n
**Uses:** context-mode MCP, LZ-string compression for storage, react-window for virtualization
**Implements:** Context Persistence Flow, cloud sync preparation (StorageAdapter backend swap)

### Phase Ordering Rationale

- **Phase 1 before anything:** Lead data is the input to every AI agent. No leads = nothing to analyze. The StorageAdapter and encrypted key storage prevent technical debt that is expensive to retrofit.
- **Phase 2 before Phase 3:** AI agents need market data tools to produce useful analysis. Building the aggregation layer first means agents have real data to work with from day one.
- **Phase 3 before Phase 4:** Individual agents must be tested and reliable before wiring them into an orchestration graph. A buggy Lead Scout in an automated pipeline produces cascading failures.
- **Phase 4 is the climax:** This is where the "5-minute Lead-to-Deal" promise is delivered. It depends on everything before it.
- **Phase 5 is enhancement:** MCP, additional agents, and polish extend a working product rather than building core functionality.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (AI Agents):** LangGraph node implementation patterns, structured output with Zod, SSE streaming from Express, German financial glossary curation, agent testing strategies
- **Phase 4 (Multi-Agent Orchestration):** LangGraph supervisor routing logic, state schema design, cost tracking implementation, partial failure recovery in multi-step pipelines

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Standard React + Zustand + Express setup, Kanban UI is well-documented, CRUD operations are boilerplate
- **Phase 2 (Market Data):** API integration patterns are straightforward, caching is standard Express middleware, charting libraries have good docs
- **Phase 5 (Polish):** Localization, MCP integration, and export features follow established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack verified via npm and CK codebase. Library versions from WebSearch have medium confidence -- verify on install. LangGraph API surface may have changed. |
| Features | MEDIUM-HIGH | Feature landscape well-researched across CRM, crypto, and AI dashboard competitors. Anti-features list is strong. MVP scope is realistic. |
| Architecture | HIGH | Supervisor pattern is the documented LangGraph approach. Two-tier AI split is sound. Data flows are clear. Build order follows dependency analysis. |
| Pitfalls | HIGH | Multi-source verified for all critical pitfalls. Real-world cost explosion case ($47K) adds credibility. Yahoo Finance and CoinGecko rate limit issues are well-documented. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **LangGraph JS API stability:** LangGraph is evolving rapidly. The exact StateGraph API, Annotation syntax, and supervisor pattern may differ from research examples. Validate against current `@langchain/langgraph` docs during Phase 3 planning.
- **Yahoo Finance long-term viability:** yahoo-finance2 is unofficial and may break without notice. The data provider abstraction mitigates this, but a concrete fallback (Alpha Vantage or Finnhub) should be tested during Phase 2.
- **German financial glossary completeness:** No existing curated glossary was found. Building one (50+ terms across 5 broker types) requires domain expertise. Engage native German financial professionals for review.
- **Freemium gate enforcement:** The 5-free-requests-per-day model relies on localStorage counters (client-side). Determined users can bypass this. Server-side enforcement needs design during Phase 3.
- **Express 5 maturity:** Express 5 became `latest` in March 2025 but middleware ecosystem compatibility should be verified -- some older middleware may not support Express 5 yet.

## Sources

### Primary (HIGH confidence)
- Circle Keeper (CK) codebase -- useUniversalAI.js hook, Express server pattern, Glassmorphism design system, dark mode, BYOK implementation
- [Express 5.1.0 official announcement](https://expressjs.com/2025/03/31/v5-1-latest-release.html) -- Express 5 now `latest`
- [CoinGecko API rate limit documentation](https://docs.coingecko.com/docs/common-errors-rate-limit) -- free tier specs
- [LangGraph.js GitHub](https://github.com/langchain-ai/langgraphjs) -- official implementation reference

### Secondary (MEDIUM confidence)
- npm registry version checks (langchain, langgraph, vite, zod, react-router) -- versions verified April 2026
- [LangGraph Multi-Agent Architecture Patterns 2026](https://dev.to/ottoaria/langgraph-in-2026-build-multi-agent-ai-systems-that-actually-work-3h5) -- supervisor pattern
- [$47K AI Agent Production Lesson](https://medium.com/@theabhishek.040/our-47-000-ai-agent-production-lesson-the-reality-of-a2a-and-mcp-60c2c000d904) -- cost explosion case study
- [LangChain Production Pitfalls](https://medium.com/codetodeploy/production-pitfalls-of-langchain-nobody-warns-you-about-44a86e2df29e) -- failure modes
- [yfinance blocking issues (GitHub #2422)](https://github.com/ranaroussi/yfinance/issues/2422) -- Yahoo Finance unreliability
- [Multilingual LLM Performance Gap](https://lilt.com/blog/multilingual-llm-performance-gap-analysis) -- German language degradation

### Tertiary (LOW confidence)
- [State Management 2026 comparison](https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge) -- Zustand recommendation (WebSearch only)
- Competitor feature analysis from various blog posts -- feature landscape is directionally correct but specifics may be outdated

---
*Research completed: 2026-04-08*
*Ready for roadmap: yes*
