#!/usr/bin/env node
/**
 * Prüft die Datengrundlage der App:
 *   1. jede Session hat 10 Übungen und dauert exakt 600 Sekunden,
 *      im Rhythmus 60 s Primer + 9×40 s Arbeit + 9×20 s Pause,
 *   2. keine Übung kommt innerhalb einer Session zweimal vor,
 *   3. alle referenzierten Übungen existieren im Katalog,
 *   4. jede Katalog-Übung wird mindestens einmal verwendet,
 *   5. alle Katalog-Übungen sind laut Datensatz gerätefrei (`body weight`)
 *      und stehen nicht auf der Ausschlussliste der Geräteübungen,
 *   6. Installation (Manifest, Icons, Service-Worker-Hülle) ist vollständig,
 *   7. mit `--media` zusätzlich: Video und Poster jeder Übung antworten mit 200.
 *
 *   npm run validate
 *   npm run validate:media
 */
import { existsSync, readFileSync } from "node:fs";
import {
  BUNDLES,
  PRIMER_SECONDS,
  REST_SECONDS,
  SESSION_EXERCISES,
  WORK_SECONDS,
  blockSeconds,
  bundleExerciseCount,
  bundleSeconds,
  bundleSequence,
  bundleWork,
} from "../src/data/bundles.js";
import { EXERCISES, KIND_LABELS, FOCUS_LABELS, posterUrl, videoUrl } from "../src/data/exercises.js";
import { FRAMING, PANEL_ASPECT } from "../src/data/framing.js";

const EXPECTED_SECONDS = 600;
const problems = [];
const fail = (message) => problems.push(message);

/* 1–3: Sessions */
const usedIds = new Set();
for (const bundle of BUNDLES) {
  const work = bundleWork(bundle);
  const sequence = bundleSequence(bundle);
  const ids = work.map((entry) => entry.id);

  const seconds = bundleSeconds(bundle);
  if (seconds !== EXPECTED_SECONDS) fail(`${bundle.id}: ${seconds}s statt ${EXPECTED_SECONDS}s`);

  if (bundleExerciseCount(bundle) !== SESSION_EXERCISES) {
    fail(`${bundle.id}: ${bundleExerciseCount(bundle)} Übungen (erwartet ${SESSION_EXERCISES})`);
  }

  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) fail(`${bundle.id}: Übung doppelt → ${[...new Set(duplicates)].join(", ")}`);

  // Rhythmus: 60 s Primer, 9×40 s Arbeit, dazwischen 9×20 s Pause, am Ende keine Pause.
  const rests = sequence.filter((entry) => entry.rest);
  if (rests.length !== SESSION_EXERCISES - 1) {
    fail(`${bundle.id}: ${rests.length} Pausen (erwartet ${SESSION_EXERCISES - 1})`);
  }
  if (sequence.length !== SESSION_EXERCISES * 2 - 1) {
    fail(`${bundle.id}: Abfolge hat ${sequence.length} Schritte (erwartet ${SESSION_EXERCISES * 2 - 1})`);
  }
  sequence.forEach((entry, index) => {
    if (entry.rest) {
      if (entry.seconds !== REST_SECONDS) fail(`${bundle.id}: Pause ${entry.seconds}s statt ${REST_SECONDS}s`);
      if (index === 0 || index === sequence.length - 1) fail(`${bundle.id}: Pause an unmöglicher Stelle (${index})`);
      if (!entry.nextExercise) fail(`${bundle.id}: Pause ohne Angabe der nächsten Übung`);
      return;
    }
    const expected = index === 0 ? PRIMER_SECONDS : WORK_SECONDS;
    if (entry.seconds !== expected) fail(`${bundle.id}: Schritt ${index} läuft ${entry.seconds}s statt ${expected}s`);
  });

  const blockSum = bundle.blocks.reduce((sum, _block, index) => sum + blockSeconds(bundle, index), 0);
  if (blockSum !== EXPECTED_SECONDS) {
    fail(`${bundle.id}: Blockzeiten ergeben ${blockSum}s statt ${EXPECTED_SECONDS}s`);
  }

  ids.forEach((id) => usedIds.add(id));
}

const bundleIds = new Set(BUNDLES.map((bundle) => bundle.id));
if (bundleIds.size !== BUNDLES.length) fail("Session-IDs sind nicht eindeutig");

/* 4: Katalog vollständig genutzt */
const unused = Object.keys(EXERCISES).filter((id) => !usedIds.has(id));
if (unused.length) fail(`Katalog-Übungen ohne Verwendung: ${unused.join(", ")}`);

/* 5: Felder und Gerätefreiheit */
const snapshotUrl = new URL("../data/exercise-db-snapshot.json", import.meta.url);
if (!existsSync(snapshotUrl)) {
  console.error("data/exercise-db-snapshot.json fehlt – ohne den Datensatz lässt sich die Gerätefreiheit nicht prüfen.");
  process.exit(1);
}
const dataset = JSON.parse(readFileSync(snapshotUrl, "utf8"));
const datasetEntries = dataset.exercises;

