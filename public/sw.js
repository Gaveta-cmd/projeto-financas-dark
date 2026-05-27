// VibeFinance Service Worker — Offline-First (stale-while-revalidate)
// Bump CACHE_VERSION when deploying breaking changes to force cache refresh.
const CACHE_VERSION = 'vf-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Shell assets pre-cached on install (critical for offline boot)
const PRECACHE_URLS = ['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];

// Hostnames whose responses are never cached (always need fresh data)
// Note: fonts.googleapis.com and fonts.gstatic.com are handled explicitly below
const BYPASS_HOSTS = [
  'supabase.co',
  'supabase.in',
];

// ── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: prune old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: tiered caching strategy ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // Google Fonts CSS and font files: cache-first (stable, versioned URLs)
  // Must be checked BEFORE BYPASS_HOSTS to avoid being skipped
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Never intercept external APIs (Supabase REST, realtime, auth)
  if (BYPASS_HOSTS.some((h) => url.hostname.includes(h))) return;

  // Navigation (HTML pages): network-first → fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match('/') ?? caches.match('/index.html')),
    );
    return;
  }

  // Same-origin static assets (JS, CSS, images, fonts): stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  // Return cached immediately; refresh in background
  return cached ?? (await networkPromise);
}
