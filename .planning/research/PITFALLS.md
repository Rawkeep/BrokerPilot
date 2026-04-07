# Pitfalls Research

**Domain:** Multi-agent AI broker/finance/crypto dashboard (DACH market)
**Researched:** 2026-04-08
**Confidence:** HIGH (multi-source verified for all critical pitfalls)

## Critical Pitfalls

### Pitfall 1: Agent Infinite Loops and Cost Explosions

**What goes wrong:**
LangChain/LangGraph agents enter infinite retry or dialogue loops, burning through API tokens uncontrollably. A documented real-world case: two agents trapped in an endless dialogue loop for 11 days, resulting in a $47,000 bill. In BrokerPilot's context, six specialized agents (Lead Scout, Market Analyst, SWOT Strategist, Offer Architect, Follow-up Engine, Deal Closer) passing data between each other multiply this risk -- a single poisoned or confused agent can cascade failures across the entire pipeline.

**Why it happens:**
- Agents programmed to "reflect and retry" when tools fail, but success criteria are ambiguous or unreachable
- Multi-agent handoffs create feedback loops where Agent A asks Agent B for clarification, Agent B asks Agent A back
- No token/cost budgets set per request or per session
- LangGraph state machines that lack explicit termination conditions

**How to avoid:**
- Set hard limits on every agent: `maxIterations=5`, `maxToolCalls=10`, per-request token budget (e.g., 4000 tokens max per agent step)
- Implement a global session cost ceiling (e.g., $0.50 per lead-to-deal pipeline run) that kills the entire workflow when exceeded
- Use LangGraph's built-in checkpointing to detect cycles -- if the same state appears twice, terminate
- Require explicit "DONE" or "ESCALATE_TO_HUMAN" terminal states in every agent's state machine
- Add a circuit breaker pattern: if any agent fails 3 times consecutively, halt the pipeline and notify the user

**Warning signs:**
- Single pipeline runs taking >30 seconds in development
- Token usage per request increasing over time without feature changes
- Agents producing repetitive outputs in logs
- API cost spikes visible in provider dashboards

**Phase to address:**
Phase 1 (Foundation) -- implement cost guards and iteration limits from the very first agent, before building multi-agent orchestration.

---

### Pitfall 2: Agent Hallucination of Financial Data and Tools

**What goes wrong:**
LLM agents hallucinate financial figures, fabricate API endpoints, or present invented market data as real analysis. In a broker context this is catastrophic -- a hallucinated stock price or invented property valuation could lead to real financial decisions. LangChain agents are documented to "confidently request POST /delete_user_account when only a read-only customer API was available" -- imagine the equivalent with financial endpoints.

**Why it happens:**
- LLMs fill gaps with plausible-sounding data when the real API call fails or returns incomplete data
- Tool descriptions in LangChain are vague, causing the agent to guess at available functionality
- No validation layer between agent output and user-facing display
- German-language prompts reduce model accuracy further (see Pitfall 7)

**How to avoid:**
- Never display agent-generated financial figures without cross-referencing the actual API response. Every number shown to the user must trace back to a real data source
- Use structured output schemas (Zod validation) for every agent response -- reject responses that don't match
- Implement a "source citation" requirement: agents must return the API endpoint and timestamp for every data point
- Tool descriptions must be precise and include explicit "you CANNOT do X" constraints
- Add a `FactChecker` validation step before any agent output reaches the UI

**Warning signs:**
- Agent responses containing round numbers or suspiciously clean data
- Responses that include data points not available from any connected API
- Agent using tool names that don't exist in the tool registry
- Financial figures that don't match what the raw API returns

**Phase to address:**
Phase 2 (Agent System) -- build validation layer alongside the first agent, not as an afterthought.

---

### Pitfall 3: API Keys Stored in localStorage Exposed via XSS

**What goes wrong:**
BYOK model stores user API keys (OpenAI, Anthropic, etc.) in localStorage. A single XSS vulnerability -- in your code, any npm dependency, or any third-party script -- gives an attacker full access to every stored API key. The attacker can then use those keys to make unlimited API calls at the user's expense, or worse, access any data the key permits.

**Why it happens:**
- localStorage is fully accessible to any JavaScript running on the page, with zero access control
- Modern web apps have dozens of npm dependencies, each a potential XSS vector
- Unlike httpOnly cookies, localStorage has no browser-level protection against script access
- Developers treat localStorage as "private" when it is fundamentally not

