// Service Worker for Matvecka PWA
// Version: 1.0.0

const CACHE_NAME = 'matvecka-v1';
const OFFLINE_URL = '/offline';

// Files to cache for offline use
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache essential assets
      await cache.addAll(PRECACHE_ASSETS);
      // Activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Take control of all pages immediately
      self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests - always go to network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    (async () => {
      try {
        // Try network first for HTML pages
        if (event.request.mode === 'navigate') {
          const networkResponse = await fetch(event.request);
          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }

        // For other assets, try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fallback to network
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses for static assets
        if (networkResponse.ok && shouldCache(event.request.url)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // If offline and navigating, show offline page
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          const offlineResponse = await cache.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        // For other requests, try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        throw error;
      }
    })()
  );
});

// Helper function to determine if we should cache a response
function shouldCache(url) {
  // Cache static assets
  const cachePatterns = [
    /\/_next\/static\//,
    /\/icons\//,
    /\/images\//,
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
  ];
  
  return cachePatterns.some((pattern) => pattern.test(url));
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
