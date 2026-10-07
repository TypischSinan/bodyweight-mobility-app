#!/usr/bin/env node
/**
 * Compute the framing per exercise (run once, the result is committed).
 *
 * The demo clips are 16:9 and show the person with a lot of empty background.
 * This script determines, for **every clip across all of its frames**, where the
 * content sits, and derives from that:
 *
 *   aspect  – how tall the video panel may be (global) without ever cutting off
 *             content at the sides,
 *   objectX – horizontal crop of the scene,
 *   zoom,x,y – scale and pivot inside the panel.
 *
 * Result: `src/data/framing.js`, loaded by the app. Together this makes the
 * person appear as large as possible while never being cropped in any frame.
 *
 * A counter-check runs at the end: every frame is measured again with a *more
 * sensitive* threshold and pushed through the computed framing. If content still
 * touches an edge, the script aborts.
 *
 *   npm run framing                                 recompute all exercises
 *   npm run framing -- --only=squat,push-ups        only single exercises
 *
 * With `--only` the global aspect stays as it is and the remaining entries are
 * kept unchanged – handy when an exercise is added.
 * Needs ffmpeg on the PATH and the dev dependency jpeg-js.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXERCISES } from "../src/data/exercises.js";
import { FRAMING as EXISTING_FRAMING, PANEL_ASPECT as EXISTING_ASPECT } from "../src/data/framing.js";

const require = createRequire(import.meta.url);
let jpeg;
try {
  jpeg = require("jpeg-js");
} catch {
  console.error("jpeg-js is missing – run `npm install` once (dev dependency only).");
  process.exit(1);
}

const CDN = "https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev";
const FRAME_FPS = 6; // frames per second for the extent measurement
const FRAME_WIDTH = 480;
const PAD = 0.02; // margin around the measured content (in frame fractions)
const SAFETY = 0.9; // safety discount on the theoretically possible zoom
const MAX_ZOOM = 1.6;
// The background is a gradient, so it is estimated per row from the outer
// columns. Measuring uses 40, the counter-check uses the more sensitive 16.
const MEASURE_THRESHOLD = 40;
const VERIFY_THRESHOLD = 16;
const VERIFY_TOLERANCE = 0.02; // allowed overshoot of the panel in the check
const WORK = join(tmpdir(), "pulse-framing");

// Recompute only single exercises, e.g. after a swap in the catalog.
const onlyArg = process.argv.find((arg) => arg.startsWith("--only"))?.split("=")[1];
const only = onlyArg
  ? onlyArg.split(",").map((value) => value.trim()).filter(Boolean)
  : null;

if (!existsSync(WORK)) mkdirSync(WORK, { recursive: true });

function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const median = (values) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];

/**
 * Content of a frame: bounding box of the pixels that differ from the background.
 * The background is a vertical gradient and is estimated per row from the outer
 * 6 % of the columns – a person practically never stands there.
 */
function frameBox(file, threshold) {
  const { width, height, data } = jpeg.decode(readFileSync(file), { useTArray: true });
  const edge = Math.max(3, Math.round(width * 0.06));

  const rowBackground = [];
  for (let y = 0; y < height; y += 2) {
    const samples = [[], [], []];
    for (let x = 0; x < edge; x += 2) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) samples[c].push(data[i + c]);
      const j = (y * width + (width - 1 - x)) * 4;
      for (let c = 0; c < 3; c += 1) samples[c].push(data[j + c]);
    }
    rowBackground.push([median(samples[0]), median(samples[1]), median(samples[2])]);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let row = 0;
  for (let y = 0; y < height; y += 2, row += 1) {
    const background = rowBackground[row];
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const distance =
        Math.abs(data[i] - background[0]) + Math.abs(data[i + 1] - background[1]) + Math.abs(data[i + 2] - background[2]);
      if (distance > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x0: minX / width, x1: maxX / width, y0: minY / height, y1: maxY / height };
}

const padBox = (box) => ({
  x0: Math.max(0, box.x0 - PAD),
  x1: Math.min(1, box.x1 + PAD),
  y0: Math.max(0, box.y0 - PAD),
  y1: Math.min(1, box.y1 + PAD),
});

const union = (a, b) =>
  !a
    ? b
    : {
        x0: Math.min(a.x0, b.x0),
        x1: Math.max(a.x1, b.x1),
        y0: Math.min(a.y0, b.y0),
        y1: Math.max(a.y1, b.y1),
      };

