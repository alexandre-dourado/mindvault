// public/sw.js — MindVault Service Worker
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `mindvault-static-${CACHE_VERSION}`;
const API_CACHE = `mindvault-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// ─── Install: pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API calls (Google Apps Script) — network-first, fall back to cache
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleapis.com')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 8000));
    return;
  }

  // Google Fonts — cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Static assets — cache-first
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const fallback = await caches.match('/offline.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    if (cached) return cached;

    // For API failures, return a structured error response
    return new Response(
      JSON.stringify({ success: false, error: 'You appear to be offline', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
