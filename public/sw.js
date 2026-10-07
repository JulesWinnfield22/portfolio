/**
 * Service worker — abelteame.dev
 *
 * Caching rules differ by path because the guarantees differ:
 *   /_astro/  Astro content-hashes these filenames, so a changed file always
 *             arrives at a new URL. Cache-first is safe and never goes stale.
 *   /assets/  Stable filenames whose CONTENTS change between deploys
 *             (screenshots, video, collages). Stale-while-revalidate: serve the
 *             cached copy instantly, fetch a fresh one in the background, so an
 *             updated file lands on the next load instead of never.
 *   HTML      Network-first, cache only as an offline fallback.
 *
 * Bump CACHE on any deploy that changes a /assets/ file you need to land
 * immediately — activate() deletes every cache that isn't the current one.
 */
const CACHE = 'abel-v2';

const PRECACHE = [
  '/assets/fetap.jpg',
  '/assets/kenema.jpg',
  '/assets/chinetlink-poster.jpg',
];

self.addEventListener('install', (e) => {
  // don't let one missing file abort the whole install
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(PRECACHE.map((u) => c.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/**
 * Only cache real, same-origin, basic 200s.
 *
 * Must be `status === 200`, not `res.ok` — ok covers all of 2xx, and that
 * includes the 206 Partial Content that <video> Range requests return.
 * Cache.put() throws on a 206.
 */
const cacheable = (res) => res && res.status === 200 && res.type === 'basic';

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Range requests (media seeking) must go straight to the network — a cached
  // full response would break seeking, and the 206 can't be cached anyway.
  if (e.request.headers.has('range')) return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // hashed build output — cache-first, it can never go stale
  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ||
        fetch(e.request).then((res) => {
          if (cacheable(res)) {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)));
          }
          return res;
        })
      )
    );
    return;
  }

  // stable filenames, changing contents — stale-while-revalidate
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fresh = fetch(e.request)
          .then((res) => {
            if (cacheable(res)) {
              const copy = res.clone();
              e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  // pages — always try the network so content edits show up immediately
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
