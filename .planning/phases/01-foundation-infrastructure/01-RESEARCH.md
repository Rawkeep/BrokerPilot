# Phase 1: Foundation & Infrastructure - Research

**Researched:** 2026-04-08
**Domain:** Express 5 backend, Vite 8 + React 18 SPA, IndexedDB persistence, Web Crypto API encryption, Glassmorphism design system, Docker/Railway deployment
**Confidence:** HIGH

## Summary

Phase 1 builds a deployable application shell with no business logic. The core deliverables are: an Express 5 backend with security middleware and health check, a React 18 + Vite 8 frontend with Glassmorphism design system and multi-theme support, IndexedDB-based persistence via a StorageAdapter abstraction, encrypted BYOK API key storage using Web Crypto API (AES-256-GCM + PBKDF2), German-language UI shell with responsive layout, and Docker + Railway deployment.

The stack is well-defined from upstream decisions and prior research. Express 5 is now the `latest` tag on npm (v5.2.1) with native async error handling. IndexedDB replaces localStorage for data storage (avoiding the 5MB limit), with the `idb` library (v8.0.3) as the standard wrapper. Web Crypto API is browser-native and requires no external packages. The Glassmorphism design system uses CSS custom properties for multi-theme support across broker types.

**Primary recommendation:** Build the StorageAdapter abstraction and CryptoService first -- every other module depends on them. Use `idb` (not raw IndexedDB API) for the persistence layer and Zustand's persist middleware with a custom async storage adapter for state management.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Komplett eigener Glassmorphism-Look -- nicht CK klonen. Professioneller Finance-Look mit frosted glass effects, subtle shadows, modern spacing
- **D-02:** Multi-Theme-System je nach Broker-Typ: Immobilien = warme Farben, Krypto = dunkles Theme mit Neon-Akzenten, Finanz/Banking = Navy/Gold, Versicherung = vertrauensvolles Blau/Grau, Investment = clean/premium
- **D-03:** Typografie: Inter als primaere Schriftart -- professionell, exzellent lesbar fuer Zahlen/Charts, Dashboard-Standard
- **D-04:** Dark Mode + Light Mode mit System-Preference-Detection + manueller Toggle. Multi-Theme ueberlagert die Base-Themes
- **D-05:** Top-Navigation mit Tabs fuer Hauptsektionen -- horizontal, nicht Sidebar
- **D-06:** Kontextabhaengige Startseite je nach Broker-Typ: Immobilien = Pipeline-First, Krypto = Markt-First, Finanz/Banking = Dashboard-First
- **D-07:** Mobile: Hamburger-Menu (Slide-in von links) -- klassisch, platzsparend
- **D-08:** Hauptsektionen: Dashboard, Pipeline, Markt, AI-Agents, Einstellungen -- Reihenfolge variiert je nach Broker-Typ
- **D-09:** IndexedDB via StorageAdapter-Abstraction fuer alle Business-Daten (leads, pipeline, analyses). Nicht raw localStorage wegen 5MB-Limit
- **D-10:** localStorage nur fuer User-Settings (theme, broker-type, language preference)
- **D-11:** StorageAdapter-Interface ermoeglicht spaeteren Swap zu Cloud-Sync ohne App-Umbau
- **D-12:** Web Crypto API mit AES-256-GCM fuer BYOK API-Key-Verschluesselung. Key derived via PBKDF2 aus User-PIN/Passwort. Keine externen Packages
- **D-13:** Session-Unlock: User gibt einmal pro Session PIN ein, danach bleiben Keys entschluesselt bis Tab geschlossen wird
- **D-14:** Keys werden NIEMALS unverschluesselt in localStorage/IndexedDB gespeichert. Nur der verschluesselte Ciphertext + Salt + IV werden persistiert