**How to avoid:**
- Encrypt API keys before storing in localStorage using a user-derived key (e.g., PBKDF2 from a PIN or passphrase). Keys are only decrypted in memory when making API calls
- Implement Content Security Policy (CSP) headers that strictly limit script sources -- no inline scripts, no eval()
- Use SubResource Integrity (SRI) hashes for all CDN-loaded scripts
- Run automated XSS scanning (e.g., with OWASP ZAP) on every release
- For Phase 2+, move to an encrypted IndexedDB store or a backend proxy that holds keys server-side
- Never log, display, or transmit decrypted keys -- mask them in the UI after initial entry

**Warning signs:**
- Any npm audit warning about XSS vulnerabilities in dependencies
- CSP headers missing or overly permissive
- API keys visible in browser DevTools Application tab without any encryption
- Third-party scripts loaded without SRI

**Phase to address:**
Phase 1 (Foundation) -- encryption wrapper for localStorage must be built before the BYOK system accepts any keys.

---

### Pitfall 4: Yahoo Finance Data Unreliability and Sudden Blocks

**What goes wrong:**
yfinance is not an official API -- it scrapes Yahoo Finance web endpoints. Yahoo actively rate-limits and blocks scraping patterns. In 2024-2025, Yahoo tightened enforcement significantly: bulk pulls that previously worked for 7,000 tickers now fail after ~950 with 429 errors. For a broker tool that needs reliable real-time market data, building on yfinance means the core product can break at Yahoo's whim with zero notice.

**Why it happens:**
- yfinance is a community scraping library, not a contracted API. Yahoo owes it nothing
- Yahoo changes HTML structures and rate limits without announcement
- IP-based blocking means all users on the same server share the rate limit
- No SLA, no support, no guaranteed uptime

**How to avoid:**
- Do NOT rely on yfinance as the sole or primary stock data source. Use it as a fallback only
- Implement a data provider abstraction layer from Day 1: `MarketDataProvider` interface with pluggable backends
- For v1 MVP, use Alpha Vantage free tier (500 requests/day) or Finnhub free tier as primary, yfinance as fallback
- Cache aggressively: stock prices don't need to be real-time for broker analysis. 15-minute delay is acceptable and dramatically reduces API calls
- Build stale-data indicators in the UI -- always show data age ("Updated 5 min ago")

**Warning signs:**
- 429 errors in logs from Yahoo Finance endpoints
- Data returning null/empty for previously working tickers
- Inconsistent data between development (low usage) and production (higher usage)

**Phase to address:**
Phase 1 (Foundation) -- data provider abstraction layer. Phase 3 (Market Data) -- implement multi-source fallback chain.

---

### Pitfall 5: CoinGecko Free Tier Rate Limits Choking the Crypto Dashboard

**What goes wrong:**
CoinGecko's free Demo plan allows only ~30 API calls per minute. A crypto dashboard showing live prices for even 20 coins with 30-second refresh cycles will exhaust this in under a minute. Add portfolio tracking, DeFi monitoring, and historical charts, and you exceed limits within seconds of page load.

**Why it happens:**
- Developers build "live" dashboards that poll per-coin, not realizing each coin is a separate API call
- CoinGecko's batch endpoints exist but are less well-documented
- No client-side caching strategy, so page refreshes re-fetch everything
- Multiple components independently fetching the same data

