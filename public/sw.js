// ─── Service Worker ─────────────────────────────────────────────────────────
// Cachea todos los assets al instalar y sirve desde caché cuando no hay red.

const CACHE_NAME = 'dados-scorer-v1'

// Al instalar: precachea la shell de la app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/index.html'])
    )
  )
  self.skipWaiting()
})

// Al activar: elimina cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: cache-first para assets estáticos, network-first para el resto
self.addEventListener('fetch', event => {
  // Solo manejamos GET
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchAndCache = fetch(event.request).then(response => {
        // Solo cacheamos respuestas válidas del mismo origen
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()))
        }
        return response
      })
      // Devuelve caché inmediatamente si existe, actualiza en background
      return cached || fetchAndCache
    })
  )
})