// Ausführungen, die einen Gegenstand brauchen (Barren, Bank, Stufe, Ringe, Bänder …).
//
// ACHTUNG: Das Feld `equipment` des Datensatzes ist nicht verlässlich – für die
// folgenden drei Einträge behauptet er "body weight", im Demo-Clip ist aber klar
// eine Bank mit Langhantel (Old School Reverse Extensions), eine 45°-Bank mit
// Fußpolstern (45-Degree Bicycle Twisting Crunch) bzw. ein Zugband (Peroneals
// Stretch) zu sehen. Die Clips wurden dafür Bild für Bild gesichtet.
const NEEDS_APPARATUS = new Set([
  "old-school-reverse-extensions",
  "45-degree-bycicle-twisting-crunch",
  "stretching-peroneals-stretch",
  "bench-pull-ups",
  "chin-ups-narrow-parallel-grip",
  "close-grip-chin-up",
  "commando-pull-up",
  "pull-up-wide-front-grip",
  "chin-ups-pull-ups",
  "reverse-grip-pull-up",
  "pull-up-shoulder-grip",
  "inverted-row-between-chairs",
  "inverted-row-with-straps",
  "ring-high-row",
  "chest-dips",
  "triceps-dips",
  "bench-dips",
  "scapula-dips",
  "vertical-leg-raise-on-parallel-bars",
  "hanging-leg-hip-raise",
  "hanging-straight-leg-raise",
  "incline-leg-hip-raise",
  "crunch-on-bench",
  "jump-step-up",
  "incline-push-ups",
  "deep-push-ups",
  "donkey-calf-raise",
  "stretching-stairs-calf-stretch",
  "stretching-standing-bench-calf-stretch",
  "stretching-hip-flexor-stretch-rear-foot-elevated",
  "stretching-standing-wheel-rollout",
]);

const femaleOnlyLegacy = new Set([
  "front-plank-female",
  "reverse-crunch-female",
  "rotate-push-up-female",
  "lying-scissor-kick-female",
  "corkscrew-pilates",
]);

/* 5b: Bildausschnitt vorhanden und plausibel */
for (const id of Object.keys(EXERCISES)) {
  const framing = FRAMING[id];
  if (!framing) {
    fail(`${id}: kein Eintrag in src/data/framing.js (npm run framing)`);
    continue;
  }
  if (!(framing.zoom >= 1 && framing.zoom <= 1.6)) fail(`${id}: Zoom ${framing.zoom} außerhalb 1–1.6`);
  if (!(framing.x >= 0 && framing.x <= 1 && framing.y >= 0 && framing.y <= 1)) {
    fail(`${id}: Drehpunkt außerhalb 0–1`);
  }
  if (!(framing.objectX >= 0 && framing.objectX <= 1)) fail(`${id}: objectX außerhalb 0–1`);
}

const aspect = Number(PANEL_ASPECT);
if (!(aspect >= 1.25 && aspect <= 16 / 9)) fail(`PANEL_ASPECT ${PANEL_ASPECT} außerhalb 1.25–1.78`);

for (const [id, exercise] of Object.entries(EXERCISES)) {
  for (const field of ["name", "sub", "focus", "kind", "level", "slug", "cue", "mistake", "breath"]) {
    if (!exercise[field]) fail(`${id}: Feld "${field}" fehlt`);
  }
  if (!FOCUS_LABELS[exercise.focus]) fail(`${id}: unbekannter Fokus "${exercise.focus}"`);
  if (!KIND_LABELS[exercise.kind]) fail(`${id}: unbekannte Art "${exercise.kind}"`);
  if (NEEDS_APPARATUS.has(exercise.slug)) fail(`${id}: ${exercise.slug} braucht ein Gerät und darf nicht im Katalog sein`);

  if (!femaleOnlyLegacy.has(exercise.slug)) {
    const entry = datasetEntries.find((item) => item.male?.includes(`/male/${exercise.slug}.mp4`));
    if (!entry) {
      fail(`${id}: ${exercise.slug} nicht im Datensatz gefunden`);
    } else if (entry.equipment !== "body weight") {
      fail(`${id}: Datensatz nennt Ausrüstung "${entry.equipment}"`);
    }
  }
}

/* 5c: Installation (Home-Bildschirm-Verknüpfung) */
const root = new URL("../", import.meta.url);
const readText = (relative) => readFileSync(new URL(relative, root), "utf8");

