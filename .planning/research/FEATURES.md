# Feature Research

**Domain:** AI-powered multi-broker dashboard (CRM + market analysis + portfolio management)
**Researched:** 2026-04-08
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Lead capture & contact management** | Every CRM has this; brokers need a central place for leads with name, contact info, source, notes | LOW | localStorage-backed, simple CRUD. Import from CSV nice-to-have later |
| **Visual deal pipeline (Kanban)** | Pipedrive, HubSpot, Monday all use drag-drop pipeline. Brokers think in stages | MEDIUM | Configurable stages per broker type (e.g., Immobilien: Besichtigung -> Angebot -> Notar) |
| **Lead detail view with activity timeline** | Users expect to see all interactions, notes, and status changes on one screen | LOW | Timeline component showing AI analyses, manual notes, status changes |
| **Dashboard with KPIs** | Every business tool has a summary dashboard. Brokers need conversion rates, pipeline value, active deals | MEDIUM | Aggregated from pipeline data. Charts for trends |
| **Live market data (stocks)** | Finance dashboards without prices are useless. Yahoo Finance API is free | MEDIUM | Yahoo Finance API for quotes, charts, basic fundamentals |
| **Live crypto prices** | CoinGecko free tier covers this. Any crypto-adjacent tool needs live prices | LOW | CoinGecko API, top coins by market cap, search, price history |
| **Dark mode** | Inherited from CK design system. Finance/crypto users strongly expect dark UI | LOW | Already solved via CK's dark mode system |
| **BYOK AI integration** | Core differentiator from PROJECT.md, but also table stakes for a "KI-Copilot" product — no AI = no value | MEDIUM | Inherited from CK's useUniversalAI hook (Claude, GPT, Gemini, Mistral, Groq, OpenRouter) |
| **German-language UI** | DACH market targeting requires native German. English-only = instant bounce | LOW | i18n from start, German as default locale |
| **Responsive design** | Brokers work on tablets at showings, on phones between meetings | MEDIUM | Mobile-first CSS, collapsible sidebar, touch-friendly pipeline |
| **Data persistence** | Users expect their data to survive a page refresh | LOW | localStorage with JSON serialization. Already proven in CK |
| **Search & filtering** | Users need to find leads, filter by status, broker type, date range | LOW | Client-side filtering over localStorage data |
| **Basic follow-up reminders** | Brokers forget to follow up. Simple date-based reminders are baseline | LOW | Scheduled reminders stored in localStorage, browser notifications |

### Differentiators (Competitive Advantage)

