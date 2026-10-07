#!/usr/bin/env node
/**
 * Bildausschnitt je Übung berechnen (einmalig, Ergebnis wird eingecheckt).
 *
 * Die Demo-Clips sind 16:9 und zeigen die Person mit viel leerem Hintergrund.
 * Dieses Skript bestimmt für **jeden Clip über alle Frames hinweg**, wo der
 * Inhalt liegt, und leitet daraus ab:
 *
 *   aspect  – wie hoch der Video-Rahmen sein darf (global), ohne seitlich
 *             jemals Inhalt abzuschneiden,
 *   objectX – horizontaler Ausschnitt der Szene,
 *   zoom,x,y – Skalierung und Drehpunkt im Rahmen.
 *
 * Ergebnis: `src/data/framing.js`, geladen von der App. Alles zusammen sorgt
 * dafür, dass die Person möglichst groß erscheint und trotzdem in keinem Frame
 * angeschnitten wird.
 *
 * Am Ende läuft eine Gegenprüfung: jeder Frame wird mit einer *feinfühligeren*
 * Schranke erneut vermessen und durch die berechnete Rahmung geschickt. Bleibt
 * dabei Inhalt am Rand hängen, bricht das Skript ab.
 *
 *   npm run framing                                 alle Übungen neu rechnen
 *   npm run framing -- --only=squat,push-ups        nur einzelne Übungen
 *
 * Mit `--only` bleibt der globale Rahmen bestehen und die übrigen Einträge
 * werden unverändert übernommen – praktisch, wenn eine Übung dazukommt.
 * Braucht ffmpeg im PATH und die Dev-Abhängigkeit jpeg-js.
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
  console.error("jpeg-js fehlt – einmalig `npm install` ausführen (nur Dev-Abhängigkeit).");
  process.exit(1);
}

const CDN = "https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev";
const FRAME_FPS = 6; // Frames pro Sekunde für die Ausdehnungsmessung
const FRAME_WIDTH = 480;
const PAD = 0.02; // Rand um den gemessenen Inhalt (in Frame-Anteilen)
const SAFETY = 0.9; // Sicherheitsabschlag auf den rechnerisch möglichen Zoom
const MAX_ZOOM = 1.6;
// Der Hintergrund ist ein Verlauf, deshalb wird er pro Zeile aus den äußeren
// Spalten geschätzt. Gemessen wird mit 40, gegengeprüft feinfühliger mit 16.
const MEASURE_THRESHOLD = 40;
const VERIFY_THRESHOLD = 16;
const VERIFY_TOLERANCE = 0.02; // erlaubte Überschreitung des Rahmens in der Prüfung
const WORK = join(tmpdir(), "pulse-framing");

// Nur einzelne Übungen neu rechnen, z. B. nach einem Tausch im Katalog.
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
 * Inhalt eines Frames: Bounding-Box der Pixel, die vom Hintergrund abweichen.
 * Der Hintergrund ist ein vertikaler Verlauf und wird pro Zeile aus den äußeren
 * 6 % der Spalten geschätzt – dort steht praktisch nie eine Person.
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

/** Video laden und Frames extrahieren; Box = Vereinigung über alle Frames. */
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
  if (!frames.length) throw new Error("keine Frames extrahiert");

  let box = null;
  for (const frame of frames) box = union(box, frameBox(frame, MEASURE_THRESHOLD));
  if (!box) throw new Error("kein Inhalt erkannt");

  return { frames, box: padBox(box) };
}

