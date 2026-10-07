#!/usr/bin/env node
/**
 * Dependency-free dev server.
 *
 * The app is static files plus ES modules – that needs no bundler, only a
 * server that sends the right content types (`file://` does not work because
 * of the module imports).
 *
 *   npm run dev            → http://127.0.0.1:5173
 *   PORT=4000 npm run dev  → different port
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
// PORT can be set to an empty string – Number("") would be 0 (random port).
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
    res.end("404 – not found");
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
  console.log(`Pulse is running on http://${host}:${port}`);
  console.log("Stop with Ctrl+C");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is in use. Pick another one with PORT=<number> npm run dev.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