Features that set BrokerPilot apart. These are the "wow moments" that justify the product.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI Lead Qualification Agent** | Automatically scores and qualifies leads based on input data (budget, timeline, intent signals). Turns 30min manual assessment into 30sec AI analysis | MEDIUM | LangChain agent with structured output. Scoring criteria configurable per broker type |
| **AI Market Analyst Agent** | One-click market analysis: pulls live data (stock fundamentals, crypto metrics, real estate comps) and generates written analysis with buy/hold/sell reasoning | HIGH | Multi-step agent: fetch data -> analyze -> generate report. The core "wow" feature |
| **AI SWOT Strategist Agent** | Generates SWOT analysis for any deal/investment opportunity. Investment bankers and brokers save hours of manual analysis | MEDIUM | Structured prompt engineering with deal context. Visual SWOT matrix output |
| **AI Offer Architect Agent** | Generates personalized client proposals/offers based on lead profile + market analysis. From data to PDF-ready offer in minutes | HIGH | Combines lead data + market analysis + templates. Markdown -> formatted output |
| **Lead-to-Deal Pipeline Automation** | Full workflow: Lead comes in -> AI qualifies -> AI analyzes market -> AI generates SWOT -> AI drafts offer -> Follow-up scheduled. The "5-minute pipeline" promise | HIGH | Orchestrated multi-agent workflow via LangGraph. The flagship differentiator |
| **Multi-broker-type profiles** | One tool for Immobilien-Makler, Versicherungsmakler, Finanzmakler, Krypto-Berater, Investment-Banker. Each type gets relevant fields, pipeline stages, and AI prompts | MEDIUM | Profile system that configures: pipeline stages, data fields, AI agent prompts, relevant market data sources |
| **Crypto portfolio tracker with DeFi positions** | Wallet-connected or manual portfolio tracking across tokens, staking, LP positions. Goes beyond simple price watching | HIGH | CoinGecko for prices, but DeFi position tracking requires chain-specific APIs or manual input in v1 |
| **Investment portfolio risk scoring** | AI-generated risk assessment with diversification analysis across asset classes (stocks, crypto, real estate, bonds) | MEDIUM | Calculated from portfolio composition. AI adds narrative interpretation |
| **AI Follow-up Engine** | Generates contextual follow-up messages based on deal stage, last interaction, and market changes. "Your lead's target stock dropped 15% — here's a follow-up angle" | MEDIUM | Triggered by schedule + market events. Generates draft messages for review |
| **Deal comparison matrix** | Side-by-side comparison of multiple investment opportunities with AI-generated pros/cons | LOW | UI component + AI summary. High value, relatively simple |
| **Freemium gate with usage tracking** | 5 free AI requests/day, then BYOK required. Low friction onboarding with clear upgrade path | LOW | Request counter in localStorage. Already conceptually proven in CK |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Trade execution / order placement** | "Let me trade directly from the dashboard" | Massive regulatory burden (BaFin, FMA, FINMA). Brokerage licensing required. Liability nightmare | Provide analysis and recommendations with deep-links to user's existing brokerage (e.g., link to Trade Republic, Interactive Brokers) |
| **Real-time WebSocket market data** | "I need tick-by-tick prices" | Expensive data feeds ($$$), complex infrastructure, unnecessary for broker/advisor use case. Not a trading terminal | Polling-based updates (30s-5min intervals) via free APIs. Sufficient for advisory/analysis workflow |
| **Multi-tenancy / team features** | "My team of 5 brokers needs shared access" | Requires auth system, role management, data isolation, conflict resolution. Massive scope increase for v1 | Single-user tool in v1. Export/share features for collaboration. Team features as v2+ with cloud backend |
| **Regulatory compliance engine** | "Check if my recommendation is MiFID II compliant" | Legal liability, constantly changing regulations per jurisdiction, requires legal expertise to build correctly | Prominent disclaimers ("Keine Anlageberatung"), links to compliance checklists, but no automated legal validation |
| **Custom AI model training / fine-tuning** | "Train the AI on my specific deal history" | Requires ML infrastructure, data pipeline, compute costs. BYOK model means we don't control the model | Excellent system prompts + structured context injection via MCP. RAG over deal history for personalization without training |
| **Native mobile app** | "I need an app in the App Store" | Separate codebase, app store approval process, update cycles. PWA covers 90% of mobile use cases | Responsive web app with PWA manifest. Add-to-homescreen gives app-like experience |
| **Email/calendar integration** | "Sync with my Outlook/Gmail" | OAuth flows, email parsing, calendar API complexity. Major scope for marginal v1 value | Manual follow-up scheduling with copy-to-clipboard for email drafts. Native integration in v2 |
| **Automated data scraping / web crawling** | "Scrape ImmoScout24 for property listings" | Legal issues (TOS violations), brittle scrapers, maintenance burden | Manual data input + API integrations where available (e.g., public property APIs, free finance APIs) |
| **Blockchain wallet connection (MetaMask etc.)** | "Connect my wallet for auto portfolio tracking" | Web3 library complexity, security concerns, chain-specific integrations, UX friction | Manual portfolio entry in v1. Users enter holdings, system tracks prices. Wallet connect as v2 feature |
| **AI chat interface as primary UX** | "Just give me a ChatGPT-like interface for everything" | Chat is terrible for structured workflows. Brokers need dashboards, pipelines, and forms — not conversation threads | AI agents triggered by specific actions (analyze this lead, generate this offer). Structured inputs and outputs, not freeform chat |

