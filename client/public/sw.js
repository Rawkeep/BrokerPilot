// BrokerPilot Service Worker v1
const CACHE_NAME = 'brokerpilot-v1';
const BASE_PATH = '/BrokerPilot/';

// Assets to precache during install
const PRECACHE_URLS = [
  BASE_PATH,
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon.svg'
];

// Offline fallback HTML served when network is unavailable
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrokerPilot — Offline</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
         background:#0f172a;color:#e2e8f0;display:flex;align-items:center;
         justify-content:center;min-height:100vh;text-align:center;padding:2rem}
    .container{max-width:420px}
    .icon{font-size:4rem;margin-bottom:1.5rem}
    h1{font-size:1.5rem;color:#f59e0b;margin-bottom:0.75rem}
    p{font-size:1rem;line-height:1.6;color:#94a3b8;margin-bottom:1.5rem}
    button{background:#f59e0b;color:#0f172a;border:none;padding:0.75rem 2rem;
           border-radius:0.5rem;font-size:1rem;font-weight:600;cursor:pointer;
           transition:background 0.2s}
    button:hover{background:#d97706}
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#128268;</div>
    <h1>Keine Verbindung</h1>
    <p>BrokerPilot ist gerade offline. Bitte pr&uuml;fen Sie Ihre Internetverbindung und versuchen Sie es erneut.</p>
    <button onclick="location.reload()">Erneut versuchen</button>
  </div>
</body>
</html>`;

// ─── Install: precache static assets ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('brokerpilot-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') return;

  // API calls: network-first with no cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith(BASE_PATH + 'api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (CSS, JS, fonts, images): cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages): network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

// ─── Push notifications for follow-up reminders ────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'BrokerPilot', body: 'Neue Benachrichtigung', url: BASE_PATH };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: BASE_PATH + 'icons/icon.svg',
    badge: BASE_PATH + 'icons/icon.svg',
    tag: data.tag || 'brokerpilot-notification',
    renotify: !!data.tag,
    data: { url: data.url || BASE_PATH },
    actions: data.actions || [
      { action: 'open', title: 'Öffnen' },
      { action: 'dismiss', title: 'Schließen' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || BASE_PATH;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if one is open
      for (const client of clients) {
        if (client.url.includes(BASE_PATH) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Strategy helpers ──────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(css|js|mjs|woff2?|ttf|eot|otf|png|jpe?g|gif|svg|webp|avif|ico|webmanifest)(\?.*)?$/i.test(pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
