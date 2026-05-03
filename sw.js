/* DP Biotech — model & asset cache service worker.
   Strategy:
     - .glb / .usdz : NETWORK-FIRST so freshly exported model files are picked up on reload.
                      Falls back to cache if offline.
     - .png/.jpg/.jpeg/.webp : cache-first (images change rarely).
   Bump CACHE_NAME to invalidate cached assets. */
const CACHE_NAME = 'dpbiotech-assets-v3';

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
        // Network-first: always try to fetch the freshest model.
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                const networkResp = await fetch(event.request, { cache: 'no-store' });
                if (networkResp && networkResp.ok && networkResp.type !== 'opaque') {
                    cache.put(event.request, networkResp.clone());
                }
                return networkResp;
            } catch (err) {
                const cached = await cache.match(event.request);
                if (cached) return cached;
                throw err;
            }
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