/** Download the video and extract frames; box = union across all frames. */
async function measureClip(id, exercise) {
  const gender = exercise.only ?? "male";
  const videoFile = join(WORK, `${id}.mp4`);
  const frameDir = join(WORK, `frames-${id}`);
  mkdirSync(frameDir, { recursive: true });

  const response = await fetch(`${CDN}/exercise-videos/${gender}/${exercise.slug}.mp4`);
  if (!response.ok) throw new Error(`Video ${response.status}`);
  writeFileSync(videoFile, Buffer.from(await response.arrayBuffer()));

  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    videoFile,
    "-vf",
    `fps=${FRAME_FPS},scale=${FRAME_WIDTH}:-1`,
    "-q:v",
    "4",
    join(frameDir, "f%04d.jpg"),
  ]);
  rmSync(videoFile, { force: true });

  const frames = readdirSync(frameDir)
    .filter((name) => name.endsWith(".jpg"))
    .sort()
    .map((name) => join(frameDir, name));
  if (!frames.length) throw new Error("no frames extracted");

  let box = null;
  for (const frame of frames) box = union(box, frameBox(frame, MEASURE_THRESHOLD));
  if (!box) throw new Error("no content detected");

  return { frames, box: padBox(box) };
}

/** Fallback only, when ffmpeg is missing: one still per exercise. */
async function measurePoster(id, exercise) {
  const gender = exercise.only ?? "male";
  const response = await fetch(`${CDN}/exercise-posters/${gender}/${exercise.slug}.jpg`);
  if (!response.ok) throw new Error(`Poster ${response.status}`);
  const file = join(WORK, `${id}.jpg`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  const box = frameBox(file, MEASURE_THRESHOLD);
  rmSync(file, { force: true });
  if (!box) throw new Error("no content detected");
  return { frames: [], box: padBox(box) };
}

/** Content in panel space: x relative to the visible window, y unchanged. */
const toPanelSpace = (box, visibleWidth, windowLeft) => ({
  x0: (box.x0 - windowLeft) / visibleWidth,
  x1: (box.x1 - windowLeft) / visibleWidth,
  y0: box.y0,
  y1: box.y1,
});

function solveFraming(box) {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  const zoom = Math.min(MAX_ZOOM, Math.max(1, (1 / Math.max(w, h)) * SAFETY));
  if (zoom <= 1.0001) return { zoom: 1, x: 0.5, y: 0.5 };

  const axis = (a0, a1) => {
    const low = (a1 * zoom - 1) / (zoom - 1);
    const high = (a0 * zoom) / (zoom - 1);
    return Math.min(1, Math.max(0, (low + high) / 2));
  };

  return { zoom: Number(zoom.toFixed(3)), x: axis(box.x0, box.x1), y: axis(box.y0, box.y1) };
}

/** Same as in the app: scale around (x, y) and crop via object-position. */
const mapToPanel = (value, origin, zoom) => origin + (value - origin) * zoom;

const useFfmpeg = hasFfmpeg();
if (!useFfmpeg) console.warn("ffmpeg not found – using the still images only (more conservative).\n");

const ids = only ?? Object.keys(EXERCISES);
for (const id of ids) {
  if (!EXERCISES[id]) {
    console.error(`Unknown exercise "${id}" – --only expects ids from src/data/exercises.js.`);
    process.exit(1);
  }
}

const measured = {};
const problems = [];
let cursor = 0;

async function worker() {
  while (cursor < ids.length) {
    const id = ids[cursor++];
    try {
      measured[id] = useFfmpeg ? await measureClip(id, EXERCISES[id]) : await measurePoster(id, EXERCISES[id]);
    } catch (error) {
      problems.push(`${id}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
if (problems.length) {
  problems.forEach((problem) => console.error(problem));
  process.exit(1);
}

// Best-fitting (tallest) global panel: every clip has to fit inside.
const FRAME_ASPECT = 16 / 9;
// With --only the existing panel is kept so that all other exercises do not
// shift along with it.
const aspect = only
  ? Number(EXISTING_ASPECT)
  : Number(
      Math.max(
        1.25,
        Math.min(
          FRAME_ASPECT,
          FRAME_ASPECT * Math.min(1, Math.max(...Object.values(measured).map(({ box }) => box.x1 - box.x0))),
        ),
      ).toFixed(3),
    );
const visibleWidth = Math.min(1, aspect / FRAME_ASPECT);

// Take over the existing entries, but drop those that are no longer in the
// catalog (swapped exercises would otherwise linger as dead entries).
const framing = only
  ? Object.fromEntries(Object.entries(EXISTING_FRAMING).filter(([id]) => EXERCISES[id]))
  : {};
const report = [];

for (const id of ids) {
  const { box } = measured[id];
  // Place the window so that this clip's content sits centered inside it.
  const slack = visibleWidth - (box.x1 - box.x0);
  const windowLeft = Math.max(0, Math.min(1 - visibleWidth, box.x0 - slack / 2));
  const panelBox = toPanelSpace(box, visibleWidth, windowLeft);
  const result = solveFraming(panelBox);

  framing[id] = {
    zoom: result.zoom,
    x: Number(result.x.toFixed(4)),
    y: Number(result.y.toFixed(4)),
    objectX: Number((visibleWidth >= 0.999 ? 0.5 : windowLeft / (1 - visibleWidth)).toFixed(4)),
  };
  report.push(
    `${id.padEnd(52)} zoom ${result.zoom.toFixed(2)}  window ${(windowLeft * 100).toFixed(0)}–${((windowLeft + visibleWidth) * 100).toFixed(0)}%  content ${(box.x0 * 100).toFixed(0)}–${(box.x1 * 100).toFixed(0)}% / ${(box.y0 * 100).toFixed(0)}–${(box.y1 * 100).toFixed(0)}%  (${measured[id].frames.length} frames)`,
  );
}

/* Counter-check: measure every frame with a more sensitive threshold and push it through the framing. */
const violations = [];
let checkedFrames = 0;

for (const id of ids) {
  const { frames } = measured[id];
  const { zoom, x, y, objectX } = framing[id];
  for (const frame of frames) {
    const box = frameBox(frame, VERIFY_THRESHOLD);
    if (!box) continue;
    checkedFrames += 1;
    const panel = toPanelSpace(box, visibleWidth, objectX * (1 - visibleWidth));
    const mapped = {
      x0: mapToPanel(panel.x0, x, zoom),
      x1: mapToPanel(panel.x1, x, zoom),
      y0: mapToPanel(panel.y0, y, zoom),
      y1: mapToPanel(panel.y1, y, zoom),
    };
    const overflow = Math.max(
      -mapped.x0,
      mapped.x1 - 1,
      -mapped.y0,
      mapped.y1 - 1,
    );
    if (overflow > VERIFY_TOLERANCE) violations.push({ id, overflow: Number(overflow.toFixed(3)), frame });
  }
}

rmSync(WORK, { recursive: true, force: true });

const all = Object.values(framing);
const average = all.reduce((sum, f) => sum + f.zoom, 0) / all.length;
console.log(report.join("\n"));
console.log(
  `\n${ids.length} ${only ? "of " + Object.keys(EXERCISES).length + " " : ""}exercises · avg zoom ${average.toFixed(2)}x · frame ${aspect}:1 (window ${(visibleWidth * 100).toFixed(1)}% of the width)`,
);
console.log(`Source: ${useFfmpeg ? "whole clips (ffmpeg, 6 fps)" : "still images"}`);
console.log(`Re-check: ${checkedFrames} frames, ${violations.length} touching an edge`);

if (violations.length) {
  const worst = violations.sort((a, b) => b.overflow - a.overflow).slice(0, 10);
  worst.forEach((v) => console.error(`  ${v.id}: overflows the edge by ${(v.overflow * 100).toFixed(1)} %`));
  console.error("Framing aborted – raise PAD/SAFETY and recompute.");
  process.exit(1);
}

const header = `/**
 * Per-exercise framing – generated automatically by \`scripts/framing.mjs\`.
 *
 * Basis: measurement of the visible content across ${useFfmpeg ? "all frames of the clips (6 fps, ffmpeg)" : "one still per clip"}, every frame re-checked.
 *
 *   aspect  = height/width of the video panel (${aspect}:1); taller than 16:9 so the
 *             person appears bigger without ever losing content at the sides.
 *   zoom    = scale inside the panel (only empty background is cropped).
 *   x/y     = pivot in percent (transform-origin).
 *   objectX = horizontal crop of the scene in percent (object-position).
 *
 * Padding ${(PAD * 100).toFixed(1)} %, safety margin ${((1 - SAFETY) * 100).toFixed(0)} %, upper bound ${MAX_ZOOM}x.
 * Recompute: \`npm run framing\` (single exercises: \`--only=<id,...>\`).
 *${only ? `\n * Last recomputed: ${ids.join(", ")}.` : ""}
 */
export const FRAMING = ${JSON.stringify(framing, null, 2)};

/** Global panel aspect for all exercises. */
export const PANEL_ASPECT = "${aspect}";
`;

writeFileSync(new URL("../src/data/framing.js", import.meta.url), header);
console.log("written: src/data/framing.js");
