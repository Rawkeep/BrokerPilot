# Custom Domain einrichten

## Option 1: GitHub Pages Custom Domain (Empfohlen)

### Schritt 1: Domain kaufen
Einen Domainnamen (z.B. `brokerpilot.de`) bei einem Registrar kaufen:
- **Empfohlen:** Cloudflare, Namecheap, INWX (deutsch)

### Schritt 2: DNS konfigurieren
Bei deinem DNS-Provider diese Records setzen:

```
Typ    Name    Wert
A      @       185.199.108.153
A      @       185.199.109.153
A      @       185.199.110.153
A      @       185.199.111.153
CNAME  www     rawkeep.github.io
```

### Schritt 3: GitHub Pages konfigurieren
1. Gehe zu: `github.com/Rawkeep/BrokerPilot/settings/pages`
2. Unter "Custom domain" deine Domain eintragen (z.B. `brokerpilot.de`)
3. "Enforce HTTPS" aktivieren
4. Die Datei `client/public/CNAME` wird automatisch erstellt

### Schritt 4: CNAME-Datei erstellen
```bash
echo "brokerpilot.de" > client/public/CNAME
```

### Schritt 5: Vite Config anpassen
In `vite.config.js` den `base` auf `/` setzen (statt `/BrokerPilot/`):
```js
base: process.env.VITE_CUSTOM_DOMAIN ? '/' : (process.env.VITE_API_URL ? '/BrokerPilot/' : '/'),
```

### Schritt 6: GitHub Actions anpassen
In `.github/workflows/deploy-pages.yml` env hinzufuegen:
```yaml
env:
  VITE_API_URL: https://brokerpilot-production.up.railway.app
  VITE_CUSTOM_DOMAIN: true
```

---

## Option 2: Railway Custom Domain (Backend)

### Schritt 1: Railway Dashboard
1. Gehe zu deinem Railway-Projekt
2. Settings → Domains → "Add Custom Domain"
3. Subdomain eintragen (z.B. `api.brokerpilot.de`)

### Schritt 2: DNS Record
```
Typ    Name    Wert
CNAME  api     [railway-domain].up.railway.app
```

### Schritt 3: Frontend Config
In GitHub Actions `VITE_API_URL` aktualisieren:
```yaml
VITE_API_URL: https://api.brokerpilot.de
```

---

## Option 3: Vercel (Alternative zu GitHub Pages)

Schnelleres CDN, automatische Previews:

```bash
npm i -g vercel
vercel --prod
```

Dann Custom Domain in Vercel Dashboard konfigurieren.

---

## Checkliste nach Domain-Setup

- [ ] DNS Records gesetzt
- [ ] HTTPS aktiv (SSL-Zertifikat)
- [ ] CNAME-Datei in `client/public/`
- [ ] `vite.config.js` base path angepasst
- [ ] `VITE_API_URL` in GitHub Actions aktualisiert
- [ ] OG-Tags URL in `client/index.html` aktualisiert
- [ ] Sitemap URLs aktualisiert
- [ ] CORS in `server/index.js` neue Domain hinzugefuegt
- [ ] Supabase Redirect-URLs aktualisiert
