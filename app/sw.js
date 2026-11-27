// Service worker: de app werkt na het eerste bezoek ook zonder internet. De bestanden worden in de cache gezet;
// bij een nieuwe versie (nieuwe CACHE-naam in bestanden.json) wordt de oude cache weggegooid.
// Versie van de service worker: 2 (verhogen als dit bestand moet vernieuwen).
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

// Eerst het internet (zo heb je altijd de nieuwste versie), en enkel zonder internet de bewaarde kopie.
// Wat van het internet komt, wordt meteen in de cache bijgewerkt voor de volgende keer zonder internet.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const antwoord = await fetch(e.request, { cache: 'no-cache' });
      if (antwoord.ok && !e.request.url.endsWith('bestanden.json')) {
        const kopie = antwoord.clone();
        caches.keys().then((ks) => ks.find((k) => k.startsWith('elektro-schema-')))
          .then((k) => k && caches.open(k)).then((c) => c?.put(e.request, kopie)).catch(() => {});
      }
      return antwoord;
    } catch {
      return (await caches.match(e.request, { ignoreSearch: true }))
        || (await caches.match(new URL('index.html', BASIS).href)) || Response.error();
    }
  })());
});
