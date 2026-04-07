# Phase 1: Foundation & Infrastructure - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Deployable application shell with Express 5 backend, IndexedDB persistence layer, encrypted BYOK API key storage, Glassmorphism design system with multi-theme support, German-language UI shell, and Docker + Railway deployment. No business logic, no AI features, no CRM — pure foundation.

</domain>

<decisions>
## Implementation Decisions

### Visual Design
- **D-01:** Komplett eigener Glassmorphism-Look — nicht CK klonen. Professioneller Finance-Look mit frosted glass effects, subtle shadows, modern spacing
- **D-02:** Multi-Theme-System je nach Broker-Typ: Immobilien = warme Farben, Krypto = dunkles Theme mit Neon-Akzenten, Finanz/Banking = Navy/Gold, Versicherung = vertrauensvolles Blau/Grau, Investment = clean/premium
- **D-03:** Typografie: Inter als primäre Schriftart — professionell, exzellent lesbar für Zahlen/Charts, Dashboard-Standard
- **D-04:** Dark Mode + Light Mode mit System-Preference-Detection + manueller Toggle. Multi-Theme überlagert die Base-Themes

### Navigation & Layout
- **D-05:** Top-Navigation mit Tabs für Hauptsektionen — horizontal, nicht Sidebar
- **D-06:** Kontextabhängige Startseite je nach Broker-Typ: Immobilien = Pipeline-First, Krypto = Markt-First, Finanz/Banking = Dashboard-First
- **D-07:** Mobile: Hamburger-Menü (Slide-in von links) — klassisch, platzsparend
- **D-08:** Hauptsektionen: Dashboard, Pipeline, Markt, AI-Agents, Einstellungen — Reihenfolge variiert je nach Broker-Typ

### Storage Architecture
- **D-09:** IndexedDB via StorageAdapter-Abstraction für alle Business-Daten (leads, pipeline, analyses). Nicht raw localStorage wegen 5MB-Limit
- **D-10:** localStorage nur für User-Settings (theme, broker-type, language preference)
- **D-11:** StorageAdapter-Interface ermöglicht späteren Swap zu Cloud-Sync ohne App-Umbau

### Key Encryption
- **D-12:** Web Crypto API mit AES-256-GCM für BYOK API-Key-Verschlüsselung. Key derived via PBKDF2 aus User-PIN/Passwort. Keine externen Packages
- **D-13:** Session-Unlock: User gibt einmal pro Session PIN ein, danach bleiben Keys entschlüsselt bis Tab geschlossen wird
- **D-14:** Keys werden NIEMALS unverschlüsselt in localStorage/IndexedDB gespeichert. Nur der verschlüsselte Ciphertext + Salt + IV werden persistiert

### Claude's Discretion
- Glassmorphism blur-Intensität und Radius-Werte
- Exact Spacing-System (4px, 8px grid etc.)
- Animation-Easing und Transition-Dauer
- IndexedDB Schema-Design (store names, indices)
- Express middleware Reihenfolge
- Docker build optimization Strategie
- Railway health check Implementierung

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — Technology choices: React 18, Vite 8, Express 5, Zustand, lightweight-charts, Web Crypto API recommendations
- `.planning/research/ARCHITECTURE.md` — Two-tier AI architecture, component boundaries, server-side agent layer
- `.planning/research/PITFALLS.md` — IndexedDB statt localStorage, encrypted key storage, XSS attack surface warnings

### Project
- `.planning/PROJECT.md` — Vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Requirements INF-01..04, DATA-01..03, UI-01..03

No external specs — requirements fully captured in decisions above and referenced files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CK's `useUniversalAI.js` hook (628 lines) — BYOK multi-provider logic, can be adapted for the AI proxy layer. Provider registry, key management, streaming support
- CK's dark mode implementation pattern — system preference detection + manual toggle + localStorage persistence

### Established Patterns
- Greenfield project — no existing patterns to follow or break. Freedom to establish clean conventions
- CK uses CSS-in-JS (inline styles) — BrokerPilot should evaluate whether to continue this or use CSS Modules/Tailwind for the theme system

### Integration Points
- Express 5 backend serves both the SPA and will host the AI proxy endpoints (Phase 4)
- Market data caching layer (INF-04) will be used by Phase 3 market data integrations
- StorageAdapter will be consumed by Phase 2 CRM and Phase 5 agent results storage

</code_context>

<specifics>
## Specific Ideas

- Multi-Theme je nach Broker-Typ ist einzigartig — kein anderes Broker-Tool bietet adaptive Themes
- Inter Font optimal für Finanzzahlen und Dashboard-Tabellen
- Kontextabhängige Startseite verstärkt den "made for YOUR broker type" Eindruck
- Session-PIN für Key-Unlock — guter Kompromiss zwischen Sicherheit und UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-infrastructure*
*Context gathered: 2026-04-08*
