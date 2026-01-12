const CACHE_VERSION = 'v2';
const STATIC_CACHE = `lab-master-static-${CACHE_VERSION}`;
const API_CACHE = `lab-master-api-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lab-master-dynamic-${CACHE_VERSION}`;

// Critical assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with stale-while-revalidate
const API_PATTERNS = [
  /supabase\.co\/rest\/v1/,
  /supabase\.co\/auth\/v1/
];

// Max age for cached API responses (5 minutes)
const API_CACHE_MAX_AGE = 5 * 60 * 1000;

// Install event - pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches
          if (
            cacheName.startsWith('lab-master-') &&
            !cacheName.includes(CACHE_VERSION)
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Check if request is an API call
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url));
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Stale-while-revalidate for API requests
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Start network fetch in background
  const networkPromise = fetch(request.clone())
    .then(async (response) => {
      if (response.ok) {
        // Store with timestamp for cache invalidation
        const responseToCache = response.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-time', Date.now().toString());
        
        const body = await responseToCache.blob();
        const cachedResponseWithTime = new Response(body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        await cache.put(request, cachedResponseWithTime);
      }
      return response;
    })
    .catch((error) => {
      console.warn('[SW] Network request failed:', error);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    const age = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity;
    
    // If cache is fresh enough, return it
    if (age < API_CACHE_MAX_AGE) {
      console.log('[SW] Serving from cache (fresh):', request.url);
      return cachedResponse;
    }
    
    // Cache is stale but usable - return it and update in background
    console.log('[SW] Serving stale cache, updating in background:', request.url);
    return cachedResponse;
  }

  // No cache, wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Both cache and network failed
  return new Response(JSON.stringify({ error: 'Offline', message: 'No cached data available' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Cache-first for static assets
async function cacheFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Static asset fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Network-first for navigation requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page');
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback page
    return new Response(getOfflinePage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Offline fallback HTML page
function getOfflinePage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Lab Master</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    button:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Some features may not be available until you're back online.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
  `;
}

// Main fetch handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with stale-while-revalidate
  if (isApiRequest(request.url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets with cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE).then(() => {
      console.log('[SW] API cache cleared');
    });
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    // Future: sync queued offline actions
  }
});