## Feature Dependencies

```
[BYOK AI Integration]
    └──requires──> [AI Lead Qualifier]
                       └──enables──> [AI Market Analyst]
                                         └──enables──> [AI SWOT Strategist]
                                                            └──enables──> [AI Offer Architect]
                                                                              └──enables──> [Lead-to-Deal Automation]

[Lead Capture & Contact Mgmt]
    └──requires──> [Visual Deal Pipeline]
                       └──requires──> [Lead Detail View]
                                          └──enables──> [Follow-up Reminders]
                                                            └──enhances──> [AI Follow-up Engine]

[Multi-Broker Profiles]
    └──configures──> [Pipeline Stages]
    └──configures──> [AI Agent Prompts]
    └──configures──> [Relevant Market Data Sources]

[Live Market Data (Stocks)]
    └──enhances──> [AI Market Analyst]
    └──enables──> [Investment Portfolio Risk Scoring]

[Live Crypto Prices]
    └──enhances──> [AI Market Analyst]
    └──enables──> [Crypto Portfolio Tracker]

[Dashboard KPIs]
    └──requires──> [Lead Capture & Pipeline Data]

[Data Persistence (localStorage)]
    └──required-by──> [Everything]
```

### Dependency Notes

- **BYOK AI is the foundation**: Every AI agent depends on having a working AI provider connection. Must be rock-solid before building agents on top.
- **Lead management before AI agents**: The AI agents operate ON lead/deal data. No leads = nothing to analyze. CRM basics must exist first.
- **Market data before AI Market Analyst**: The agent needs live data to analyze. API integrations must be working before the agent can use them.
- **Multi-broker profiles configure everything**: Profile selection changes pipeline stages, AI prompts, and which market data is relevant. This is a cross-cutting concern that should be designed early.
- **AI agents are sequential**: Each agent in the Lead-to-Deal chain builds on the output of the previous one. Qualifier output feeds Analyst, Analyst feeds SWOT, SWOT feeds Offer.

## MVP Definition

### Launch With (v1)

Minimum viable product — validate the "5-minute Lead-to-Deal" promise.

- [ ] **Broker profile selection** (Immobilien, Versicherung, Finanz, Krypto, Investment) — sets up relevant fields, pipeline stages, and AI prompts
- [ ] **Lead management CRUD** — create, edit, delete leads with broker-type-specific fields
- [ ] **Visual Kanban pipeline** — drag-drop deal stages, customized per broker type
- [ ] **Lead detail view with timeline** — single-pane view of all lead data and activities
- [ ] **BYOK AI setup** — connect one of 6 AI providers with API key
- [ ] **AI Lead Qualifier** — one-click lead scoring and qualification summary
- [ ] **AI Market Analyst** — one-click market analysis pulling live data (stocks via Yahoo Finance, crypto via CoinGecko)
- [ ] **AI SWOT Strategist** — one-click SWOT generation for a deal/opportunity
- [ ] **Dashboard with basic KPIs** — pipeline value, conversion rate, active deals count
- [ ] **German UI** — all user-facing text in German
- [ ] **Dark mode** — inherited from CK design system
- [ ] **Freemium gate** — 5 free AI requests/day, then BYOK required
- [ ] **localStorage persistence** — all data survives refresh

### Add After Validation (v1.x)

Features to add once core pipeline is working and initial users are onboarded.

