/* DP Biotech — model & asset cache service worker.
   Strategy:
     - .glb / .usdz : STALE-WHILE-REVALIDATE — served instantly from cache once downloaded
                      (so the same model is reused across every page with no re-download),
                      while a background fetch refreshes the cache for next time.
     - .png/.jpg/.jpeg/.webp : cache-first (images change rarely).
   Bump CACHE_NAME to invalidate cached assets. */
const CACHE_NAME = 'dpbiotech-assets-v4';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    const isModel = /\.(glb|usdz)(\?|$)/i.test(url.pathname);
    const isImage = /\.(png|jpg|jpeg|webp)(\?|$)/i.test(url.pathname);
    if (!isModel && !isImage) return;

    if (isModel) {
        // Stale-while-revalidate: serve the cached model instantly (instant reuse
        // across pages), and refresh the cache from the network in the background.
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(event.request);
            const networkFetch = fetch(event.request).then(networkResp => {
                if (networkResp && networkResp.ok && networkResp.type !== 'opaque') {
                    cache.put(event.request, networkResp.clone());
                }
                return networkResp;
            }).catch(() => null);
            // Keep the worker alive while the background refresh completes.
            event.waitUntil(networkFetch);
            return cached || (await networkFetch) || Response.error();
        })());
        return;
    }

    // Images — cache-first.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response && response.ok && response.type !== 'opaque') {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(() => cached);
            })
        )
    );
});
