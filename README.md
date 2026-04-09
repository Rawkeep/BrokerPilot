# BrokerPilot

Das KI-gestuetzte Broker-CRM der naechsten Generation.

**Live Demo:** [rawkeep.github.io/BrokerPilot/welcome](https://rawkeep.github.io/BrokerPilot/welcome)

---

## Features

| Bereich | Was |
|---------|-----|
| **CRM** | Kanban-Pipeline, Lead-Detail, Custom Fields, Tags, Bulk-Actions |
| **KI-Agenten** | Lead-Qualifizierer, Marktanalyst, SWOT-Stratege, Auto-Pilot |
| **E-Mail** | 25 Templates, KI-Personalisierung, Drip-Kampagnen |
| **Workflows** | Visueller Builder mit 7 Aktionstypen und 6 Triggern |
| **Lead-Scoring** | Automatisch 0-100, Hot/Warm/Cold Tiers |
| **Kalender** | Monats- und Agendaansicht, Termintypen, Erinnerungen |
| **Team** | Mitglieder, Rollen, Leaderboard, Lead-Zuweisung |
| **Analytics** | KPIs, Conversion Funnels, Revenue Charts, PDF-Reports |
| **Client Portal** | Oeffentliche Angebotsseite mit E-Signatur |
| **Market Intelligence** | Trend-Erkennung, SMA Crossovers, Alerts |
| **Notifications** | In-App Center, Push Notifications, Bell-Icon |
| **Payment** | Stripe Checkout, Subscriptions, SEPA + Kreditkarte |
| **Mobile** | Bottom-Nav, Swipe-Kanban, Touch-optimiert, PWA |
| **i18n** | Deutsch + English, automatische Spracherkennung |
| **Monitoring** | Sentry Error-Tracking, Health Dashboard |

## 5 Broker-Typen

Jeder mit eigener Pipeline, Feldern und KI-Konfiguration:

- **Immobilien** — Besichtigung, Finanzierung, Notartermin
- **Krypto** — KYC, Portfolio-Planung, Monitoring
- **Finanz & Banking** — Beratung, Analyse, Abschluss
- **Versicherung** — Bedarfsanalyse, Antrag, Police
- **Investment-Banking** — Due Diligence, Bewertung, Signing

## Tech-Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | React 19 + Vite 8, Zustand, CSS Variables |
| **Backend** | Express 5, Node.js |
| **Auth & DB** | Supabase (Auth, PostgreSQL, Storage, RLS) |
| **KI** | BYOK Multi-Provider (Claude, GPT, Gemini, Mistral, Groq) |
| **Payment** | Stripe (Checkout, Subscriptions, Webhooks) |
| **Monitoring** | Sentry (Frontend + Backend) |
| **E-Mail** | Resend / SMTP (Nodemailer) |
| **Testing** | Playwright E2E (34 Tests) |
| **CI/CD** | GitHub Actions (Lint, Build, E2E, Deploy) |
| **Hosting** | GitHub Pages (Frontend) + Railway (Backend) |

## Schnellstart

```bash
# Repository klonen
git clone https://github.com/Rawkeep/BrokerPilot.git
cd BrokerPilot

# Dependencies installieren
npm install

# Development starten (Frontend + Backend)
npm run dev        # Frontend auf localhost:5173
node server/index.js  # Backend auf localhost:3000
```

Die App funktioniert komplett im **Demo-Modus** ohne externe Services.

## Go-Live

> **[docs/GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md)** — Schritt-fuer-Schritt Anleitung zur Produktiv-Schaltung mit Supabase, Stripe, Sentry und Custom Domain.

## Tests

```bash
npm run test:e2e          # Headless E2E Tests
npm run test:e2e:headed   # Mit Browser sichtbar
npm run test:e2e:ui       # Playwright UI Mode
```

## Projektstruktur

```
BrokerPilot/
  client/              # React Frontend
    src/
      components/      # UI Komponenten (BEM)
      stores/          # Zustand State Management
      services/        # Business Logic
      styles/          # CSS (Variables + BEM)
      i18n/            # Deutsch + English
      lib/             # Sentry, Supabase
  server/              # Express Backend
    routes/            # API Endpoints
    services/          # Business Services
    lib/               # Sentry
  shared/              # Geteilte Typen & Konstanten
  tests/e2e/           # Playwright Tests
  docs/                # Dokumentation
  .github/workflows/   # CI/CD Pipelines
```

## Lizenz

Proprietaer — Alle Rechte vorbehalten.