**How to avoid:**
- Use CoinGecko's batch endpoints: `/simple/price?ids=bitcoin,ethereum,...` fetches up to 250 coins in one call
- Implement a centralized data fetching service (singleton) that all components read from -- never let individual components call APIs directly
- Cache responses for 60 seconds minimum (crypto prices in a broker analysis tool don't need sub-second freshness)
- Use WebSocket-based alternatives (e.g., Binance public WebSocket) for truly live price tickers, reserving REST APIs for detailed data
- Show the user a "last updated" timestamp so they understand data freshness
- Implement exponential backoff with jitter on 429 responses

**Warning signs:**
- 429 errors appearing in the first minute of dashboard use
- Users reporting "prices not loading" intermittently
- API calls per page load exceeding 10

**Phase to address:**
Phase 3 (Crypto Dashboard) -- centralized data service must be the first thing built before any UI components.

---

### Pitfall 6: localStorage 5MB Limit and Data Loss

**What goes wrong:**
localStorage has a hard 5MB limit per origin in most browsers. A lead-to-deal pipeline generating AI analysis reports, market data snapshots, portfolio histories, and agent conversation logs will hit this limit fast. When the limit is hit, a `QuotaExceededError` is thrown silently, and new data simply fails to save. Users lose work without warning.

**Why it happens:**
- AI agent responses are verbose (easily 2-5KB per interaction)
- Market data snapshots accumulate over time
- No data lifecycle management -- old data never gets cleaned up
- Developers don't test with realistic data volumes during development

**How to avoid:**
- Implement storage monitoring from Day 1: track usage, warn users at 80% capacity
- Use IndexedDB for large data (conversation logs, market snapshots, portfolio data). Reserve localStorage only for small config/settings (<100KB)
- Implement data lifecycle: auto-archive conversations older than 30 days, compress stored data with LZ-string
- Build an explicit "Export Data" function early so users can backup before hitting limits
- Wrap all storage writes in try/catch to handle QuotaExceededError gracefully
- Design the data layer with a StorageAdapter pattern so migration to cloud sync is a backend swap, not a rewrite

**Warning signs:**
- Storage usage exceeding 2MB during testing
- QuotaExceededError in error logs
- Users reporting "data disappeared" or "settings reset"

**Phase to address:**
Phase 1 (Foundation) -- StorageAdapter abstraction and IndexedDB for large data. Phase 4+ -- cloud sync migration path.

---

### Pitfall 7: German-Language LLM Quality Degradation

**What goes wrong:**
LLMs perform measurably worse in German than English. German training data represents only ~0.17% of most models' training corpora. Accuracy drops significantly in longer conversations (6+ turns), instruction-following degrades because English-centric constraints don't map 1:1 to German, and agents produce grammatically awkward or incorrect German text. For a professional broker tool in the DACH market, unnatural or incorrect German destroys credibility instantly.

**Why it happens:**
- Training data imbalance: ~90% English, ~0.17% German
- German compound nouns, case system, and word order are structurally different from English
- Prompt engineering best practices are developed and tested in English
- Financial/legal German terminology is highly specialized and underrepresented in training data

**How to avoid:**
- Write all system prompts in English, then instruct the model to respond in German. English prompts produce better reasoning even for German output
- Create a domain-specific glossary of German financial terms (Rendite, Eigenkapitalquote, Grundbuch, etc.) and include it in system prompts
- Test all agent outputs with native German speakers before launch -- automated quality checks miss cultural and stylistic issues
- Use Claude or GPT-4 class models for German output (they handle German best). Do not rely on smaller/cheaper models for German-language generation
- Implement a "language quality" feedback button so users can flag bad German
- For critical outputs (client-facing offers, analysis reports), use a dedicated formatting/polishing step after the main agent

**Warning signs:**
- Agents mixing English words into German responses ("Das ist ein good Investment")
- Awkward compound nouns or incorrect grammatical cases
- Financial terminology that sounds translated rather than native
- Users reporting the tool "doesn't sound professional"

**Phase to address:**
Phase 2 (Agent System) -- German language testing must be part of agent validation from the start. Not something to "fix later."

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| All data in localStorage (no IndexedDB) | Faster MVP, simpler code | 5MB wall, data loss, painful migration | Never -- use IndexedDB for data, localStorage for config only |
| No data provider abstraction (direct API calls in components) | Faster initial development | Cannot swap providers, no caching layer, rate limit hell | Never -- abstraction layer takes 2 hours and saves weeks |
| Hardcoded agent prompts (no prompt management) | Quick iteration | Cannot A/B test, no version history, prompt changes require deploy | MVP only -- move to managed prompts before adding 3rd agent |
| No agent observability (no logging of token usage, latency) | Less infrastructure | Cannot debug production issues, invisible cost leaks | Never -- logging is trivial and essential |
| Single-provider BYOK (only OpenAI first) | Faster MVP | Users locked to one provider, harder to add providers later | MVP only -- design the interface for multi-provider from Day 1 even if only one is implemented |
| German UI with English error messages | Faster development | Breaks immersion, unprofessional for DACH market | MVP only -- internationalize error messages before beta |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Yahoo Finance (yfinance) | Treating it as a reliable API | Treat as unreliable scraper. Implement fallback chain, aggressive caching, stale-data UI indicators |
| CoinGecko API | One API call per coin | Use batch endpoints (`/simple/price`), centralized fetch service, 60s cache minimum |
| OpenAI/Anthropic APIs | No timeout or retry logic | Set 30s timeout, exponential backoff with jitter, circuit breaker after 3 failures |
| LangChain tool calling | Vague tool descriptions | Precise descriptions with explicit constraints ("You can ONLY read data, you CANNOT modify anything") |
| Multiple AI providers (BYOK) | Assuming identical behavior across providers | Each provider has different token limits, function calling formats, streaming behavior. Build provider-specific adapters behind a unified interface |
| CoinGecko WebSocket | Assuming free WebSocket access | CoinGecko does NOT offer free WebSocket. Use Binance public WebSocket for live tickers, CoinGecko REST for metadata |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Agent pipeline blocking UI | UI freezes during lead-to-deal analysis | Run all agent work in Web Workers or via backend API. Never run LangChain in the main thread | Immediately -- first user with slow internet |
| localStorage JSON.parse on every render | Page load slows as data grows | Parse once on app load, use in-memory state (React context/Zustand), write back on changes only | ~2MB stored data, ~500ms parse time |
| No pagination for lead/deal lists | Page becomes unresponsive | Virtual scrolling (react-window) for lists >50 items. Paginate API results | >100 leads/deals |
| Fetching all market data on dashboard load | Dashboard takes 10+ seconds to load | Lazy load: show cached data immediately, fetch fresh data in background. Load visible coins first | >10 watched assets |
| Re-rendering on every WebSocket price tick | CPU usage spikes, battery drain on laptops | Throttle price updates to max 1 render per second. Use `requestAnimationFrame` for visual updates | >5 live price streams |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API keys in localStorage without encryption | XSS attack steals all user API keys | Encrypt with user-derived key (PBKDF2), decrypt only in memory during API calls |
| Sending API keys to your own backend for proxying | Your server becomes a key aggregation target | BYOK means keys stay client-side. If you must proxy, use ephemeral session tokens, never store keys server-side |
| No CSP headers | Any XSS in any dependency compromises everything | Strict CSP: no inline scripts, no eval(), explicit script-src whitelist |
| Displaying raw LLM output as HTML | LLM can be prompt-injected to output malicious HTML/JS | Always sanitize LLM output (DOMPurify). Render as text or sanitized markdown only |
| Crypto wallet addresses in localStorage | Address correlation attack reveals user portfolio | If storing wallet addresses for portfolio tracking, encrypt them. Better: let users re-enter each session |
| No rate limiting on freemium tier | Malicious user burns through free API quota for all users | Implement per-IP and per-session rate limiting for the 5 free requests/day feature |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "AI is thinking..." with no progress | Users abandon after 5 seconds | Stream agent reasoning steps live: "Analyzing lead... Checking market data... Generating SWOT..." |
| Hiding data staleness | Users make decisions on stale data | Always show "Updated X minutes ago" on every data point. Color-code: green (<5min), yellow (5-30min), red (>30min) |
| Full German financial jargon without explanation | Intimidates non-expert brokers | Tooltips on every financial term. "Eigenkapitalquote (Equity Ratio): ..." |
| One-size-fits-all dashboard | Insurance brokers see crypto data they don't need | Broker profile selection on first launch determines which modules are visible. Let users customize |
| No undo/back in lead pipeline | Users lose work on accidental navigation | Auto-save every pipeline step. "Back" button preserves state. Explicit "Discard" required to lose data |
| Agent errors shown as technical messages | "Error: 429 Too Many Requests" means nothing to a broker | Human-readable error messages in German: "Marktdaten sind gerade nicht verfuegbar. Wir versuchen es in 30 Sekunden erneut." |

## "Looks Done But Isn't" Checklist

- [ ] **Lead-to-Deal Pipeline:** Often missing error recovery mid-pipeline -- verify that a failed agent step doesn't lose all previous steps' work
- [ ] **BYOK Provider Switching:** Often missing mid-conversation provider switch handling -- verify that switching from GPT to Claude doesn't lose conversation context
- [ ] **Crypto Portfolio:** Often missing handling of delisted/dead tokens -- verify that a token removed from CoinGecko doesn't crash the portfolio view
- [ ] **Market Analysis Agent:** Often missing disclaimer/legal notice -- verify that every AI-generated financial analysis includes "Keine Anlageberatung" disclaimer
- [ ] **Dark Mode:** Often missing chart/graph theming -- verify that all data visualizations (not just UI chrome) respect dark mode
- [ ] **Offline Mode:** Often missing conflict resolution -- verify that data entered offline syncs correctly when connectivity returns
- [ ] **Export/Report Generation:** Often missing proper German number formatting -- verify comma as decimal separator (1.234,56 not 1,234.56) and Euro symbol placement
- [ ] **Multi-agent Pipeline:** Often missing partial result display -- verify that if the Deal Closer agent fails, the user still sees Lead Scout and Market Analyst results

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Agent infinite loop (cost explosion) | MEDIUM | Implement cost cap retroactively, audit all agent configs, add monitoring. Lost money is gone |
| localStorage data loss (5MB exceeded) | HIGH | Data is likely unrecoverable. Implement IndexedDB migration, add storage monitoring, communicate with affected users |
| Yahoo Finance blocks all requests | LOW | Switch to fallback provider (Alpha Vantage/Finnhub). Requires data provider abstraction to already exist |
| API keys compromised via XSS | HIGH | Notify all users to rotate keys immediately. Implement encryption. Audit for XSS source. Reputation damage is lasting |
| German language quality complaints | MEDIUM | Add glossary to system prompts, switch to higher-quality model for German output, implement user feedback loop |
| Agent hallucinated financial data | HIGH | If users acted on false data: liability risk. Add validation layer, source citations, prominent disclaimers. Cannot undo real-world financial decisions |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Agent infinite loops / cost explosion | Phase 1 (Foundation) | Every agent has maxIterations, token budget, and circuit breaker before first deploy |
| API key XSS exposure | Phase 1 (Foundation) | Keys encrypted in storage, CSP headers active, XSS scan passes |
| localStorage 5MB limit | Phase 1 (Foundation) | IndexedDB used for data, localStorage only for config. Storage monitor shows <1MB usage after test scenarios |
| Yahoo Finance unreliability | Phase 1 (Foundation) + Phase 3 (Market Data) | DataProvider abstraction exists. Fallback chain tested. Cached data serves when primary fails |
| CoinGecko rate limits | Phase 3 (Crypto Dashboard) | Batch endpoints used. <5 API calls per dashboard load. 60s cache verified |
| Agent hallucination of financial data | Phase 2 (Agent System) | Every agent output passes Zod schema validation. Source citations present on all financial figures |
| German language quality | Phase 2 (Agent System) | Native speaker review of all agent prompt templates. Glossary of 50+ financial terms included in system prompts |
| Lead pipeline state loss | Phase 2 (Agent System) | Pipeline auto-saves after each step. Killing browser mid-pipeline resumes from last step on reload |
| Multi-provider BYOK differences | Phase 1 (Foundation) | Provider adapter interface defined. At least 2 providers work identically through the interface |
| Data staleness invisible to users | Phase 3 (Market Data) | Every data point shows timestamp. Stale data (>30min) visually flagged |

## Sources

- [Our $47,000 AI Agent Production Lesson](https://medium.com/@theabhishek.040/our-47-000-ai-agent-production-lesson-the-reality-of-a2a-and-mcp-60c2c000d904) -- Real-world multi-agent cost explosion post-mortem
- [Production Pitfalls of LangChain Nobody Warns You About](https://medium.com/codetodeploy/production-pitfalls-of-langchain-nobody-warns-you-about-44a86e2df29e) -- LangChain production failure modes
- [Agentic Resource Exhaustion: The "Infinite Loop" Attack](https://medium.com/@instatunnel/agentic-resource-exhaustion-the-infinite-loop-attack-of-the-ai-era-76a3f58c62e3) -- Agent loop attack vectors
- [LangChain Tooling Hell: Why Your Agent Keeps Hallucinating APIs](https://medium.com/@connect.hashblock/langchain-tooling-hell-why-your-agent-keeps-hallucinating-apis-4ebada05fd64) -- Tool hallucination patterns
- [CoinGecko API Rate Limits Documentation](https://docs.coingecko.com/docs/common-errors-rate-limit) -- Official rate limit specs
- [Why yfinance Keeps Getting Blocked](https://medium.com/@trading.dude/why-yfinance-keeps-getting-blocked-and-what-to-use-instead-92d84bb2cc01) -- Yahoo Finance scraping reliability
- [yfinance Rate Limit Issues (GitHub #2422)](https://github.com/ranaroussi/yfinance/issues/2422) -- Community reports of blocking
- [Why localStorage Is Unsafe for Tokens and Secrets](https://www.trevorlasn.com/blog/the-problem-with-local-storage) -- localStorage XSS risk analysis
- [The 5MB Ceiling: How Discovery Mode Can Crash Your Web App](https://www.robkjohnson.com/posts/localstorage-limits-crash-10mb-limit) -- localStorage limit real-world failures
- [Why LLM Performance Drops in Non-English Languages](https://lilt.com/blog/multilingual-llm-performance-gap-analysis) -- Multilingual LLM degradation analysis
- [German Language AI Models Benchmark](https://artificialanalysis.ai/models/multilingual/german) -- German LLM performance benchmarks
- [Mastering LangGraph State Management in 2025](https://sparkco.ai/blog/mastering-langgraph-state-management-in-2025) -- LangGraph production state management
- [LangGraph in 2026: Build Multi-Agent AI Systems That Actually Work](https://dev.to/ottoaria/langgraph-in-2026-build-multi-agent-ai-systems-that-actually-work-3h5) -- Current LangGraph best practices

---
*Pitfalls research for: BrokerPilot -- Multi-agent AI broker/finance/crypto dashboard*
*Researched: 2026-04-08*
