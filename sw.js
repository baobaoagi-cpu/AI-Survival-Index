const CACHE_NAME = "ai-survival-alpha-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/runtime-config.js",
  "/alpha-app.css",
  "/support.js",
  "/data/archetypes.js",
  "/assets/pwa/icon.svg",
  "/assets/archetypes/explorer.png",
  "/assets/archetypes/craftsman.png",
  "/assets/archetypes/guardian.png",
  "/assets/archetypes/navigator.png",
  "/assets/archetypes/strategist.png",
  "/assets/archetypes/inventor.png",
  "/assets/archetypes/trader.png",
  "/assets/archetypes/mentor.png",
  "/assets/archetypes/builder.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const isHtmlNavigation = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
  const isRuntimeConfig = url.pathname.endsWith("/runtime-config.js");

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (isHtmlNavigation || isRuntimeConfig) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        } catch {
          if (cached) return cached;
          throw new Error("Network request failed and no cache is available");
        }
      }

      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
