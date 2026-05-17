const CACHE = 'vf-v1';
const PRECACHE = ['/', '/manifest.json'];

// Instala e pré-carrega o shell mínimo
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// Ativa e remove caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Só intercepta GET; ignora chamadas ao Supabase (precisam de dados frescos)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;

  // Navegação: network-first, fallback para o shell em cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/')),
    );
    return;
  }

  // Assets estáticos (JS, CSS, fontes, imagens): stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);
        return cached ?? (await networkFetch);
      }),
    );
  }
});
