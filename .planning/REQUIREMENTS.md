# Requirements: BrokerPilot

**Defined:** 2026-04-08
**Core Value:** Ein Broker kann einen Lead in 5 Minuten durch die komplette Pipeline führen — von der Qualifizierung über KI-gestützte Marktanalyse bis zum personalisierten Angebot.

## v1 Requirements

### CRM Foundation

- [ ] **CRM-01**: User can select a broker profile (Immobilien, Versicherung, Finanz, Krypto, Investment-Banking) that configures pipeline stages, fields, and AI prompts
- [ ] **CRM-02**: User can create, edit, and delete leads with broker-type-specific fields (name, contact, budget, timeline, notes)
- [ ] **CRM-03**: User can view and manage a visual Kanban pipeline with drag-drop between stages (stages configured per broker type)
- [ ] **CRM-04**: User can view a lead detail page with full activity timeline (AI analyses, status changes, notes)
- [ ] **CRM-05**: User can search and filter leads by status, broker type, date range, and custom tags
- [ ] **CRM-06**: User can see a dashboard with KPIs (pipeline value, conversion rate, active deals, recent activity)

### Data Persistence

- [ ] **DATA-01**: All user data persists in IndexedDB via a StorageAdapter (not raw localStorage due to 5MB limit)
- [ ] **DATA-02**: User settings and preferences persist in localStorage
- [ ] **DATA-03**: BYOK API keys are stored encrypted in the browser (XSS-resistant)

### Market Data

- [ ] **MKT-01**: User can view live stock quotes and basic fundamentals via Yahoo Finance integration
- [ ] **MKT-02**: User can view live crypto prices, market cap, and 24h changes via CoinGecko integration
- [ ] **MKT-03**: Market data is server-side cached (5-min TTL) to respect API rate limits
- [ ] **MKT-04**: User can view financial charts (candlestick/line) via lightweight-charts

### AI Integration

- [ ] **AI-01**: User can connect any of 6 AI providers (Claude, GPT, Gemini, Mistral, Groq, OpenRouter) via BYOK API key
- [ ] **AI-02**: Freemium gate limits to 5 free AI requests/day without API key
- [ ] **AI-03**: AI proxy on Express backend relays requests — BYOK keys flow per-request, never persisted server-side
- [ ] **AI-04**: All AI agent outputs are validated via Zod schemas (no hallucinated numbers without source)
- [ ] **AI-05**: Agent cost guards: maxIterations, token budgets, and circuit breakers prevent runaway costs

### AI Agents

- [ ] **AGT-01**: AI Lead Qualifier agent scores and qualifies leads with structured output (score, reasoning, recommended actions)
- [ ] **AGT-02**: AI Market Analyst agent pulls live data and generates written analysis with buy/hold/sell reasoning
- [ ] **AGT-03**: AI SWOT Strategist agent generates structured SWOT analysis for any deal/investment opportunity
- [ ] **AGT-04**: Each agent uses German system prompts with financial terminology glossary for accurate DACH-market output

### UI & Design

- [ ] **UI-01**: Glassmorphism UI with dark mode (light/dark toggle + system preference detection)
- [ ] **UI-02**: German-language UI for all user-facing text
- [ ] **UI-03**: Responsive design — mobile-first, works on tablet and desktop
- [ ] **UI-04**: Agent results stream to the UI via SSE (Server-Sent Events) with real-time progress indicators

### Infrastructure

- [ ] **INF-01**: Express 5 backend with Helmet, CORS, rate limiting
- [ ] **INF-02**: Docker multi-stage build for production deployment
- [ ] **INF-03**: Railway deployment with health check endpoint
- [ ] **INF-04**: Server-side market data caching layer with configurable TTL

## v2 Requirements

### AI Agents (Extended)

- **AGT-05**: AI Offer Architect generates personalized proposals based on lead profile + market analysis
- **AGT-06**: AI Follow-up Engine generates contextual follow-up messages based on deal stage and market changes
- **AGT-07**: AI Deal Closer provides negotiation coaching and risk assessment

### Multi-Agent Orchestration

- **ORCH-01**: LangGraph supervisor orchestrates Lead-to-Deal pipeline (Qualifier → Analyst → SWOT → Offer)
- **ORCH-02**: SSE streaming of intermediate agent results during pipeline execution
- **ORCH-03**: Partial failure recovery — if one agent fails, others still return results

### Portfolio & Crypto

- **PORT-01**: Manual crypto portfolio tracker with live price updates
- **PORT-02**: Investment portfolio risk scoring with diversification analysis
- **PORT-03**: Deal comparison matrix (side-by-side opportunity comparison)

### Productivity

- **PROD-01**: Follow-up scheduling with browser notifications
- **PROD-02**: CSV import/export for leads and data backup
- **PROD-03**: PDF report generation from AI analyses

### Context Persistence

- **CTX-01**: context-mode MCP server integration for session persistence across weeks
- **CTX-02**: Agent session memory — AI remembers prior analyses for a lead

### Cloud & Scaling

- **CLOUD-01**: Optional cloud sync/backup (Supabase or similar)
- **CLOUD-02**: Multi-user / team features with auth and roles

## Out of Scope

| Feature | Reason |
|---------|--------|
| Trade execution / order placement | BaFin/FMA/FINMA regulatory burden, brokerage licensing required — provide analysis + deep-links to brokerages instead |
| Real-time WebSocket market data | Expensive data feeds, unnecessary for advisory use case — polling with 30s-5min intervals sufficient |
| Custom AI model training | Requires ML infrastructure and compute — BYOK + excellent system prompts + MCP context instead |
| Native mobile app | Separate codebase, app store overhead — responsive PWA covers 90% of mobile use cases |
| Email/calendar integration | OAuth complexity, provider-specific — manual scheduling + copy-to-clipboard in v1 |
| Automated web scraping | Legal issues (TOS violations), brittle scrapers — API integrations only |
| Blockchain wallet connection | Web3 complexity, security concerns — manual portfolio entry in v1 |
| AI chat as primary UX | Chat is terrible for structured broker workflows — AI triggered by specific actions instead |
| Regulatory compliance engine | Legal liability, constantly changing per jurisdiction — disclaimers + links to checklists |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRM-01 | TBD | Pending |
| CRM-02 | TBD | Pending |
| CRM-03 | TBD | Pending |
| CRM-04 | TBD | Pending |
| CRM-05 | TBD | Pending |
| CRM-06 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| MKT-01 | TBD | Pending |
| MKT-02 | TBD | Pending |
| MKT-03 | TBD | Pending |
| MKT-04 | TBD | Pending |
| AI-01 | TBD | Pending |
| AI-02 | TBD | Pending |
| AI-03 | TBD | Pending |
| AI-04 | TBD | Pending |
| AI-05 | TBD | Pending |
| AGT-01 | TBD | Pending |
| AGT-02 | TBD | Pending |
| AGT-03 | TBD | Pending |
| AGT-04 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| INF-01 | TBD | Pending |
| INF-02 | TBD | Pending |
| INF-03 | TBD | Pending |
| INF-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
