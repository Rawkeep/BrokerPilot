# BrokerPilot

## What This Is

BrokerPilot ist ein KI-gestütztes Multi-Agent-Dashboard für Broker, Banker und Investoren im DACH-Raum. Es automatisiert den gesamten Workflow von Lead-Generierung über Marktanalyse (Aktien, Immobilien, Krypto) bis zum Deal-Abschluss. Deutsche UI, BYOK-Modell, alle Broker-Typen in einer Plattform.

## Core Value

Ein Broker kann einen Lead in 5 Minuten durch die komplette Pipeline führen — von der Qualifizierung über KI-gestützte Marktanalyse bis zum personalisierten Angebot — statt Stunden mit manueller Recherche zu verbringen.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-Broker-Dashboard mit konfigurierbaren Broker-Profilen (Immobilien, Versicherung, Finanz, Krypto, Investment-Banking)
- [ ] Lead-to-Deal Pipeline: Lead-Erfassung → Qualifizierung → Analyse → Angebot → Follow-up → Abschluss
- [ ] KI-Agenten-System: Lead Scout, Market Analyst, SWOT Strategist, Offer Architect, Follow-up Engine, Deal Closer
- [ ] Echtzeit-Marktdaten für Aktien, Immobilien UND Krypto (Yahoo Finance, CoinGecko, etc.)
- [ ] Krypto-Dashboard: Live-Preise, Portfolio-Tracking, DeFi-Monitoring
- [ ] Investment Portfolio Manager: Diversifikations-Analyse, Risiko-Scoring
- [ ] BYOK Multi-Provider AI (Claude, GPT, Gemini, Mistral, Groq, OpenRouter) mit Freemium-Gate
- [ ] localStorage-Persistenz mit späterer Cloud-Sync-Option
- [ ] LangChain/LangGraph Agent-Orchestrierung für Multi-Agent-Workflows
- [ ] context-mode MCP-Server Integration für Session-Persistenz über Wochen
- [ ] Glassmorphism UI mit Dark Mode (inspiriert von CK-Design)
- [ ] Deutsche UI für DACH-Markt

### Out of Scope

- Native Mobile App — Web-first, responsive Design reicht für v1
- Eigene Brokerage/Trading-Execution — wir analysieren und empfehlen, führen keine Trades aus
- Regulatorische Compliance-Engine — kein Rechtsberatungs-Tool, Disclaimer reicht
- Multi-Tenancy / Team-Features — Einzelnutzer-Tool in v1
- Eigene KI-Modelle trainieren — BYOK-Ansatz nutzt bestehende Provider

## Context

- Baut konzeptionell auf Circle Keeper (CK) auf — übernimmt den useUniversalAI.js Hook (6 Provider, BYOK, Streaming) und das Glassmorphism-Designsystem
- Drei GitHub-Repos als Basis: context-mode (MCP-Server, 98% Context-Kompression), langchain (Agent-Orchestrierung), API-mega-list (10.498 APIs inkl. Finance, Trading, Krypto)
- Zielgruppe: Selbstständige Broker und Berater im DACH-Raum
- Erster Wow-Moment: Lead-to-Deal Pipeline — ein Lead kommt rein, KI analysiert, bewertet und erstellt personalisiertes Angebot

## Constraints

- **Tech Stack**: React 18 + Vite 6 (Frontend), Express.js (Backend), LangChain (Agents) — bewährter Stack aus CK
- **Datenhaltung**: localStorage-first, keine Cloud-DB in v1 — schneller MVP
- **Monetarisierung**: BYOK + Freemium (5 Free-Requests/Tag) — kein eigener API-Proxy nötig
- **Sprache**: Deutsche UI, Code/Docs auf Englisch
- **APIs**: Nur kostenlose/Freemium-APIs für v1 (Yahoo Finance, CoinGecko, etc.)
- **Deployment**: Docker + Railway (wie CK)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Neues Repo statt CK-Erweiterung | Trennung der Projekte, kein Feature-Bloat in CK | — Pending |
| Alle Broker-Typen gleichzeitig | Breitere Zielgruppe von Anfang an, modulares Agent-System macht es möglich | — Pending |
| Lead-to-Deal als MVP-Fokus | Größter Wow-Moment, differenziert von reinen Dashboard-Tools | — Pending |
| localStorage-first | Schnellerer MVP, bewährt aus CK, Cloud-Sync als späteres Upgrade | — Pending |
| BYOK + Freemium | Kein eigener API-Cost, User kontrolliert Kosten, bewährt aus CK | — Pending |
| LangChain für Agent-Orchestrierung | Industriestandard, große Community, LangGraph für komplexe Workflows | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after initialization*
