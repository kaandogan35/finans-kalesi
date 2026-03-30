/**
 * ParamGo — Service Worker
 *
 * Strateji:
 * - App Shell (HTML, CSS, JS): Cache-First → hızlı yükleme
 * - API istekleri: Network-First → güncel veri, offline fallback
 * - Fontlar & ikonlar: Cache-First → değişmez kaynaklar
 */

const CACHE_ADI = 'paramgo-v1'
const APP_SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/favicon.svg',
]

// ─── Install: App Shell cache ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ADI).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )
  self.skipWaiting()
})

// ─── Activate: Eski cache temizle ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((anahtarlar) => {
      return Promise.all(
        anahtarlar
          .filter((a) => a !== CACHE_ADI)
          .map((a) => caches.delete(a))
      )
    })
  )
  self.clients.claim()
})

// ─── Fetch: Strateji seçici ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API istekleri → Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Font dosyaları → Cache-First (uzun ömürlü)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request))
    return
  }

  // Diğer (JS, CSS, HTML, görseller) → Cache-First + ağdan güncelle
  if (event.request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(event.request))
    return
  }
})

// ─── Cache stratejileri ──────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_ADI)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_ADI)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(
      JSON.stringify({ basarili: false, hata: 'Internet bağlantınız yok' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_ADI)
  const cached = await cache.match(request)

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)

  return cached || await networkFetch || new Response('Offline', { status: 503 })
}
