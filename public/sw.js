// ─── Service Worker ─────────────────────────────────────────────────────────
const CACHE_NAME = 'dados-scorer-v2'

// Al instalar: precachea el HTML principal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['/']))
      .catch(() => {}) // no bloquear la instalación si falla
  )
  self.skipWaiting()
})

// Al activar: limpia cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

// Fetch: network-first con fallback a caché
// Si la red falla Y hay caché → sirve caché
// Si la red falla Y NO hay caché → deja que el browser gestione el error (no blank)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cacheamos respuestas válidas del mismo origen
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Sin red: intentar servir desde caché
        return caches.match(event.request)
          .then(cached => cached || Response.error())
      })
  )
})