/** Nur als Rückfallebene, wenn ffmpeg fehlt: ein Standbild pro Übung. */
async function measurePoster(id, exercise) {
  const gender = exercise.only ?? "male";
  const response = await fetch(`${CDN}/exercise-posters/${gender}/${exercise.slug}.jpg`);
  if (!response.ok) throw new Error(`Poster ${response.status}`);
  const file = join(WORK, `${id}.jpg`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  const box = frameBox(file, MEASURE_THRESHOLD);
  rmSync(file, { force: true });
  if (!box) throw new Error("kein Inhalt erkannt");
  return { frames: [], box: padBox(box) };
}

/** Inhalt im Panel-Raum: x auf das sichtbare Fenster bezogen, y unverändert. */
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

/** Wie in der App: Skalierung um (x, y) und Auschnitt über object-position. */
const mapToPanel = (value, origin, zoom) => origin + (value - origin) * zoom;

const useFfmpeg = hasFfmpeg();
if (!useFfmpeg) console.warn("ffmpeg nicht gefunden – nutze nur die Standbilder (konservativer).\n");

const ids = only ?? Object.keys(EXERCISES);
for (const id of ids) {
  if (!EXERCISES[id]) {
    console.error(`Unbekannte Übung "${id}" – --only erwartet IDs aus src/data/exercises.js.`);
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

// Passendster (höchster) globaler Rahmen: jeder Clip muss hineinpassen.
const FRAME_ASPECT = 16 / 9;
// Bei --only bleibt der Rahmen des Bestands erhalten, damit sich alle anderen
// Übungen nicht mitverschieben.
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

// Bestand übernehmen, aber Einträge entfernen, die es im Katalog nicht mehr gibt
// (getauschte Übungen würden sonst als Karteileichen stehen bleiben).
const framing = only
  ? Object.fromEntries(Object.entries(EXISTING_FRAMING).filter(([id]) => EXERCISES[id]))
  : {};
const report = [];

for (const id of ids) {
  const { box } = measured[id];
  // Fenster so legen, dass der Inhalt dieses Clips mittig darin sitzt.
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
    `${id.padEnd(52)} zoom ${result.zoom.toFixed(2)}  Fenster ${(windowLeft * 100).toFixed(0)}–${((windowLeft + visibleWidth) * 100).toFixed(0)}%  Inhalt ${(box.x0 * 100).toFixed(0)}–${(box.x1 * 100).toFixed(0)}% / ${(box.y0 * 100).toFixed(0)}–${(box.y1 * 100).toFixed(0)}%  (${measured[id].frames.length} Frames)`,
  );
}

/* Gegenprüfung: jeden Frame feinfühlig vermessen und durch die Rahmung schicken. */
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
  `\n${ids.length} ${only ? "von " + Object.keys(EXERCISES).length + " " : ""}Übungen · Ø Zoom ${average.toFixed(2)}x · Rahmen ${aspect}:1 (Fenster ${(visibleWidth * 100).toFixed(1)}% der Breite)`,
);
console.log(`Quelle: ${useFfmpeg ? "ganze Clips (ffmpeg, 6 fps)" : "Standbilder"}`);
console.log(`Gegenprüfung: ${checkedFrames} Frames, ${violations.length} mit Randkontakt`);

if (violations.length) {
  const worst = violations.sort((a, b) => b.overflow - a.overflow).slice(0, 10);
  worst.forEach((v) => console.error(`  ${v.id}: ragt ${(v.overflow * 100).toFixed(1)} % über den Rand`));
  console.error("Rahmung abgebrochen – bitte PAD/SAFETY erhöhen und erneut rechnen.");
  process.exit(1);
}

const header = `/**
 * Bildausschnitt je Übung – automatisch erzeugt von \`scripts/framing.mjs\`.
 *
 * Grundlage: Messung des sichtbaren Inhalts über ${useFfmpeg ? "alle Frames der Clips (6 fps, ffmpeg)" : "je ein Standbild"}, je Frame gegengeprüft.
 *
 *   aspect  = Höhe/Breite des Video-Rahmens (${aspect}:1); höher als 16:9, damit die
 *             Person größer erscheint, aber ohne je Inhalt seitlich zu verlieren.
 *   zoom    = Skalierung im Rahmen (nur leerer Hintergrund wird beschnitten).
 *   x/y     = Drehpunkt in Prozent (transform-origin).
 *   objectX = horizontaler Szenenausschnitt in Prozent (object-position).
 *
 * Rand ${(PAD * 100).toFixed(1)} %, Sicherheitsabschlag ${((1 - SAFETY) * 100).toFixed(0)} %, Obergrenze ${MAX_ZOOM}x.
 * Neu berechnen: \`npm run framing\` (einzelne Übungen: \`--only=<id,...>\`).
 *${only ? `\n * Zuletzt neu gerechnet: ${ids.join(", ")}.` : ""}
 */
export const FRAMING = ${JSON.stringify(framing, null, 2)};

/** Globaler Rahmen für alle Übungen. */
export const PANEL_ASPECT = "${aspect}";
`;

writeFileSync(new URL("../src/data/framing.js", import.meta.url), header);
console.log("geschrieben: src/data/framing.js");
