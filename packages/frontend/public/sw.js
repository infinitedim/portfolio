// Service Worker for Portfolio PWA
const STATIC_CACHE = "portfolio-static-v1.2.0";
const DYNAMIC_CACHE = "portfolio-dynamic-v1.2.0";

// Cache strategy configurations
const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  NETWORK_ONLY: "network-only",
  CACHE_ONLY: "cache-only",
};

// Define what to cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/_next/static/css/",
  "/_next/static/js/",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const CACHE_RULES = [
  {
    pattern: /^https:\/\/fonts\.googleapis\.com/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: "google-fonts-stylesheets",
  },
  {
    pattern: /^https:\/\/fonts\.gstatic\.com/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: "google-fonts-webfonts",
    maxEntries: 30,
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
  },
  {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: "images",
    maxEntries: 60,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  {
    pattern: /\.(?:js|css)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: "static-resources",
  },
  {
    pattern: /^\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: "api-cache",
    maxAgeSeconds: 60 * 5, // 5 minutes
  },
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        console.log("Service Worker: Caching static assets");
        await cache.addAll(STATIC_ASSETS);

        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error("Service Worker: Installation failed", error);
      }
    })(),
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();

        // Delete old caches
        const deletePromises = cacheNames
          .filter(
            (cacheName) =>
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              !cacheName.includes("v1.2.0"),
          )
          .map((cacheName) => {
            console.log("Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          });

        await Promise.all(deletePromises);

        // Claim all clients
        await self.clients.claim();

        console.log("Service Worker: Activated successfully");
      } catch (error) {
        console.error("Service Worker: Activation failed", error);
      }
    })(),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

// Handle fetch with appropriate strategy
/**
 * Handle fetch with appropriate strategy
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response object
 */
async function handleFetch(request) {
  // Find matching cache rule
  const rule = CACHE_RULES.find((rule) => rule.pattern.test(request.url));

  if (rule) {
    return handleWithStrategy(request, rule);
  }

  // Default strategy for unmatched requests
  return handleWithStrategy(request, {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: DYNAMIC_CACHE,
  });
}

// Apply caching strategy
/**
 * Apply caching strategy
 * @param {Request} request - The request object
 * @param {object} rule - The rule object
 * @returns {Promise<Response>} The response object
 */
async function handleWithStrategy(request, rule) {
  const { strategy, cacheName = DYNAMIC_CACHE } = rule;

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);

    default:
      return networkFirst(request, cacheName);
  }
}

// Cache first strategy
/**
 *
 * @param {Request} request - The request object
 * @param {string} cacheName - The cache name
 * @returns {Promise<Response>} The response object
 */
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache first strategy failed:", error);
    return getOfflineFallback(request);
  }
}

// Network first strategy
/**
 *
 * @param {Request} request - The request object
 * @param {string} cacheName - The cache name
 * @returns {Promise<Response>} The response object
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn("Network request failed, trying cache:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return getOfflineFallback(request);
  }
}

// Stale while revalidate strategy
/**
 *
 * @param {Request} request - The request object
 * @param {string} cacheName - The cache name
 * @returns {Promise<Response>} The response object
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to update cache in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.warn("Background update failed:", error);
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  try {
    return await networkPromise;
  } catch (error) {
    console.error("Stale while revalidate strategy failed:", error);
    return getOfflineFallback(request);
  }
}

// Get offline fallback
/**
 *
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response object
 */
async function getOfflineFallback(request) {
  // Return offline page for navigation requests
  if (request.mode === "navigate") {
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Return placeholder for images
  if (request.destination === "image") {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" fill="#9ca3af">Image Offline</text></svg>',
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }

  // Return generic offline response
  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "portfolio-sync") {
    event.waitUntil(syncPortfolioData());
  }
});

// Sync portfolio data when back online
/**
 *
 */
async function syncPortfolioData() {
  try {
    // Check if we have pending sync data
    const cache = await caches.open("sync-cache");
    const syncData = await cache.match("/sync-pending");

    if (syncData) {
      const data = await syncData.json();
      console.log("Syncing offline data:", data);

      // Send data to server
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Remove from sync cache
      await cache.delete("/sync-pending");
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const options = {
    body: event.data ? event.data.text() : "New update available!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/icons/action-explore.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/action-close.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Portfolio Update", options),
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event.action);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(self.clients.openWindow("/"));
  }
});

// Share target handler (Web Share Target API)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/share-target" && event.request.method === "POST") {
    event.respondWith(handleShareTarget(event.request));
  }
});

/**
 *
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response object
 */
async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get("title") || "";
  const text = formData.get("text") || "";
  const url = formData.get("url") || "";

  // Store shared content for later processing
  const cache = await caches.open("shared-content");
  await cache.put(
    "/shared-content",
    new Response(
      JSON.stringify({
        title,
        text,
        url,
        timestamp: Date.now(),
      }),
    ),
  );

  // Return success response
  return Response.redirect("/?shared=true", 303);
}

console.log("Service Worker: Loaded successfully");