- [ ] **AI Offer Architect** — generate personalized proposals/offers. Add when Lead-to-Deal pipeline is proven useful
- [ ] **AI Follow-up Engine** — contextual follow-up message generation. Add when users have active pipelines with stale deals
- [ ] **Crypto portfolio tracker** — manual holdings entry with live price tracking. Add when crypto broker users are validated
- [ ] **Investment portfolio risk scoring** — diversification analysis across asset classes. Add when portfolio data exists
- [ ] **Deal comparison matrix** — side-by-side opportunity comparison. Add when users manage multiple concurrent deals
- [ ] **Basic follow-up scheduling** — date-based reminders with browser notifications. Add alongside Follow-up Engine
- [ ] **CSV import/export** — bulk lead import, data export for backup. Add when users have significant data
- [ ] **Lead-to-Deal full automation** — orchestrated multi-agent pipeline (LangGraph). Add when individual agents are proven reliable

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Cloud sync / backup** — requires backend infrastructure, auth system. Defer until localStorage limits are hit
- [ ] **DeFi position tracking** — chain-specific APIs, complex data model. Defer until crypto user base is validated
- [ ] **Whale tracking alerts** — requires persistent backend service for monitoring. Defer to v2 with cloud infrastructure
- [ ] **Email/calendar integration** — OAuth complexity, provider-specific. Defer until follow-up workflow is validated
- [ ] **Multi-user / team features** — requires auth, roles, data isolation. Defer until single-user value is proven
- [ ] **Wallet connection (MetaMask)** — Web3 complexity, security. Defer until manual crypto tracking is validated
- [ ] **PDF report generation** — client-facing reports from AI analysis. Defer until offer workflow is proven
- [ ] **MCP server integration** — context-mode for session persistence across weeks. Defer until agent workflows are stable

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Lead management CRUD | HIGH | LOW | P1 |
| Visual Kanban pipeline | HIGH | MEDIUM | P1 |
| Broker profile selection | HIGH | MEDIUM | P1 |
| BYOK AI integration | HIGH | LOW (inherited) | P1 |
| AI Lead Qualifier | HIGH | MEDIUM | P1 |
| AI Market Analyst | HIGH | HIGH | P1 |
| AI SWOT Strategist | HIGH | MEDIUM | P1 |
| Dashboard KPIs | MEDIUM | MEDIUM | P1 |
| German UI | HIGH | LOW | P1 |
| Dark mode | MEDIUM | LOW (inherited) | P1 |
| Freemium gate | MEDIUM | LOW | P1 |
| localStorage persistence | HIGH | LOW (inherited) | P1 |
| Live stock data (Yahoo Finance) | MEDIUM | MEDIUM | P1 |
| Live crypto prices (CoinGecko) | MEDIUM | LOW | P1 |
| Lead detail view + timeline | MEDIUM | MEDIUM | P1 |
| AI Offer Architect | HIGH | HIGH | P2 |
| AI Follow-up Engine | MEDIUM | MEDIUM | P2 |
| Follow-up scheduling | MEDIUM | LOW | P2 |
| Crypto portfolio tracker | MEDIUM | MEDIUM | P2 |
| Portfolio risk scoring | MEDIUM | MEDIUM | P2 |
| Deal comparison matrix | MEDIUM | LOW | P2 |
| CSV import/export | LOW | LOW | P2 |
| Lead-to-Deal full automation | HIGH | HIGH | P2 |
| Cloud sync | MEDIUM | HIGH | P3 |
| DeFi tracking | LOW | HIGH | P3 |
| Whale alerts | LOW | HIGH | P3 |
| Email/calendar integration | MEDIUM | HIGH | P3 |
| Team features | MEDIUM | HIGH | P3 |
| PDF reports | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — validates the core "KI-Copilot" promise
- P2: Should have, add after core is proven — extends the pipeline
- P3: Nice to have, future consideration — requires infrastructure changes

## Competitor Feature Analysis

