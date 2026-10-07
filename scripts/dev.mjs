#!/usr/bin/env node
/**
 * Dev-Server ohne Abhängigkeiten.
 *
 * Die App besteht aus statischen Dateien plus ES-Modulen – dafür braucht es
 * keinen Bundler, nur einen Server, der die richtigen Content-Types schickt
 * (`file://` funktioniert wegen der Modul-Imports nicht).
 *
 *   npm run dev            → http://127.0.0.1:5173
 *   PORT=4000 npm run dev  → anderer Port
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
// PORT kann als leerer String gesetzt sein – Number("") wäre 0 (Zufallsport).
const port = Number.parseInt(process.env.PORT ?? "", 10) || 5173;
const host = process.env.HOST?.trim() || "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = normalize(join(root, decoded));
  if (!candidate.startsWith(root + sep) && candidate !== root) return null;
  if (!existsSync(candidate)) return null;
  const stats = statSync(candidate);
  if (stats.isDirectory()) {
    const index = join(candidate, "index.html");
    return existsSync(index) ? index : null;
  }
  return candidate;
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 – nicht gefunden");
    console.log(`404 ${req.method} ${req.url}`);
    return;
  }

  const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  res.writeHead(200, {
    "content-type": type,
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  createReadStream(file).pipe(res);
  console.log(`200 ${req.method} ${req.url}`);
});

server.listen(port, host, () => {
  console.log(`Pulse läuft auf http://${host}:${port}`);
  console.log("Beenden mit Ctrl+C");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} ist belegt. Mit PORT=<nummer> npm run dev einen anderen wählen.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
