# 🚀 BrokerPilot — Go-Live Checkliste

> Diese Schritte sind **optional** — die App funktioniert komplett im Demo-Modus ohne Keys.
> Sobald du bereit bist, arbeite die Liste von oben nach unten ab.

---

## ⚡ Schnell-Setup (jeweils 5-15 Minuten)

### 1. 📝 Impressum-Daten eintragen (PFLICHT fuer DE)
- **Datei:** `client/src/components/landing/LegalPages.jsx`
- **Was:** Echte Adresse, Name, Kontaktdaten, USt-IdNr. eintragen
- **Wo:** Suche nach `[Platzhalter` — alle Platzhalter ersetzen
- **Aufwand:** 5 Minuten

### 2. 🔑 Supabase Projekt anlegen
- **URL:** https://supabase.com → Neues Projekt erstellen
- **Schema ausfuehren:** `supabase/schema.sql` im SQL-Editor ausfuehren
- **Keys in `.env`:**
  ```
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```
- **Aufwand:** 10 Minuten

### 3. 💳 Stripe Account einrichten
- **URL:** https://stripe.com → Account erstellen + verifizieren
- **Produkte anlegen:** Starter (kostenlos), Professional (49 EUR/Monat)
- **Keys in `.env`:**
  ```
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_PRO=price_...
  ```
- **Webhook URL:** `https://deine-domain.de/api/billing/webhook`
- **Aufwand:** 15 Minuten

### 4. 📡 Sentry Error-Tracking aktivieren
- **URL:** https://sentry.io → Neues React-Projekt erstellen
- **Keys in `.env`:**
  ```
  SENTRY_DSN=https://xxx@sentry.io/xxx
  VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
  ```
- **Aufwand:** 5 Minuten

### 5. 📧 E-Mail-Versand aktivieren
- **URL:** https://resend.com → API-Key erstellen
- **Keys in `.env`:**
  ```
  RESEND_API_KEY=re_...
  EMAIL_FROM=noreply@deine-domain.de
  ```
- **Aufwand:** 5 Minuten

### 6. 🌐 Custom Domain einrichten
- **Anleitung:** `docs/CUSTOM_DOMAIN.md`
- **Domain kaufen** bei Cloudflare, Namecheap oder INWX
- **DNS konfigurieren** (A-Records + CNAME)
- **GitHub Pages** Custom Domain setzen
- **Aufwand:** 10 Minuten

---

## ✅ Nach dem Setup

- [ ] Impressum ausgefuellt
- [ ] Supabase laeuft + Schema importiert
- [ ] Stripe Test-Zahlung erfolgreich
- [ ] Sentry empfaengt Events
- [ ] E-Mails werden zugestellt
- [ ] Custom Domain + HTTPS aktiv
- [ ] OG-Tags URL aktualisiert (`client/index.html`)
- [ ] Sitemap URLs aktualisiert (`client/public/sitemap.xml`)
- [ ] CORS neue Domain in `server/index.js` hinzugefuegt
- [ ] Railway Env-Vars gesetzt

---

## 🎯 Alle ENV-Variablen auf einen Blick

Siehe `.env.example` fuer die vollstaendige Liste. Setze diese in:
- **Lokal:** `.env` Datei im Root
- **Railway:** Settings → Variables
- **GitHub Actions:** Settings → Secrets → Actions

---

*Generiert am 2026-04-09 — BrokerPilot v1.0.0*
