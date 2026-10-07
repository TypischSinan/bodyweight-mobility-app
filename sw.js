/**
 * Service worker: puts the app shell into the cache so Pulse starts without a
 * network after being added to the home screen (timer, plan and training log work
 * offline; only the demo clips come from the CDN).
 *
 * Strategy: own files come from the network first (so an update takes effect
 * immediately and HTML and modules can never drift apart) and only fall back to
 * the cache when there is no connection. Foreign requests (videos, fonts) are
 * never touched – the demo clips are too large and live on another host.
 */
const VERSION = "pulse-v4";

const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./src/app.js",
  "./src/timer.js",
  "./src/audio.js",
  "./src/storage.js",
  "./src/i18n.js",
  "./src/data/exercises.js",
  "./src/data/bundles.js",
  "./src/data/framing.js",
  "./src/data/en.exercises.js",
  "./src/data/en.bundles.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // Individual failures must not break the installation.
      await Promise.all(
        SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // do not touch the CDN (videos, fonts)
  if (request.headers.has("range")) return; // never serve range requests from the cache

  const isDocument = request.mode === "navigate" || request.destination === "document";

  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (isDocument) {
          const fallback = await cache.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("Offline", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
