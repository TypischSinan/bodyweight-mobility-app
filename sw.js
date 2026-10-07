/**
 * Service Worker: legt die App-Hülle in den Cache, damit Pulse nach dem
 * „Zum Home-Bildschirm"-Verknüpfen auch ohne Netz startet (Timer, Plan,
 * Trainingslog funktionieren offline; nur die Demo-Clips kommen vom CDN).
 *
 * Strategie: eigene Dateien kommen zuerst aus dem Netz (damit ein Update sofort
 * greift und HTML und Module nie auseinanderlaufen) und nur bei fehlender
 * Verbindung aus dem Cache. Fremdes (Videos, Fonts) wird nie angefasst – die
 * Demo-Clips sind zu groß und liegen auf einem anderen Host.
 */
const VERSION = "pulse-v3";

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
  "./src/data/exercises.js",
  "./src/data/bundles.js",
  "./src/data/framing.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // Einzelne Fehlschläge dürfen die Installation nicht kippen.
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
  if (url.origin !== self.location.origin) return; // CDN (Videos, Fonts) nicht anfassen
  if (request.headers.has("range")) return; // Teilabrufe nie aus dem Cache beantworten

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
