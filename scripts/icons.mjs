#!/usr/bin/env node
/**
 * Generate the app icons (no external dependency, Node standard library only).
 *
 * For “Add to Home Screen” iOS needs an apple-touch-icon (180×180, opaque) and
 * the browser additionally wants manifest icons in 192 and 512 – the latter
 * also as a “maskable” variant with more padding so Android/WebAPK does not
 * crop it.
 *
 *   npm run icons        (output lands in assets/icons/)
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "assets", "icons");

const BG = [10, 11, 9];
const LIME = [216, 255, 74];

/* -------------------------------------------------------------- PNG writer */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // 10-12: compression, filter, interlace – all 0

  // Every row gets one filter byte (0 = none).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------------------------------------------------------------- Drawing */
const mix = (a, b, t) => a.map((value, index) => Math.round(value + (b[index] - value) * t));

/**
 * One pixel of the icon. `radius` is half the diagonal of the diamond as a
 * fraction of the image edge, `size` is the edge length in CSS pixels (only
 * relevant for the gradient).
 */
function sample(x, y, size, radius) {
  const u = (x + 0.5) / size;
  const v = (y + 0.5) / size;

  // Background: dark with a soft lime glow in the upper left.
  const glow = Math.max(0, 1 - Math.hypot(u - 0.28, v - 0.2) / 0.62);
  let color = mix(BG, LIME, glow * glow * 0.16);

  // Diamond (the mark from the header), drawn slightly rounded.
  const dx = Math.abs(u - 0.5);
  const dy = Math.abs(v - 0.5);
  const diamond = (dx + dy) / radius;
  if (diamond <= 1) {
    const edge = Math.min(1, (1 - diamond) * 14); // soft edge
    color = mix(color, LIME, Math.min(1, edge));
  }
  return color;
}

function render(size, { radius, samples = 3 } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const total = samples * samples;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples - 0.5;
          const py = y + (sy + 0.5) / samples - 0.5;
          const [cr, cg, cb] = sample(px, py, size, radius);
          r += cr;
          g += cg;
          b += cb;
        }
      }
      const i = (y * size + x) * 4;
      pixels[i] = Math.round(r / total);
      pixels[i + 1] = Math.round(g / total);
      pixels[i + 2] = Math.round(b / total);
      pixels[i + 3] = 255; // opaque – iOS would otherwise show black edges
    }
  }
  return encodePng(size, pixels);
}

mkdirSync(OUT, { recursive: true });

const targets = [
  { file: "apple-touch-icon.png", size: 180, radius: 0.3 },
  { file: "icon-192.png", size: 192, radius: 0.3 },
  { file: "icon-512.png", size: 512, radius: 0.3 },
  // Maskable: motif inside the safe zone (80 %), otherwise Android crops it.
  { file: "maskable-512.png", size: 512, radius: 0.22 },
];

for (const target of targets) {
  const png = render(target.size, { radius: target.radius });
  writeFileSync(join(OUT, target.file), png);
  console.log(`${target.file.padEnd(22)} ${target.size}×${target.size}  ${png.length} Bytes`);
}