### Claude's Discretion
- Glassmorphism blur-Intensitaet und Radius-Werte
- Exact Spacing-System (4px, 8px grid etc.)
- Animation-Easing und Transition-Dauer
- IndexedDB Schema-Design (store names, indices)
- Express middleware Reihenfolge
- Docker build optimization Strategie
- Railway health check Implementierung

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INF-01 | Express 5 backend with Helmet, CORS, rate limiting | CK server pattern verified, Express 5.2.1 confirmed on npm, helmet 8.1.0, cors 2.8.6, express-rate-limit 8.3.2 |
| INF-02 | Docker multi-stage build for production deployment | CK Dockerfile pattern verified -- two-stage: node:22-alpine builder + production |
| INF-03 | Railway deployment with health check endpoint | CK railway.json pattern verified -- DOCKERFILE builder + /api/health healthcheck |
| INF-04 | Server-side market data caching layer with configurable TTL | In-memory Map with TTL pattern -- no external dependency needed for v1. node-cache optional |
| DATA-01 | All user data persists in IndexedDB via StorageAdapter | `idb` v8.0.3 verified on npm as standard IndexedDB wrapper. Zustand persist middleware supports custom async storage |
| DATA-02 | User settings persist in localStorage | Zustand persist middleware with default localStorage storage -- straightforward |
| DATA-03 | BYOK API keys stored encrypted in browser (XSS-resistant) | Web Crypto API (AES-256-GCM + PBKDF2) -- browser-native, zero dependencies. Pattern well-documented |
| UI-01 | Glassmorphism UI with dark mode (light/dark toggle + system preference detection) | CSS custom properties + prefers-color-scheme media query + manual toggle pattern. Multi-theme overlay via broker-type class |
| UI-02 | German-language UI for all user-facing text | Static German strings in a centralized i18n object -- no library needed for single-language v1 |
| UI-03 | Responsive design -- mobile-first, works on tablet and desktop | CSS Grid/Flexbox + media queries. Top nav becomes hamburger on mobile (D-07) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: React 18 + Vite (Frontend), Express.js (Backend) -- decided, no alternatives
- **Datenhaltung**: localStorage-first for settings, IndexedDB for business data -- no cloud DB in v1
- **Sprache**: Deutsche UI, Code/Docs auf Englisch
- **Deployment**: Docker + Railway
- **APIs**: Nur kostenlose/Freemium-APIs
- **CSS**: Custom Glassmorphism CSS system -- no Tailwind

## Standard Stack

### Core (Phase 1 Only)

| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| React | 18.3.1 | UI framework | Decided. Latest React 18.x. React 19.2.4 exists but 18 is locked decision | [VERIFIED: npm registry] |
| React DOM | 18.3.1 | React renderer | Matches React version | [VERIFIED: npm registry] |
| Vite | 8.0.7 | Build tool / dev server | Latest stable Vite 8 | [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.1 | Vite React plugin | Fast Refresh, JSX transform for Vite 8 | [VERIFIED: npm registry] |
| Express | 5.2.1 | Backend API server | `latest` on npm since March 2025. Native async error handling | [VERIFIED: npm registry] |
| Zustand | 5.0.12 | Client state management | Decided. Lightweight store-based state management | [VERIFIED: npm registry] |
| React Router | 7.14.0 | Client-side routing | Current stable v7 | [VERIFIED: npm registry] |
| idb | 8.0.3 | IndexedDB wrapper | Standard promise-based IndexedDB API. Small (2KB), well-maintained | [VERIFIED: npm registry] |

### Supporting (Phase 1 Only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| helmet | 8.1.0 | Express security headers (CSP, HSTS, etc.) | Always -- HTTP security hardening | [VERIFIED: npm registry] |
| cors | 2.8.6 | CORS middleware | Always -- frontend/backend on different ports in dev | [VERIFIED: npm registry] |
| express-rate-limit | 8.3.2 | API rate limiting | Always -- protect backend endpoints | [VERIFIED: npm registry] |
| clsx | 2.1.1 | Conditional CSS classes | Glassmorphism component class composition | [VERIFIED: npm registry] |
| uuid | 13.0.0 | Unique ID generation | Lead IDs, session IDs | [VERIFIED: npm registry] |
| date-fns | 4.1.0 | Date formatting | German locale date formatting | [VERIFIED: npm registry] |
| @fontsource/inter | 5.2.8 | Self-hosted Inter font | Decided typography. Avoids Google Fonts CDN dependency | [VERIFIED: npm registry] |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1.3 | Unit/integration testing (Vite-native) | [VERIFIED: npm registry] |
| @testing-library/react | 16.3.2 | React component testing | [VERIFIED: npm registry] |
| ESLint | 10.2.0 | Linting (flat config format) | [VERIFIED: npm registry] |

### NOT Needed in Phase 1

| Library | Reason |
|---------|--------|
| LangGraph, LangChain, AI providers | Phase 4-5 |
| lightweight-charts, Recharts | Phase 3 |
| yahoo-finance2, CoinGecko | Phase 3 |
| Zod | Phase 4 (schema validation for AI output) -- could add in Phase 1 for form validation but not required |
| react-hot-toast | Phase 2+ (notifications for CRM actions) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `idb` | Raw IndexedDB API | 5x more boilerplate, error-prone callback patterns. idb adds 2KB for promise-based API |
| `idb` | Dexie.js | Dexie is heavier (20KB+), adds query DSL overkill for simple key-value + object store usage |
| @fontsource/inter | Google Fonts CDN | CDN adds external dependency, flash of unstyled text, GDPR concern for DACH market |
| Custom CSS + CSS variables | Tailwind CSS | Locked decision: no Tailwind. Custom CSS needed for Glassmorphism theming |
| CSS custom properties | CSS-in-JS (styled-components) | Runtime overhead, bundle size. CSS variables are zero-cost and work natively with theme switching |

**Installation:**
```bash
# Core frontend
npm install react@18.3.1 react-dom@18.3.1 react-router@7.14.0 zustand@5.0.12 idb@8.0.3 clsx@2.1.1 uuid@13.0.0 date-fns@4.1.0 @fontsource/inter@5.2.8

# Core backend
npm install express@5.2.1 helmet@8.1.0 cors@2.8.6 express-rate-limit@8.3.2

# Dev dependencies
npm install -D vite@8.0.7 @vitejs/plugin-react@6.0.1 vitest@4.1.3 @testing-library/react@16.3.2 eslint@10.2.0
```

## Architecture Patterns

### Recommended Project Structure

```
brokerpilot/
├── client/                        # React 18 + Vite 8 frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Shell: TopNav, HamburgerMenu, PageLayout
│   │   │   ├── ui/                # Glassmorphism primitives: GlassCard, GlassButton, GlassInput
│   │   │   ├── settings/          # BYOK key entry, broker-type selector, theme toggle
│   │   │   └── pages/             # Placeholder pages: Dashboard, Pipeline, Markt, AI-Agents, Einstellungen
│   │   ├── hooks/
│   │   │   ├── useTheme.js        # Dark/light mode + multi-theme + system preference
│   │   │   └── useCrypto.js       # Web Crypto API encrypt/decrypt operations
│   │   ├── stores/
│   │   │   ├── settingsStore.js   # Zustand: theme, broker-type, language (localStorage persist)
│   │   │   └── keyStore.js        # Zustand: encrypted key state (IndexedDB persist)
│   │   ├── services/
│   │   │   ├── storage.js         # StorageAdapter abstraction (IndexedDB via idb)
│   │   │   ├── crypto.js          # CryptoService: AES-256-GCM encrypt/decrypt + PBKDF2
│   │   │   └── api.js             # HTTP client (fetch wrapper for Express backend)
│   │   ├── i18n/
│   │   │   └── de.js              # German UI strings (single-language, no i18n framework)
│   │   ├── styles/
│   │   │   ├── variables.css      # CSS custom properties: colors, spacing, typography per theme
│   │   │   ├── glass.css          # Glassmorphism utility classes
│   │   │   ├── layout.css         # Grid, responsive breakpoints
│   │   │   └── themes/            # Per-broker-type theme overrides
│   │   │       ├── immobilien.css
│   │   │       ├── krypto.css
│   │   │       ├── finanz.css
│   │   │       ├── versicherung.css
│   │   │       └── investment.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                        # Express 5 backend
│   ├── index.js                   # Server entry, middleware stack, health check
│   ├── middleware/
│   │   └── cache.js               # In-memory cache with configurable TTL (INF-04)
│   └── routes/
│       └── health.js              # GET /api/health (Railway healthcheck)
├── shared/                        # Shared constants
│   ├── brokerTypes.js             # Broker type definitions + nav order + default start page
│   └── constants.js               # App-wide constants
├── Dockerfile
├── docker-compose.yml             # Local dev with hot-reload
├── railway.json
├── package.json
└── vitest.config.js
```

### Pattern 1: StorageAdapter Abstraction (DATA-01, DATA-11)

**What:** A unified interface for all data persistence that hides IndexedDB behind a simple async CRUD API. Enables future swap to cloud sync without changing consumer code.

**When to use:** All data reads and writes for business data (leads, pipeline, analyses).

**Example:**
```javascript
// Source: idb docs + Zustand persist custom storage pattern
// services/storage.js
import { openDB } from 'idb';

const DB_NAME = 'brokerpilot';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores during version upgrade
      if (!db.objectStoreNames.contains('leads')) {
        db.createObjectStore('leads', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'provider' });
      }
      if (!db.objectStoreNames.contains('analyses')) {
        db.createObjectStore('analyses', { keyPath: 'id' });
      }
    },
  });
}

// StorageAdapter interface
export const storageAdapter = {
  async getAll(storeName) {
    const db = await getDB();
    return db.getAll(storeName);
  },
  async get(storeName, key) {
    const db = await getDB();
    return db.get(storeName, key);
  },
  async put(storeName, value) {
    const db = await getDB();
    return db.put(storeName, value);
  },
  async delete(storeName, key) {
    const db = await getDB();
    return db.delete(storeName, key);
  },
  async clear(storeName) {
    const db = await getDB();
    return db.clear(storeName);
  },
};

// Custom Zustand storage for IndexedDB persistence
export function createIDBStorage(storeName) {
  return {
    getItem: async (name) => {
      const db = await getDB();
      const val = await db.get(storeName, name);
      return val ?? null;
    },
    setItem: async (name, value) => {
      const db = await getDB();
      await db.put(storeName, { key: name, value }, name);
    },
    removeItem: async (name) => {
      const db = await getDB();
      await db.delete(storeName, name);
    },
  };
}
```

### Pattern 2: CryptoService with Web Crypto API (DATA-03, D-12..D-14)

**What:** Browser-native encryption using AES-256-GCM with PBKDF2 key derivation from user PIN. Zero external dependencies. Encrypted ciphertext + salt + IV stored in IndexedDB; decrypted keys held only in memory during session.

**When to use:** All BYOK API key storage and retrieval.

**Example:**
```javascript
// Source: MDN Web Crypto API + github.com/bradyjoslin/webcrypto-example
// services/crypto.js

const PBKDF2_ITERATIONS = 600000; // OWASP 2024 recommendation for SHA-256
const SALT_LENGTH = 16; // 128-bit salt
const IV_LENGTH = 12;   // 96-bit IV for AES-GCM

async function deriveKey(pin, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Return salt + iv + ciphertext as a single buffer for storage
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...result)); // Base64 for IndexedDB storage
}

export async function decrypt(base64Data, pin) {
  const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(pin, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
```

### Pattern 3: Multi-Theme CSS Architecture (D-01, D-02, D-04)

**What:** Three-layer theme system: (1) base CSS variables, (2) dark/light mode override, (3) broker-type theme overlay. Applied via CSS classes on `<html>` element.

**When to use:** All UI components. Themes switch instantly via class changes.

**Example:**
```css
/* styles/variables.css */

/* Layer 1: Base tokens */
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --spacing-unit: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Glass properties */
  --glass-blur: 16px;
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Layer 2: Light mode (default) */
:root {
  --color-bg: #f5f5f7;
  --color-surface: #ffffff;
  --color-text: #1a1a2e;
  --color-text-secondary: #6b7280;
  --color-accent: #3b82f6;
}

/* Layer 2: Dark mode */
[data-theme="dark"] {
  --color-bg: #0a0a1a;
  --color-surface: #1a1a2e;
  --color-text: #e5e7eb;
  --color-text-secondary: #9ca3af;
  --color-accent: #60a5fa;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Layer 3: Broker-type overlays */
[data-broker="immobilien"] {
  --color-accent: #d97706;        /* Warm amber */
  --color-accent-light: #fbbf24;
}

[data-broker="krypto"] {
  --color-accent: #8b5cf6;        /* Neon purple */
  --color-accent-light: #a78bfa;
}

[data-broker="finanz"] {
  --color-accent: #1e3a5f;        /* Navy */
  --color-accent-secondary: #d4a843; /* Gold */
}

[data-broker="versicherung"] {
  --color-accent: #2563eb;        /* Trust blue */
  --color-accent-light: #93c5fd;
}

[data-broker="investment"] {
  --color-accent: #111827;        /* Clean premium black */
  --color-accent-light: #6b7280;
}
```

```css
/* styles/glass.css */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  padding: calc(var(--spacing-unit) * 6);
}
```

### Pattern 4: Express 5 Server with Async Error Handling (INF-01)

**What:** Express 5 natively catches async errors -- no `express-async-handler` wrapper needed. CSP configured for Glassmorphism (allows `blob:` for backdrop-filter) and Inter font loading.

**Example:**
```javascript
// server/index.js -- Express 5 pattern
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Needed for CSS-in-JS fallback
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],                       // Inter loaded via @fontsource (self-hosted)
      connectSrc: ["'self'"],                    // Will expand in Phase 4 for AI APIs
    },
  },
}));

app.use(cors({ origin: process.env.APP_URL || '*' }));
app.use(express.json());

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check (Railway healthcheck)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Express 5: async route handlers automatically forward errors
app.get('/api/cache/stats', async (_req, res) => {
  // No try/catch needed -- Express 5 handles promise rejections
  const stats = await getCacheStats();
  res.json(stats);
});

// SPA static files + fallback
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Express 5 error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`BrokerPilot server running on port ${PORT}`);
});
```

**Note on Express 5 wildcard routes:** Express 5 changed wildcard syntax from `app.get('*')` to `app.get('/{*path}')` with named catch-all parameter. [CITED: betterstack.com/community/guides/scaling-nodejs/express-5-new-features/]

### Pattern 5: Zustand with Split Storage (DATA-01, DATA-02)

**What:** Two Zustand stores with different persistence backends: settingsStore uses localStorage (sync, fast), keyStore uses IndexedDB via custom async storage (handles encrypted keys).

**Example:**
```javascript
// stores/settingsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system',       // 'light' | 'dark' | 'system'
      brokerType: null,       // 'immobilien' | 'krypto' | 'finanz' | 'versicherung' | 'investment'
      language: 'de',
      setTheme: (theme) => set({ theme }),
      setBrokerType: (type) => set({ brokerType: type }),
    }),
    {
      name: 'bp-settings',    // localStorage key
      // Default storage = localStorage -- no config needed
    }
  )
);

// stores/keyStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../services/storage.js';

export const useKeyStore = create(
  persist(
    (set, get) => ({
      encryptedKeys: {},       // { [provider]: base64EncryptedString }
      sessionUnlocked: false,  // True after PIN entry
      decryptedKeys: {},       // In-memory only -- NOT persisted
      setEncryptedKey: (provider, encrypted) =>
        set((s) => ({ encryptedKeys: { ...s.encryptedKeys, [provider]: encrypted } })),
      setSessionUnlocked: (unlocked) => set({ sessionUnlocked: unlocked }),
      setDecryptedKey: (provider, key) =>
        set((s) => ({ decryptedKeys: { ...s.decryptedKeys, [provider]: key } })),
      clearSession: () => set({ sessionUnlocked: false, decryptedKeys: {} }),
    }),
    {
      name: 'bp-keys',
      storage: createIDBStorage('settings'),
      // CRITICAL: Exclude decryptedKeys from persistence
      partialize: (state) => ({
        encryptedKeys: state.encryptedKeys,
      }),
    }
  )
);
```

### Anti-Patterns to Avoid

- **Raw IndexedDB without wrapper:** Callback-based API is error-prone. Always use `idb` for promise-based access.
- **Storing decrypted keys in Zustand persist:** The `partialize` option MUST exclude `decryptedKeys`. Only encrypted ciphertext is persisted.
- **Synchronous Zustand hydration with IndexedDB:** IndexedDB is async. The Zustand persist middleware handles this, but components must account for the hydration delay (show loading state until `onRehydrateStorage` fires).
- **Inline styles for theming:** Use CSS custom properties. Inline styles cannot leverage the three-layer theme cascade.
- **Google Fonts CDN for Inter:** GDPR concern for DACH market. Use `@fontsource/inter` for self-hosted fonts.
- **Express 4 patterns in Express 5:** No need for `express-async-handler` or manual try-catch in route handlers. Express 5 handles promise rejections natively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB access | Raw IndexedDB callbacks | `idb` v8.0.3 | Promise-based, typed, handles versioning/upgrades. 2KB |
| Encryption | Custom AES implementation | Web Crypto API (built-in) | Browser-native, hardware-accelerated, audited. Zero dependencies |
| UUID generation | Math.random-based IDs | `uuid` v13.0.0 | Cryptographically secure, collision-proof, standard format |
| Date formatting | Manual date string building | `date-fns` v4.1.0 with `de` locale | German locale support, relative time ("vor 3 Tagen"), tree-shakeable |
| CSS class composition | String concatenation | `clsx` v2.1.1 | Handles conditional classes cleanly, minimal footprint |
| Self-hosted fonts | Manual @font-face declarations | `@fontsource/inter` v5.2.8 | Variable font support, proper unicode ranges, automatic weight subsetting |
| Server-side cache | Custom Map with setTimeout | Simple Map + TTL wrapper (hand-roll OK here) | node-cache adds unnecessary dependency for a simple in-memory cache. A 20-line Map wrapper suffices for Phase 1 |

**Key insight:** The encryption and persistence layers are the critical "don't hand-roll" areas. Web Crypto API and `idb` are both browser-native or near-native solutions that handle edge cases (key derivation timing attacks, IndexedDB versioning) that custom implementations miss.

## Common Pitfalls

### Pitfall 1: Zustand Async Hydration Race Condition
**What goes wrong:** Zustand's persist middleware with async storage (IndexedDB) may render components with empty/default state before hydration completes. The store appears to "reset" briefly on every page load.
**Why it happens:** IndexedDB reads are async. Zustand creates the store with defaults immediately, then overwrites with persisted data once the async read completes.
**How to avoid:** Use `onRehydrateStorage` callback to track hydration state. Show a loading indicator until hydration completes. Never make destructive actions (clearing data) before hydration finishes.
**Warning signs:** Flash of empty state on page load. Settings appear to reset momentarily.

### Pitfall 2: Web Crypto API Error Handling
**What goes wrong:** `crypto.subtle.decrypt` throws a generic `DOMException` with no useful message when the PIN is wrong. Developers cannot distinguish "wrong PIN" from "corrupted data."
**Why it happens:** AES-GCM intentionally does not reveal why decryption failed (timing attack prevention). All failures throw the same error.
**How to avoid:** Wrap decrypt in try/catch. On failure, show user-friendly "Falscher PIN" message. Add a known-plaintext verification: encrypt a fixed test string alongside the API keys. If decrypting the test string succeeds, the PIN is correct.
**Warning signs:** Generic error messages instead of "wrong PIN" feedback.

### Pitfall 3: backdrop-filter Performance on Mobile
**What goes wrong:** Heavy use of `backdrop-filter: blur()` causes janky scrolling and high GPU usage on older mobile devices and some Android browsers.
**Why it happens:** Blur is GPU-intensive. Stacking multiple glass layers compounds the cost. Some Android browsers fall back to software rendering.
**How to avoid:** Limit nested glass layers to max 2 deep. Use `will-change: transform` on glass elements. Provide a reduced-motion fallback with solid semi-transparent backgrounds. Test on mid-range Android.
**Warning signs:** Scrolling framerate below 30fps on mobile. Battery drain complaints.

### Pitfall 4: Express 5 Wildcard Route Syntax Change
**What goes wrong:** `app.get('*')` from Express 4 patterns throws an error in Express 5 or behaves unexpectedly.
**Why it happens:** Express 5 requires named parameters for catch-all routes: `app.get('/{*path}')`.
**How to avoid:** Use `app.get('/{*path}')` for the SPA fallback route. Test that all frontend routes correctly fall through to index.html.
**Warning signs:** 404 errors on client-side route navigation after page refresh.

### Pitfall 5: CSP Blocking Glassmorphism
**What goes wrong:** Strict CSP headers from Helmet block `backdrop-filter` rendering or Inter font loading.
**Why it happens:** Default Helmet CSP is very restrictive. `style-src` must allow inline styles if any component uses them. `font-src` must include `'self'` for @fontsource.
**How to avoid:** Test CSP in production mode during development. Use browser DevTools Console to spot CSP violations. Configure Helmet CSP directives explicitly (see Pattern 4 example).
**Warning signs:** Glass effects not rendering in production while working in dev. Console showing CSP violation errors.

### Pitfall 6: IndexedDB Storage Blocked in Incognito/Private Mode
**What goes wrong:** Some browsers restrict IndexedDB in private/incognito mode. Firefox historically threw errors, Safari had quota limits.
**Why it happens:** Privacy modes restrict persistent storage to prevent tracking.
**How to avoid:** Wrap all IndexedDB operations in try/catch. Fall back to in-memory storage if IndexedDB is unavailable. Show a warning: "Daten werden in diesem Browser-Modus nicht gespeichert."
**Warning signs:** `openDB()` throwing errors in incognito tabs.

## Code Examples

### Session-PIN Unlock Flow (D-13)

```javascript
// Verified pattern from Web Crypto API docs + idb
// hooks/useCrypto.js

import { encrypt, decrypt } from '../services/crypto.js';
import { useKeyStore } from '../stores/keyStore.js';

export function useSessionUnlock() {
  const {
    encryptedKeys, sessionUnlocked, setSessionUnlocked,
    setDecryptedKey, clearSession,
  } = useKeyStore();

  async function unlockSession(pin) {
    // Decrypt all stored keys with the provided PIN
    const providers = Object.keys(encryptedKeys);
    for (const provider of providers) {
      try {
        const decrypted = await decrypt(encryptedKeys[provider], pin);
        setDecryptedKey(provider, decrypted);
      } catch {
        // Wrong PIN -- AES-GCM throws generic DOMException
        clearSession();
        throw new Error('Falscher PIN');
      }
    }
    setSessionUnlocked(true);
  }

  // Clear session on tab close
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', clearSession);
  }

  return { unlockSession, sessionUnlocked };
}
```

### System Theme Detection (D-04)

```javascript
// hooks/useTheme.js
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore.js';

export function useTheme() {
  const { theme, brokerType, setTheme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Resolve effective theme
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);
    if (brokerType) {
      root.setAttribute('data-broker', brokerType);
    }

    // Listen for system preference changes when in 'system' mode
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, brokerType]);

  return { theme, setTheme, brokerType };
}
```

### Docker Multi-Stage Build (INF-02)

```dockerfile
# Updated from CK pattern for Node 22 LTS + Express 5
# Stage 1: Build Frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
COPY shared/ ./shared/
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
```

### Railway Configuration (INF-03)

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyMaxRetries": 3
  }
}
```

### In-Memory Cache with TTL (INF-04)

```javascript
// server/middleware/cache.js
const cache = new Map();