| Feature | Salesforce / HubSpot (CRM) | Nansen / DeBank (Crypto) | Microsoft Copilot Finance | BrokerPilot Approach |
|---------|---------------------------|--------------------------|--------------------------|---------------------|
| Lead management | Full-featured, enterprise-grade | N/A | N/A | Lightweight, localStorage, broker-type-aware |
| Deal pipeline | Visual Kanban, extensive customization | N/A | N/A | Kanban with broker-type presets |
| AI lead scoring | Proprietary ML models, historical data | N/A | N/A | LLM-based scoring via BYOK — no training data needed, works from day 1 |
| Market data | Basic via integrations | Deep on-chain analytics, 30+ chains | ERP-connected financial data | Free API aggregation (Yahoo Finance + CoinGecko) — good enough for advisory |
| Portfolio tracking | Via add-ons | Excellent multi-chain DeFi tracking | Excel-based | Manual entry + live price tracking. Simpler but cross-asset-class |
| SWOT analysis | Manual or via add-on tools | N/A | N/A | AI-generated in one click — unique differentiator |
| Multi-broker support | Generic CRM, not broker-specific | Crypto only | Finance teams only | Purpose-built for 5 broker types — the core positioning |
| AI agents | Einstein, Breeze (proprietary) | AI signals for on-chain | Copilot (Microsoft ecosystem) | BYOK multi-provider, user controls costs and model choice |
| Language | English-first | English-first | Multi-language | German-first for DACH — underserved market |
| Pricing | $25-300/user/month | $0-$150/month | Microsoft 365 license | Freemium + BYOK — user pays only for AI usage they want |

### Competitive Positioning

BrokerPilot's unique angle is the intersection of three underserved needs:
1. **Multi-broker-type support** — no single tool serves Immobilien + Versicherung + Finanz + Krypto brokers
2. **AI agent pipeline** — CRMs have basic AI; BrokerPilot chains agents into an end-to-end workflow
3. **DACH market / German UI** — enterprise tools are English-first; independent DACH brokers want German tools
4. **BYOK cost model** — no per-seat SaaS pricing; users control AI costs directly

## Sources

- [AI-Powered CRM Software (monday.com)](https://monday.com/blog/crm-and-sales/crm-with-ai/)
- [AI Agent Dashboard Comparison 2026 (thecrunch.io)](https://thecrunch.io/ai-agent-dashboard/)
- [Best AI Tools for Financial Advisors (jump.ai)](https://jump.ai/blog/ai-tools-for-financial-advisors)
- [Best DeFi Dashboards 2026 (coinsutra)](https://coinsutra.com/best-defi-dashboards/)
- [DeBank DeFi Portfolio Tutorial 2026 (dextools)](https://www.dextools.io/tutorials/debank-defi-portfolio-tutorial-track-wallets-2026)
- [Crypto Whale Tracker Guide 2026 (westafricatradehub)](https://westafricatradehub.com/crypto/crypto-whale-tracker-how-to-track-whale-movements/)
- [Best Crypto Whale Trackers 2026 (cryptonews)](https://cryptonews.com/cryptocurrency/best-crypto-whale-trackers/)
- [Real Estate CRM Features 2026 (ihomefinder)](https://www.ihomefinder.com/blog/agent-and-broker-resources/real-estate-crm-features-2026/)
- [AI Tools for Investment Banking 2026 (amafiadvisory)](https://amafiadvisory.com/blog/best-ai-tools-investment-banking)
- [AI Lead Scoring 2026 Guide (default.com)](https://www.default.com/post/ai-lead-scoring)
- [Insurance Broker CRM (agencymate)](https://agencymate.com/insights/insurance-broker-crm/)
- [AI Copilots for Wealth Management (neurons-lab)](https://neurons-lab.com/top-ai-co-pilots-for-wealth-management-teams/)
- [Microsoft Copilot for Finance (microsoft.com)](https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2025/10/20/empowering-finance-with-an-ai-assistant-in-microsoft-365-copilot/)
- [AI-Assisted Broker Portfolio Management (microsoft.com)](https://adoption.microsoft.com/en-us/scenario-library/financial-services/ai-assisted-broker-portfolio-management/)

---
*Feature research for: AI-powered multi-broker dashboard (BrokerPilot)*
*Researched: 2026-04-08*
