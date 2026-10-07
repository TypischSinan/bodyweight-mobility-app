#!/usr/bin/env node
/**
 * Checks the data basis of the app:
 *   1. every session has 10 exercises and lasts exactly 600 seconds,
 *      in the rhythm 60 s primer + 9×40 s work + 9×20 s rest,
 *   2. no exercise appears twice within a session,
 *   3. every referenced exercise exists in the catalog,
 *   4. every catalog exercise is used at least once,
 *   5. every catalog exercise is equipment-free according to the dataset
 *      (`body weight`) and is not on the blocklist of equipment exercises,
 *   6. the installation (manifest, icons, service worker shell) is complete,
 *   7. with `--media` additionally: video and poster of every exercise answer with 200.
 *
 *   npm run validate
 *   npm run validate:media
 */
import { existsSync, readFileSync } from "node:fs";
import {
  BUNDLES,
  CATEGORY_LABELS,
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
import {
  EN_BLOCK_LABELS,
  EN_BUNDLES,
  EN_CATEGORY_LABELS,
  EN_LEVELS,
} from "../src/data/en.bundles.js";
import { EN_EXERCISES, EN_FOCUS_LABELS, EN_KIND_LABELS } from "../src/data/en.exercises.js";
import { FRAMING, PANEL_ASPECT } from "../src/data/framing.js";
import { STRINGS, buildData } from "../src/i18n.js";

const EXPECTED_SECONDS = 600;
const problems = [];
const fail = (message) => problems.push(message);

/* 1–3: sessions */
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

  // Rhythm: 60 s primer, 9×40 s work, 9×20 s rest in between, no rest at the end.
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

/* 4: catalog fully used */
const unused = Object.keys(EXERCISES).filter((id) => !usedIds.has(id));
if (unused.length) fail(`Katalog-Übungen ohne Verwendung: ${unused.join(", ")}`);

/* 5: fields and freedom from equipment */
const snapshotUrl = new URL("../data/exercise-db-snapshot.json", import.meta.url);
if (!existsSync(snapshotUrl)) {
  console.error("data/exercise-db-snapshot.json fehlt – ohne den Datensatz lässt sich die Gerätefreiheit nicht prüfen.");
  process.exit(1);
}
const dataset = JSON.parse(readFileSync(snapshotUrl, "utf8"));
const datasetEntries = dataset.exercises;

// Movements that need an object (parallel bars, bench, step, rings, bands …).
//
// WARNING: the dataset's `equipment` field is not reliable – for the following
// three entries it claims "body weight", while the demo clip clearly shows a
// bench with a barbell (Old School Reverse Extensions), a 45° bench with foot
// pads (45-Degree Bicycle Twisting Crunch) or a resistance band (Peroneals
// Stretch). The clips were reviewed frame by frame for this.
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

/* 5b: framing present and plausible */
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

/* 5c: installation (add to home screen) */
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
// The back button sits next to the title (one line), not in a row of its own.
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
// The header (navbar) stays visible on the training screen.
if (/body\.fit \.topbar\s*\{[^}]*display:\s*none/.test(readText("style.css"))) {
  fail("style.css blendet die Kopfzeile auf der Trainingsseite aus – sie soll sichtbar bleiben");
}
if (html.includes("10 Min · ohne Geräte")) fail("index.html: die Meta-Zeile in der Kopfzeile ist unnötig");

// The language switch is part of the shell and every key it references exists.
if (!html.includes('id="lang-switch"')) fail("index.html: der Sprachumschalter fehlt");
for (const code of ["de", "en"]) {
  if (!html.includes(`data-lang="${code}"`)) fail(`index.html: Sprachknopf für "${code}" fehlt`);
}
const usedKeys = [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map((match) => match[1]);
const unknownKeys = [...new Set(usedKeys)].filter((key) => !(key in STRINGS.de) || !(key in STRINGS.en));
if (unknownKeys.length) fail(`index.html nutzt unbekannte Sprachschlüssel: ${unknownKeys.join(", ")}`);
if (usedKeys.length < 20) fail(`index.html: nur ${usedKeys.length} Stellen sind an die Sprache gebunden`);

const manifest = JSON.parse(readText("manifest.webmanifest"));
if (manifest.display !== "standalone") fail(`Manifest: display ist "${manifest.display}" statt "standalone"`);
if (!manifest.start_url) fail("Manifest: start_url fehlt");
if (!(manifest.icons ?? []).some((icon) => (icon.purpose ?? "").includes("maskable"))) {
  fail("Manifest: maskable Icon fehlt");
}

/** Read the PNG header: width/height from the first IHDR chunk. */
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

// Service worker: every file of the shell has to really exist.
const sw = readText("sw.js");
const shell = [...sw.matchAll(/"(\.\/[^"]*)"/g)].map((match) => match[1]).filter((path) => path !== "./");
if (shell.length < 10) fail(`sw.js: unerwartet kleine App-Hülle (${shell.length} Einträge)`);
for (const path of new Set(shell)) {
  if (!existsSync(new URL(path.replace(/^\.\//, ""), root))) fail(`sw.js: ${path} existiert nicht`);
}

/* 5d: languages – English is complete and does not change the structure */
const GERMAN_HINTS =
  /[äöüß]|\b(der|die|das|und|von|nicht|noch|Tage|Tagen|Minuten|Übungen|Sekunden|Bereit|Stumm|Weniger|Muskeln|Atmung|Dauer|Geräte)\b/i;

const missingTranslations = Object.entries(EXERCISES)
  .filter(([id]) => {
    const entry = EN_EXERCISES[id];
    return (
      !entry || ["name", "sub", "cue", "mistake", "breath"].some((field) => !entry[field])
    );
  })
  .map(([id]) => id);
if (missingTranslations.length) {
  fail(`Englische Fassung fehlt oder ist unvollständig: ${missingTranslations.join(", ")}`);
}

const unknownTranslations = Object.keys(EN_EXERCISES).filter((id) => !EXERCISES[id]);
if (unknownTranslations.length) {
  fail(`Englische Fassung kennt unbekannte Übungen: ${unknownTranslations.join(", ")}`);
}

const missingBundles = BUNDLES.filter(
  (bundle) => !EN_BUNDLES[bundle.id]?.summary || !EN_BUNDLES[bundle.id]?.tags?.length,
).map((bundle) => bundle.id);
if (missingBundles.length) fail(`Englische Sessions fehlen: ${missingBundles.join(", ")}`);

const unknownBundleTranslations = Object.keys(EN_BUNDLES).filter(
  (id) => !BUNDLES.some((bundle) => bundle.id === id),
);
if (unknownBundleTranslations.length) {
  fail(`Englische Sessions ohne Vorlage: ${unknownBundleTranslations.join(", ")}`);
}

const labelGaps = [
  ...Object.keys(FOCUS_LABELS)
    .filter((key) => !EN_FOCUS_LABELS[key])
    .map((key) => `Fokus "${key}"`),
  ...Object.keys(KIND_LABELS)
    .filter((key) => !EN_KIND_LABELS[key])
    .map((key) => `Art "${key}"`),
  ...[...Object.keys(CATEGORY_LABELS), "all"]
    .filter((key) => !EN_CATEGORY_LABELS[key])
    .map((key) => `Kategorie "${key}"`),
  ...[...new Set(BUNDLES.flatMap((bundle) => bundle.blocks.map((block) => block.label)))]
    .filter((label) => !EN_BLOCK_LABELS[label])
    .map((label) => `Block "${label}"`),
  ...[...new Set([...BUNDLES.map((bundle) => bundle.level), ...Object.values(EXERCISES).map((exercise) => exercise.level)])]
    .filter((level) => !EN_LEVELS[level])
    .map((level) => `Level "${level}"`),
];
if (labelGaps.length) fail(`Englische Bezeichnungen fehlen: ${labelGaps.join(", ")}`);

// Both languages must offer the same keys, and no English text may still be German.
const missingKeys = Object.keys(STRINGS.de).filter((key) => !(key in STRINGS.en));
if (missingKeys.length) fail(`Englische Oberflächentexte fehlen: ${missingKeys.join(", ")}`);
const extraKeys = Object.keys(STRINGS.en).filter((key) => !(key in STRINGS.de));
if (extraKeys.length) fail(`Englische Oberflächentexte ohne Vorlage: ${extraKeys.join(", ")}`);

const render = (value) => (typeof value === "function" ? value("1", "2", "3") : String(value));
const untranslated = Object.keys(STRINGS.en).filter((key) => GERMAN_HINTS.test(render(STRINGS.en[key])));
if (untranslated.length) {
  fail(`Englischer Text enthält noch Deutsch: ${untranslated.join(", ")}`);
}

const englishText = (() => {
  const values = [];
  const collect = (value) => {
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(EN_EXERCISES);
  collect(EN_BUNDLES);
  collect(EN_BLOCK_LABELS);
  collect(EN_CATEGORY_LABELS);
  collect(EN_FOCUS_LABELS);
  collect(EN_KIND_LABELS);
  collect(EN_LEVELS);
  return values.filter((value) => GERMAN_HINTS.test(value));
})();
if (englishText.length) {
  fail(`Englische Datentexte enthalten noch Deutsch: ${englishText.slice(0, 3).join(" | ")}`);
}

// The English view must be the same app: same ids, same order, same rhythm.
const english = buildData("en");
if (english.bundles.length !== BUNDLES.length) fail("Englische Fassung ändert die Zahl der Sessions");
for (const [index, bundle] of english.bundles.entries()) {
  const source = BUNDLES[index];
  if (bundle.id !== source.id) fail(`Englische Fassung sortiert die Sessions um (${bundle.id})`);
  if (bundle.blocks.length !== source.blocks.length) fail(`${bundle.id}: Blöcke weichen in der englischen Fassung ab`);
  bundle.blocks.forEach((block, blockIndex) => {
    if (block.items.length !== source.blocks[blockIndex].items.length) {
      fail(`${bundle.id}: Übungen je Block weichen in der englischen Fassung ab`);
    }
  });
  if (bundleSeconds(bundle) !== EXPECTED_SECONDS) fail(`${bundle.id}: englische Fassung verändert die Dauer`);
}
if (Object.keys(english.exercises).length !== Object.keys(EXERCISES).length) {
  fail("Englische Fassung ändert die Zahl der Übungen");
}
for (const [id, exercise] of Object.entries(english.exercises)) {
  if (exercise.slug !== EXERCISES[id].slug || exercise.focus !== EXERCISES[id].focus) {
    fail(`${id}: die englische Fassung darf Slug und Fokus nicht verändern`);
  }
}

/* 6: media */
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

/* result */
const totalSessions = BUNDLES.length;
console.log(`Sessions: ${totalSessions} · Katalog: ${Object.keys(EXERCISES).length} Übungen · 600s pro Session`);

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  problems.forEach((problem) => console.error(` - ${problem}`));
  process.exitCode = 1;
} else {
  console.log("Alles grün.");
}
