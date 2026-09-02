const CACHE_NAME = 'hardware-ecommerce-v1';
const STATIC_CACHE_NAME = 'hardware-static-v1';
const IMAGE_CACHE_NAME = 'hardware-images-v1';
const API_CACHE_NAME = 'hardware-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/images/ASDLogo.png',
  '/images/no-image-available.svg',
  '/favicon.ico'
];

// Cache size limit (50MB for images)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        console.log('[SW] Preparing image cache');
        return cache; // Just open the cache
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip local Next.js dev assets and browser-extension requests.
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') {
    return;
  }

  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs')) {
    return;
  }

  // Strategy for static assets - Cache First
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE_NAME));
    return;
  }
  
  // Strategy for images - Cache First with Background Update
  if (isImageRequest(event.request)) {
    event.respondWith(cacheFirstWithBackgroundUpdate(event.request, IMAGE_CACHE_NAME));
    return;
  }
  
  // Strategy for API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request, API_CACHE_NAME));
    return;
  }
  
  // Default strategy - Network First
  event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
});

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const pathname = url.pathname.toLowerCase();
  
  return imageExtensions.some(ext => pathname.endsWith(ext)) ||
         url.hostname.includes('supabase.co') ||
         request.headers.get('Accept')?.includes('image/');
}

// Cache First Strategy - serve from cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache miss, fetching from network:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Cache First with Background Update - serve from cache, update in background
async function cacheFirstWithBackgroundUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        // Check cache size before adding
        checkCacheSize(cacheName).then((canAdd) => {
          if (canAdd) {
            cache.put(request, networkResponse.clone());
          }
        });
      }
    });
    
    console.log('[SW] Serving from cache (background update):', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache miss, fetching from network:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    // Check cache size before adding
    const canAdd = await checkCacheSize(cacheName);
    if (canAdd) {
      cache.put(request, networkResponse.clone());
    }
  }
  
  return networkResponse;
}

// Network First Strategy - try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Check cache size and clean up if needed
async function checkCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  let totalSize = 0;
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  if (totalSize > MAX_CACHE_SIZE) {
    console.log('[SW] Cache size exceeded, cleaning up old entries');
    await cleanupCache(cacheName);
    return false;
  }
  
  return true;
}

// Clean up oldest cache entries
async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Remove oldest 20% of entries
  const entriesToRemove = Math.floor(keys.length * 0.2);
  
  for (let i = 0; i < entriesToRemove; i++) {
    await cache.delete(keys[i]);
  }
  
  console.log(`[SW] Removed ${entriesToRemove} old cache entries`);
}

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    let totalSize = 0;
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          
          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
        })
      );
    }).then(() => {
      event.ports[0].postMessage({ size: totalSize });
    });
  }
});