const html = readText("index.html");
for (const [needle, label] of [
  ['rel="manifest"', "Manifest-Verweis in index.html"],
  ['rel="apple-touch-icon"', "apple-touch-icon in index.html"],
  ["apple-mobile-web-app-capable", "apple-mobile-web-app-capable in index.html"],
  ["viewport-fit=cover", "viewport-fit=cover (nötig für die Geräte-Ränder)"],
]) {
  if (!html.includes(needle)) fail(`${label} fehlt`);
}
// Der Zurück-Knopf sitzt neben dem Titel (eine Zeile), nicht in eigener Reihe.
for (const [id, label] of [
  ["detail-back", "Zurück-Knopf im Ablauf"],
  ["player-back", "Zurück-Knopf im Player"],
]) {
  if (!html.includes(`id="${id}"`)) fail(`index.html: ${label} fehlt`);
}
const titleRow = html.match(/<div class="title-row">[\s\S]*?<\/div>/)?.[0] ?? "";
if (!titleRow.includes('id="detail-back"')) {
  fail("Der Zurück-Knopf im Ablauf steht nicht neben dem Titel (.title-row)");
}
if (/\.icon-button\.back\s*\{[^}]*margin-bottom/.test(readText("style.css"))) {
  fail("Der Zurück-Knopf hat wieder einen eigenen Abstand nach unten – er gehört neben den Titel");
}
// Die Kopfzeile (Navbar) bleibt auf der Trainingsseite sichtbar.
if (/body\.fit \.topbar\s*\{[^}]*display:\s*none/.test(readText("style.css"))) {
  fail("style.css blendet die Kopfzeile auf der Trainingsseite aus – sie soll sichtbar bleiben");
}
if (html.includes("10 Min · ohne Geräte")) fail("index.html: die Meta-Zeile in der Kopfzeile ist unnötig");

const manifest = JSON.parse(readText("manifest.webmanifest"));
if (manifest.display !== "standalone") fail(`Manifest: display ist "${manifest.display}" statt "standalone"`);
if (!manifest.start_url) fail("Manifest: start_url fehlt");
if (!(manifest.icons ?? []).some((icon) => (icon.purpose ?? "").includes("maskable"))) {
  fail("Manifest: maskable Icon fehlt");
}

/** PNG-Kopf lesen: Breite/Höhe der ersten IHDR-Stelle. */
function pngSize(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const icon of manifest.icons ?? []) {
  const file = new URL(icon.src, root);
  if (!existsSync(file)) {
    fail(`Manifest-Icon ${icon.src} fehlt (npm run icons)`);
    continue;
  }
  const size = pngSize(readFileSync(file));
  const [width, height] = String(icon.sizes).split("x").map(Number);
  if (!size || size.width !== width || size.height !== height) {
    fail(`${icon.src}: Größe ${size ? `${size.width}×${size.height}` : "unbekannt"} statt ${width}×${height}`);
  }
}

const appleIcon = new URL("assets/icons/apple-touch-icon.png", root);
if (!existsSync(appleIcon)) fail("assets/icons/apple-touch-icon.png fehlt (npm run icons)");
else {
  const size = pngSize(readFileSync(appleIcon));
  if (!size || size.width !== 180 || size.height !== 180) {
    fail(`apple-touch-icon sollte 180×180 sein, ist ${size ? `${size.width}×${size.height}` : "unlesbar"}`);
  }
}

// Service Worker: jede Datei der Hülle muss es wirklich geben.
const sw = readText("sw.js");
const shell = [...sw.matchAll(/"(\.\/[^"]*)"/g)].map((match) => match[1]).filter((path) => path !== "./");
if (shell.length < 10) fail(`sw.js: unerwartet kleine App-Hülle (${shell.length} Einträge)`);
for (const path of new Set(shell)) {
  if (!existsSync(new URL(path.replace(/^\.\//, ""), root))) fail(`sw.js: ${path} existiert nicht`);
}

/* 6: Medien */
const checkMedia = process.argv.includes("--media");
const mediaTargets = [];
for (const [id, exercise] of Object.entries(EXERCISES)) {
  const genders = exercise.only ? [exercise.only] : ["male", "female"];
  for (const gender of genders) {
    mediaTargets.push({ id, url: videoUrl(exercise, gender), kind: "video" });
    mediaTargets.push({ id, url: posterUrl(exercise, gender), kind: "poster" });
  }
}

if (checkMedia) {
  const queue = [...mediaTargets];
  const failures = [];
  const workers = Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const target = queue.shift();
      try {
        const response = await fetch(target.url, { method: "HEAD" });
        if (response.status !== 200) failures.push(`${target.id} ${target.kind}: HTTP ${response.status} (${target.url})`);
      } catch (error) {
        failures.push(`${target.id} ${target.kind}: ${error.message}`);
      }
    }
  });
  await Promise.all(workers);
  failures.forEach(fail);
  console.log(`Medien geprüft: ${mediaTargets.length} URLs (${mediaTargets.length - failures.length} ok)`);
}

/* Ergebnis */
const totalSessions = BUNDLES.length;
console.log(`Sessions: ${totalSessions} · Katalog: ${Object.keys(EXERCISES).length} Übungen · 600s pro Session`);

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach((problem) => console.error(` - ${problem}`));
  process.exitCode = 1;
} else {
  console.log("Alles grün.");
}
