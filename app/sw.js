// Service worker: de app werkt na het eerste bezoek ook zonder internet. De bestanden worden in de cache gezet;
// bij een nieuwe versie (nieuwe CACHE-naam in bestanden.json) wordt de oude cache weggegooid.
const BASIS = new URL('./', self.location).href;

async function lijst() {
  try {
    const r = await fetch(new URL('bestanden.json', BASIS), { cache: 'no-store' });
    return await r.json();
  } catch {
    return { versie: 'dev', bestanden: ['./', 'index.html'] };
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const { versie, bestanden } = await lijst();
    const cache = await caches.open(`elektro-schema-${versie}`);
    await cache.addAll(bestanden.map((b) => new URL(b, BASIS).href));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const { versie } = await lijst();
    for (const k of await caches.keys()) if (k.startsWith('elektro-schema-') && k !== `elektro-schema-${versie}`) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const gevonden = await caches.match(e.request, { ignoreSearch: true });
    if (gevonden) return gevonden;
    try {
      return await fetch(e.request);
    } catch {
      return (await caches.match(new URL('index.html', BASIS).href)) || Response.error();
    }
  })());
});
