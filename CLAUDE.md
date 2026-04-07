<!-- GSD:project-start source:PROJECT.md -->
## Project

**BrokerPilot**

BrokerPilot ist ein KI-gestütztes Multi-Agent-Dashboard für Broker, Banker und Investoren im DACH-Raum. Es automatisiert den gesamten Workflow von Lead-Generierung über Marktanalyse (Aktien, Immobilien, Krypto) bis zum Deal-Abschluss. Deutsche UI, BYOK-Modell, alle Broker-Typen in einer Plattform.

**Core Value:** Ein Broker kann einen Lead in 5 Minuten durch die komplette Pipeline führen — von der Qualifizierung über KI-gestützte Marktanalyse bis zum personalisierten Angebot — statt Stunden mit manueller Recherche zu verbringen.

### Constraints

- **Tech Stack**: React 18 + Vite 6 (Frontend), Express.js (Backend), LangChain (Agents) — bewährter Stack aus CK
- **Datenhaltung**: localStorage-first, keine Cloud-DB in v1 — schneller MVP
- **Monetarisierung**: BYOK + Freemium (5 Free-Requests/Tag) — kein eigener API-Proxy nötig
- **Sprache**: Deutsche UI, Code/Docs auf Englisch
- **APIs**: Nur kostenlose/Freemium-APIs für v1 (Yahoo Finance, CoinGecko, etc.)
- **Deployment**: Docker + Railway (wie CK)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^18.3.1 | UI framework | Decided. Stable, mature ecosystem. React 19 exists but 18 is battle-tested and CK already uses it. Migrate to 19 later if needed. |
| Vite | ^8.0.5 | Build tool / dev server | Latest stable. CK uses ^6.0.0 but Vite 8 is current (April 2026). Use latest -- Vite majors are low-friction upgrades. |
| Express | ^5.2.1 | Backend API server | Express 5 is now the npm `latest` tag (since March 2025). Adds async error handling, drops Node <18. No reason to stay on Express 4. |
| @langchain/langgraph | ^1.2.7 | Multi-agent orchestration | LangGraph is the correct layer for multi-agent workflows -- NOT raw LangChain agents. Graph-based state machines with conditional branching, loops, and human-in-the-loop. LangChain team explicitly recommends LangGraph for agent work. |
| @langchain/core | ^1.1.39 | LangChain foundation | Required peer dependency for all @langchain/* provider packages. Pin to same minor across all @langchain packages. |
| Zustand | ^5.x | Client state management | Smallest footprint (~1.2KB), no Provider wrapper needed, store-based approach fits dashboard with multiple independent panels. Jotai is atomic/bottom-up which adds complexity for shared dashboard state. |
| React Router | ^7.14.0 | Client-side routing | v7 is current stable. Declarative routing with data loaders if needed later. |
| Zod | ^4.3.6 | Schema validation | Zod 4 is stable: faster, smaller, better TypeScript inference. Use for API response validation, form inputs, agent output parsing. |
### AI Provider Packages (BYOK)
| Package | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @langchain/anthropic | latest | Claude integration via LangGraph | When user selects Anthropic as provider |
| @langchain/openai | latest | GPT/o-series integration via LangGraph | When user selects OpenAI as provider |
| @langchain/google-genai | latest | Gemini integration via LangGraph | When user selects Google as provider |
| @langchain/mistralai | latest | Mistral integration via LangGraph | When user selects Mistral as provider |
| @langchain/groq | latest | Groq integration via LangGraph | When user selects Groq as provider |
### Financial Data APIs
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yahoo-finance2 | latest | Stock/ETF/index data | Quotes, historical prices, company info. Free, no API key needed. Rate-limited but sufficient for dashboard use. |
| Direct CoinGecko REST | N/A (fetch) | Crypto prices, market data | Use CoinGecko API v3 directly via fetch. The `coingecko-api` npm package is outdated. Free tier: 10K credits/month, 30 calls/min. |
### Charting & Visualization
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lightweight-charts | ^5.1.0 | Financial candlestick/line charts | Stock and crypto price charts. 35KB, canvas-based, built by TradingView. The only serious choice for financial charts. |
| Recharts | ^2.15.x | Dashboard analytics charts | Bar charts, pie charts, area charts for portfolio allocation, lead pipeline stats. Declarative React components on top of D3/SVG. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| helmet | ^8.0.0 | Express security headers | Always -- HTTP security hardening |
| cors | ^2.8.5 | CORS middleware | Always -- frontend/backend on different ports in dev |
| express-rate-limit | ^7.4.0 | API rate limiting | Always -- protect backend endpoints |
| date-fns | ^4.x | Date formatting/manipulation | German locale date formatting, relative times ("vor 3 Tagen") |
| react-hot-toast | ^2.5.x | Toast notifications | Agent status updates, API errors, success messages |
| clsx | ^2.1.x | Conditional CSS classes | Cleaner className logic in Glassmorphism components |
| uuid | ^11.x | Unique ID generation | Lead IDs, session IDs, agent run IDs |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| @vitejs/plugin-react | ^4.3.4 | Vite React plugin | Fast Refresh, JSX transform |
| Vitest | ^3.x | Unit/integration testing | Native Vite integration, Jest-compatible API |
| Playwright | latest | E2E testing | Critical user flow testing per project standards |
| ESLint | ^9.x | Linting | Flat config format (eslint.config.js) |
| Docker | latest | Containerization | Multi-stage build: Vite build + Express serve |
### Infrastructure
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Docker | latest | Container packaging | Multi-stage build proven in CK. Single container serves both Vite build output and Express API. |
| Railway | N/A | Cloud deployment | Decided. Docker deploy with one-click from GitHub. Free tier sufficient for MVP. |
| localStorage | N/A | Primary data persistence | Decided. No database in v1. Leads, portfolio, settings all in localStorage with JSON serialization. |
## Installation
# Core frontend
# Core backend
# LangGraph agent orchestration (backend)
# AI provider packages (install all -- BYOK means user picks at runtime)
# Financial data
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| LangGraph | CrewAI | Never for this project -- CrewAI is Python-only, no JS/TS support |
| LangGraph | OpenAI Agents SDK | Only if you commit to OpenAI-only. LangGraph is provider-agnostic which fits BYOK. |
| Zustand | Jotai | If you had many independent atomic state pieces. Dashboard panels share state (selected lead flows into analysis), so store-based Zustand fits better. |
| Zustand | Redux Toolkit | If you had a large team needing strict patterns. Overkill for single-dev MVP. |
| Express 5 | Fastify | If raw performance was critical. Express is decided and CK-proven. Fastify adds learning curve for marginal throughput gains. |
| Recharts | Tremor | Never -- Tremor adds Tailwind dependency and limits customization. The project uses custom Glassmorphism CSS. |
| Recharts | ECharts | If you needed 3D charts or very complex visualizations. Heavier bundle, imperative API. |
| lightweight-charts | TradingView Widget | If you wanted the full TradingView experience. But it requires TradingView branding and is heavier. lightweight-charts is their official open-source alternative. |
| Vite 8 | Vite 6 | CK uses Vite 6. Upgrading to 8 is low-friction -- Vite majors are typically clean. Use 8 for a fresh project. |
| Express 5 | Express 4 | CK uses Express 4. Express 5 is now `latest` on npm, adds async/await error handling natively. No reason to start a new project on 4. |
| Direct CoinGecko fetch | coingecko-api npm | Never -- the npm wrapper is outdated and wraps old API endpoints |
| yahoo-finance2 | Alpha Vantage | If you need forex data. Alpha Vantage requires API key registration but has broader data. yahoo-finance2 is zero-config. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Raw LangChain agents | LangChain's agent executor is deprecated in favor of LangGraph. The LangChain team says "use LangGraph for agents." | @langchain/langgraph |
| Vercel AI SDK | Adds Vercel ecosystem coupling. The project already has useUniversalAI.js which handles BYOK streaming. LangGraph handles agent orchestration. AI SDK solves neither problem better. | useUniversalAI.js (chat) + LangGraph (agents) |
| coingecko-api npm | Outdated wrapper, last meaningful update years ago, wraps old API version | Direct fetch to CoinGecko API v3 |
| Tremor charts | Tight Tailwind coupling, builds on Recharts anyway, limits CSS customization needed for Glassmorphism | Recharts (dashboard) + lightweight-charts (financial) |
| Redux / Redux Toolkit | Boilerplate-heavy for single-dev MVP, Zustand does same job in 1/10th the code | Zustand |
| Next.js | Project is a SPA dashboard, not a content site. SSR adds complexity with no benefit. Vite + Express is simpler and CK-proven. | Vite (frontend) + Express (backend) |
| Prisma / Drizzle / any ORM | No database in v1. localStorage-first. Adding an ORM implies a DB migration path that is premature. | localStorage with JSON serialization |
| Socket.io | Tempting for "real-time" data, but financial APIs are rate-limited anyway. Polling every 30-60s via setInterval is simpler and sufficient. | fetch + setInterval polling |
| Tailwind CSS | Project uses custom Glassmorphism CSS system from CK. Mixing Tailwind with an existing design system creates conflicts. | Custom CSS with CSS variables |
## Stack Patterns by Variant
- Use native WebSocket API (not Socket.io) for crypto price feeds
- CoinGecko Pro or Binance WebSocket for streaming prices
- Because: lighter than Socket.io, financial WebSocket APIs speak native WS
- Use Supabase (Postgres + Auth + Realtime) as the cloud layer
- Because: generous free tier, JS SDK, row-level security, fits DACH data residency (EU regions available)
- Port BYOK logic into LangGraph's model abstraction using @langchain/community adapters
- Because: LangGraph can switch models per-agent-node, letting Lead Scout use cheap Groq while SWOT Strategist uses Claude Opus
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @langchain/langgraph@^1.2.7 | @langchain/core@^1.1.39 | MUST share same @langchain/core instance. Use npm overrides if version conflicts arise. |
| All @langchain/* providers | @langchain/core@^1.1.39 | Same constraint -- pin core version across all provider packages |
| React@^18.3.1 | React Router@^7.14.0 | Full compatibility. React Router 7 supports React 18 and 19. |
| Vite@^8.0.5 | @vitejs/plugin-react@^4.3.4 | Verify plugin compatibility on upgrade -- usually auto-resolves |
| lightweight-charts@^5.1.0 | React@^18.x | No React wrapper needed -- use refs with useEffect for imperative chart API |
| Express@^5.2.1 | Node@>=18.0.0 | Express 5 dropped Node <18 support. Use Node 22 LTS in Docker. |
## Key Architecture Decision: Two-Tier AI
## Sources
- [langchain npm](https://www.npmjs.com/package/langchain) -- v1.3.0, verified April 2026 (MEDIUM confidence)
- [@langchain/langgraph npm](https://www.npmjs.com/package/@langchain/langgraph) -- v1.2.7, verified April 2026 (MEDIUM confidence)
- [@langchain/core npm](https://www.npmjs.com/package/@langchain/core) -- v1.1.39, verified April 2026 (MEDIUM confidence)
- [Express 5.1.0 announcement](https://expressjs.com/2025/03/31/v5-1-latest-release.html) -- Express 5 now `latest` on npm (HIGH confidence)
- [express npm](https://www.npmjs.com/package/express) -- v5.2.1 (MEDIUM confidence)
- [vite npm](https://www.npmjs.com/package/vite) -- v8.0.5 latest (MEDIUM confidence)
- [react-router npm](https://www.npmjs.com/package/react-router) -- v7.14.0 (MEDIUM confidence)
- [zod npm](https://www.npmjs.com/package/zod) -- v4.3.6 (MEDIUM confidence)
- [lightweight-charts npm](https://www.npmjs.com/package/lightweight-charts) -- v5.1.0 (MEDIUM confidence)
- [yahoo-finance2 npm](https://www.npmjs.com/package/yahoo-finance2) -- actively maintained (MEDIUM confidence)
- [CoinGecko API pricing](https://www.coingecko.com/en/api/pricing) -- free tier 10K credits/month (MEDIUM confidence)
- [LangGraph TypeScript comparison 2026](https://langgraphjs.guide/comparison/) -- LangGraph vs CrewAI vs OpenAI Agents (MEDIUM confidence)
- [State Management 2026](https://dev.to/jsgurujobs/state-management-in-2026-zustand-vs-jotai-vs-redux-toolkit-vs-signals-2gge) -- Zustand recommendation (LOW confidence, WebSearch-only)
- CK codebase `useUniversalAI.js` -- 6 providers, BYOK, streaming verified (HIGH confidence, local code)
- CK `package.json` -- React 18.3.1, Vite 6, Express 4.21, verified baseline (HIGH confidence, local code)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