export function createCacheMiddleware(defaultTTL = 5 * 60 * 1000) {
  return {
    get(key) {
      const entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key, data, ttl = defaultTTL) {
      cache.set(key, { data, expires: Date.now() + ttl });
    },
    clear() {
      cache.clear();
    },
    stats() {
      return { size: cache.size, keys: Array.from(cache.keys()) };
    },
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Express 4 with express-async-handler | Express 5 native async handling | March 2025 | No wrapper packages needed for async routes |
| Express 4 `app.get('*')` | Express 5 `app.get('/{*path}')` | Express 5.0.0 | Must update all wildcard routes |
| Zustand 4.x `create()` | Zustand 5.x `create()` (same API) | 2025 | Zustand 5 is API-compatible with 4. No migration needed |
| Raw IndexedDB | `idb` promise wrapper | Ongoing | `idb` v8 is the de facto standard. No reason to use raw API |
| PBKDF2 100,000 iterations | PBKDF2 600,000 iterations | OWASP 2024 | Higher iteration count for SHA-256 recommended |
| Google Fonts CDN | @fontsource self-hosted | Ongoing | GDPR compliance for DACH, no external requests |

**Deprecated/outdated:**
- Express 4: Still works but Express 5 is `latest`. No reason to start new projects on 4
- `express-async-handler` package: Unnecessary with Express 5
- `node-cache` for simple use cases: A 20-line Map wrapper is sufficient for Phase 1

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | @vitejs/plugin-react 6.0.1 is compatible with Vite 8.0.7 | Standard Stack | Build failure -- would need to pin an older vite or newer plugin version |
| A2 | Zustand 5.0.12 persist middleware works identically to 4.x docs for custom storage | Architecture Patterns | Hydration behavior may differ -- test early |
| A3 | PBKDF2 600,000 iterations runs within 200ms on mid-range mobile devices | Code Examples | If too slow, reduce to 310,000 (OWASP minimum for SHA-256) |
| A4 | `backdrop-filter` is supported in all target browsers (Chrome, Firefox, Safari, Edge) | Common Pitfalls | Firefox support was added in v103 (2022) -- should be fine for 2026 |

## Open Questions

1. **Vite 8 proxy configuration for Express backend**
   - What we know: Vite 6 uses `server.proxy` in vite.config.js. Vite 8 should be identical.
   - What's unclear: Whether Vite 8 changed any proxy configuration syntax
   - Recommendation: Test during scaffolding. Fall back to Vite 6 proxy pattern.

2. **Node 22 vs Node 25 for Docker**
   - What we know: Express 5 requires Node >= 18. Local machine has Node 25.8.0. Node 22 is current LTS.
   - What's unclear: Whether Node 25 Alpine images are available on Docker Hub
   - Recommendation: Use Node 22 LTS Alpine in Docker for stability. Dev locally with Node 25.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Yes | 25.8.0 | Use 22 LTS in Docker |
| npm | Package install | Yes | (bundled) | -- |
| Docker | INF-02, INF-03 | Yes | 29.2.1 | -- |
| Web Crypto API | DATA-03 | Yes (browser-native) | -- | -- |
| IndexedDB | DATA-01 | Yes (browser-native) | -- | In-memory fallback for incognito |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | vitest.config.js (Wave 0 creation) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INF-01 | Express starts, health check responds | integration | `npx vitest run tests/server/health.test.js -x` | Wave 0 |
| INF-02 | Docker build succeeds | smoke | `docker build -t bp-test .` | Wave 0 |
| INF-03 | Railway config valid | unit | `npx vitest run tests/server/railway.test.js -x` | Wave 0 |
| INF-04 | Cache set/get/TTL-expire | unit | `npx vitest run tests/server/cache.test.js -x` | Wave 0 |
| DATA-01 | StorageAdapter CRUD with IndexedDB | unit | `npx vitest run tests/services/storage.test.js -x` | Wave 0 |
| DATA-02 | Settings persist in localStorage | unit | `npx vitest run tests/stores/settings.test.js -x` | Wave 0 |
| DATA-03 | Encrypt/decrypt roundtrip with CryptoService | unit | `npx vitest run tests/services/crypto.test.js -x` | Wave 0 |
| UI-01 | Theme toggle applies correct data attributes | unit | `npx vitest run tests/hooks/useTheme.test.js -x` | Wave 0 |
| UI-02 | German strings load correctly | unit | `npx vitest run tests/i18n/de.test.js -x` | Wave 0 |
| UI-03 | Responsive breakpoints apply | manual-only | Visual inspection on mobile/tablet/desktop | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before /gsd-verify-work

### Wave 0 Gaps
- [ ] `vitest.config.js` -- framework config with jsdom for browser APIs
- [ ] `tests/services/crypto.test.js` -- CryptoService roundtrip tests (needs Web Crypto API polyfill or `@vitest/browser`)
- [ ] `tests/services/storage.test.js` -- StorageAdapter tests (needs `fake-indexeddb` polyfill for Node)
- [ ] `tests/server/health.test.js` -- Express health check integration test
- [ ] `tests/server/cache.test.js` -- TTL cache unit tests
- [ ] `tests/stores/settings.test.js` -- Zustand persist middleware tests
- [ ] `tests/hooks/useTheme.test.js` -- Theme toggle tests
- [ ] `tests/i18n/de.test.js` -- German string completeness check
- [ ] `fake-indexeddb` dev dependency for testing IndexedDB in Node

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (no user auth in v1) | -- |
| V3 Session Management | Partial (PIN session) | In-memory session state, cleared on tab close |
| V4 Access Control | No | -- |
| V5 Input Validation | Yes | Zod schemas for API inputs (Phase 4), manual validation for PIN format |
| V6 Cryptography | Yes | Web Crypto API AES-256-GCM + PBKDF2 (browser-native, no hand-rolled crypto) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing encrypted API keys | Information Disclosure | CSP headers via Helmet, no inline scripts, no eval() |
| Brute-force PIN attack | Elevation of Privilege | PBKDF2 600K iterations makes brute-force costly. Add lockout after N attempts |
| API key exposure in DevTools | Information Disclosure | Keys only in memory after unlock. Encrypted ciphertext in IndexedDB is useless without PIN |
| CORS misconfiguration | Tampering | Explicit origin whitelist in production, not `*` |
| Rate limit bypass | Denial of Service | express-rate-limit on all /api/ routes |

## Sources

### Primary (HIGH confidence)
- npm registry -- all package versions verified via `npm view` on 2026-04-08
- CK codebase -- Dockerfile, server/index.js, railway.json, vite.config.js patterns verified locally
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) -- AES-GCM + PBKDF2 documentation

### Secondary (MEDIUM confidence)
- [Express 5 Async Error Handling](https://dev.to/siddharth_g/express-5-brings-built-in-promise-support-for-error-handling-5bjf) -- confirmed native promise support
- [Express 5 Migration Guide](https://betterstack.com/community/guides/scaling-nodejs/express-5-new-features/) -- wildcard route syntax change
- [Dark Glassmorphism 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) -- design patterns
- [Zustand Persist + IndexedDB](https://github.com/pmndrs/zustand/discussions/1721) -- custom async storage pattern
- [Zustand Persist Docs](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- official persist middleware docs
- [webcrypto-example](https://github.com/bradyjoslin/webcrypto-example) -- AES-GCM + PBKDF2 reference implementation

### Tertiary (LOW confidence)
- [Glassmorphism Implementation Guide 2025](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide) -- CSS patterns (general web article)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH -- patterns derived from CK codebase (verified) and official library docs
- Pitfalls: HIGH -- multi-source verified, specific to this tech stack
- Encryption: HIGH -- Web Crypto API is a W3C standard, patterns from MDN
- Glassmorphism: MEDIUM -- CSS patterns are well-established but multi-theme overlay is custom

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days -- stable stack, no fast-moving dependencies)
