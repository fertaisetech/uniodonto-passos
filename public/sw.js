const CACHE_NAME = "uniodonto-bi-cache-v2";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon-16.png",
  "/favicon-32.png",
  "/favicon-48.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/images/LogoUniodonto.webp",
  "/manifest.json"
];

// Install Event - Pre-caches static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleans up old cache databases
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache-first with network fallback for local files
self.addEventListener("fetch", (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (!event.request.url.startsWith("http") || event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Serve from cache or fetch from network and dynamically cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Check if valid response to cache
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // For navigation requests, fallback to index.html if offline
            if (event.request.mode === "navigate") {
              return caches.match("/index.html");
            }
          });
      })
    );
  } else {
    // External APIs or assets
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
