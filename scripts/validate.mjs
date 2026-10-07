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
 *   6. every exercise has a plausible framing (panel aspect, zoom, pivot),
 *   7. the installation (manifest, icons, service worker shell) is complete,
 *   8. German and English are complete and equivalent: the same keys, no German
 *      left in the English text, and the English view changes neither the
 *      structure nor the timing of a session,
 *   9. with `--media` additionally: video and poster of every exercise answer with 200.
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
  if (seconds !== EXPECTED_SECONDS) fail(`${bundle.id}: ${seconds}s instead of ${EXPECTED_SECONDS}s`);

  if (bundleExerciseCount(bundle) !== SESSION_EXERCISES) {
    fail(`${bundle.id}: ${bundleExerciseCount(bundle)} exercises (expected ${SESSION_EXERCISES})`);
  }

  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) fail(`${bundle.id}: exercise twice → ${[...new Set(duplicates)].join(", ")}`);

  // Rhythm: 60 s primer, 9×40 s work, 9×20 s rest in between, no rest at the end.
  const rests = sequence.filter((entry) => entry.rest);
  if (rests.length !== SESSION_EXERCISES - 1) {
    fail(`${bundle.id}: ${rests.length} rests (expected ${SESSION_EXERCISES - 1})`);
  }
  if (sequence.length !== SESSION_EXERCISES * 2 - 1) {
    fail(`${bundle.id}: sequence has ${sequence.length} steps (expected ${SESSION_EXERCISES * 2 - 1})`);
  }
  sequence.forEach((entry, index) => {
    if (entry.rest) {
      if (entry.seconds !== REST_SECONDS) fail(`${bundle.id}: rest ${entry.seconds}s instead of ${REST_SECONDS}s`);
      if (index === 0 || index === sequence.length - 1) fail(`${bundle.id}: rest in an impossible position (${index})`);
      if (!entry.nextExercise) fail(`${bundle.id}: rest without the next exercise`);
      return;
    }
    const expected = index === 0 ? PRIMER_SECONDS : WORK_SECONDS;
    if (entry.seconds !== expected) fail(`${bundle.id}: step ${index} runs ${entry.seconds}s instead of ${expected}s`);
  });

  const blockSum = bundle.blocks.reduce((sum, _block, index) => sum + blockSeconds(bundle, index), 0);
  if (blockSum !== EXPECTED_SECONDS) {
    fail(`${bundle.id}: block times add up to ${blockSum}s instead of ${EXPECTED_SECONDS}s`);
  }

  ids.forEach((id) => usedIds.add(id));
}

const bundleIds = new Set(BUNDLES.map((bundle) => bundle.id));
if (bundleIds.size !== BUNDLES.length) fail("Session ids are not unique");

/* 4: catalog fully used */
const unused = Object.keys(EXERCISES).filter((id) => !usedIds.has(id));
if (unused.length) fail(`Catalog exercises never used: ${unused.join(", ")}`);

/* 5: fields and freedom from equipment */
const snapshotUrl = new URL("../data/exercise-db-snapshot.json", import.meta.url);
if (!existsSync(snapshotUrl)) {
  console.error("data/exercise-db-snapshot.json is missing – without the dataset there is no way to check freedom from equipment.");
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
    fail(`${id}: no entry in src/data/framing.js (npm run framing)`);
    continue;
  }
  if (!(framing.zoom >= 1 && framing.zoom <= 1.6)) fail(`${id}: zoom ${framing.zoom} outside 1–1.6`);
  if (!(framing.x >= 0 && framing.x <= 1 && framing.y >= 0 && framing.y <= 1)) {
    fail(`${id}: pivot outside 0–1`);
  }
  if (!(framing.objectX >= 0 && framing.objectX <= 1)) fail(`${id}: objectX outside 0–1`);
}

const aspect = Number(PANEL_ASPECT);
if (!(aspect >= 1.25 && aspect <= 16 / 9)) fail(`PANEL_ASPECT ${PANEL_ASPECT} outside 1.25–1.78`);

for (const [id, exercise] of Object.entries(EXERCISES)) {
  for (const field of ["name", "sub", "focus", "kind", "level", "slug", "cue", "mistake", "breath"]) {
    if (!exercise[field]) fail(`${id}: field "${field}" is missing`);
  }
  if (!FOCUS_LABELS[exercise.focus]) fail(`${id}: unknown focus "${exercise.focus}"`);
  if (!KIND_LABELS[exercise.kind]) fail(`${id}: unknown kind "${exercise.kind}"`);
  if (NEEDS_APPARATUS.has(exercise.slug)) fail(`${id}: ${exercise.slug} needs an apparatus and must not be in the catalog`);

  if (!femaleOnlyLegacy.has(exercise.slug)) {
    const entry = datasetEntries.find((item) => item.male?.includes(`/male/${exercise.slug}.mp4`));
    if (!entry) {
      fail(`${id}: ${exercise.slug} not found in the dataset`);
    } else if (entry.equipment !== "body weight") {
      fail(`${id}: dataset names equipment "${entry.equipment}"`);
    }
  }
}

/* 5c: installation (add to home screen) */
const root = new URL("../", import.meta.url);
const readText = (relative) => readFileSync(new URL(relative, root), "utf8");

const html = readText("index.html");
for (const [needle, label] of [
  ['rel="manifest"', "manifest link in index.html"],
  ['rel="apple-touch-icon"', "apple-touch-icon in index.html"],
  ["apple-mobile-web-app-capable", "apple-mobile-web-app-capable in index.html"],
  ["viewport-fit=cover", "viewport-fit=cover (needed for the device edges)"],
]) {
  if (!html.includes(needle)) fail(`${label} is missing`);
}
// The back button sits next to the title (one line), not in a row of its own.
for (const [id, label] of [
  ["detail-back", "back button in the plan"],
  ["player-back", "back button in the player"],
]) {
  if (!html.includes(`id="${id}"`)) fail(`index.html: ${label} is missing`);
}
const titleRow = html.match(/<div class="title-row">[\s\S]*?<\/div>/)?.[0] ?? "";
if (!titleRow.includes('id="detail-back"')) {
  fail("The back button in the plan is not next to the title (.title-row)");
}
if (/\.icon-button\.back\s*\{[^}]*margin-bottom/.test(readText("style.css"))) {
  fail("The back button has a bottom margin of its own again – it belongs next to the title");
}
// The header (navbar) stays visible on the training screen.
if (/body\.fit \.topbar\s*\{[^}]*display:\s*none/.test(readText("style.css"))) {
  fail("style.css hides the header on the training screen – it should stay visible");
}
if (html.includes("10 Min · ohne Geräte")) fail("index.html: the meta line in the header is unnecessary");

// The language switch is part of the shell and every key it references exists.
if (!html.includes('id="lang-switch"')) fail("index.html: the language switch is missing");
for (const code of ["de", "en"]) {
  if (!html.includes(`data-lang="${code}"`)) fail(`index.html: language button for "${code}" is missing`);
}
const usedKeys = [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map((match) => match[1]);
const unknownKeys = [...new Set(usedKeys)].filter((key) => !(key in STRINGS.de) || !(key in STRINGS.en));
if (unknownKeys.length) fail(`index.html uses unknown language keys: ${unknownKeys.join(", ")}`);
if (usedKeys.length < 20) fail(`index.html: only ${usedKeys.length} places are bound to the language`);

const manifest = JSON.parse(readText("manifest.webmanifest"));
if (manifest.display !== "standalone") fail(`Manifest: display is "${manifest.display}" instead of "standalone"`);
if (!manifest.start_url) fail("Manifest: start_url is missing");
if (!(manifest.icons ?? []).some((icon) => (icon.purpose ?? "").includes("maskable"))) {
  fail("Manifest: maskable icon is missing");
}

/** Read the PNG header: width/height from the first IHDR chunk. */
function pngSize(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const icon of manifest.icons ?? []) {
  const file = new URL(icon.src, root);
  if (!existsSync(file)) {
    fail(`Manifest icon ${icon.src} is missing (npm run icons)`);
    continue;
  }
  const size = pngSize(readFileSync(file));
  const [width, height] = String(icon.sizes).split("x").map(Number);
  if (!size || size.width !== width || size.height !== height) {
    fail(`${icon.src}: size ${size ? `${size.width}×${size.height}` : "unknown"} instead of ${width}×${height}`);
  }
}

const appleIcon = new URL("assets/icons/apple-touch-icon.png", root);
if (!existsSync(appleIcon)) fail("assets/icons/apple-touch-icon.png is missing (npm run icons)");
else {
  const size = pngSize(readFileSync(appleIcon));
  if (!size || size.width !== 180 || size.height !== 180) {
    fail(`apple-touch-icon should be 180×180, is ${size ? `${size.width}×${size.height}` : "unreadable"}`);
  }
}

// Service worker: every file of the shell has to really exist.
const sw = readText("sw.js");
const shell = [...sw.matchAll(/"(\.\/[^"]*)"/g)].map((match) => match[1]).filter((path) => path !== "./");
if (shell.length < 10) fail(`sw.js: unexpectedly small app shell (${shell.length} entries)`);
for (const path of new Set(shell)) {
  if (!existsSync(new URL(path.replace(/^\.\//, ""), root))) fail(`sw.js: ${path} does not exist`);
}

/* 5d: languages – English is complete and leaves the structure untouched */
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
  fail(`English version missing or incomplete: ${missingTranslations.join(", ")}`);
}

const unknownTranslations = Object.keys(EN_EXERCISES).filter((id) => !EXERCISES[id]);
if (unknownTranslations.length) {
  fail(`English version knows unknown exercises: ${unknownTranslations.join(", ")}`);
}

const missingBundles = BUNDLES.filter(
  (bundle) => !EN_BUNDLES[bundle.id]?.summary || !EN_BUNDLES[bundle.id]?.tags?.length,
).map((bundle) => bundle.id);
if (missingBundles.length) fail(`English sessions missing: ${missingBundles.join(", ")}`);

const unknownBundleTranslations = Object.keys(EN_BUNDLES).filter(
  (id) => !BUNDLES.some((bundle) => bundle.id === id),
);
if (unknownBundleTranslations.length) {
  fail(`English sessions without a German counterpart: ${unknownBundleTranslations.join(", ")}`);
}

const labelGaps = [
  ...Object.keys(FOCUS_LABELS)
    .filter((key) => !EN_FOCUS_LABELS[key])
    .map((key) => `focus "${key}"`),
  ...Object.keys(KIND_LABELS)
    .filter((key) => !EN_KIND_LABELS[key])
    .map((key) => `kind "${key}"`),
  ...[...Object.keys(CATEGORY_LABELS), "all"]
    .filter((key) => !EN_CATEGORY_LABELS[key])
    .map((key) => `category "${key}"`),
  ...[...new Set(BUNDLES.flatMap((bundle) => bundle.blocks.map((block) => block.label)))]
    .filter((label) => !EN_BLOCK_LABELS[label])
    .map((label) => `block "${label}"`),
  ...[...new Set([...BUNDLES.map((bundle) => bundle.level), ...Object.values(EXERCISES).map((exercise) => exercise.level)])]
    .filter((level) => !EN_LEVELS[level])
    .map((level) => `level "${level}"`),
];
if (labelGaps.length) fail(`English labels missing: ${labelGaps.join(", ")}`);

// Both languages must offer the same keys, and no English text may still be German.
const missingKeys = Object.keys(STRINGS.de).filter((key) => !(key in STRINGS.en));
if (missingKeys.length) fail(`English UI strings missing: ${missingKeys.join(", ")}`);
const extraKeys = Object.keys(STRINGS.en).filter((key) => !(key in STRINGS.de));
if (extraKeys.length) fail(`English UI strings without a German counterpart: ${extraKeys.join(", ")}`);

const render = (value) => (typeof value === "function" ? value("1", "2", "3") : String(value));
const untranslated = Object.keys(STRINGS.en).filter((key) => GERMAN_HINTS.test(render(STRINGS.en[key])));
if (untranslated.length) {
  fail(`English text still contains German: ${untranslated.join(", ")}`);
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
  fail(`English data text still contains German: ${englishText.slice(0, 3).join(" | ")}`);
}

// The English view must be the same app: same ids, same order, same rhythm.
const english = buildData("en");
if (english.bundles.length !== BUNDLES.length) fail("English version changes the number of sessions");
for (const [index, bundle] of english.bundles.entries()) {
  const source = BUNDLES[index];
  if (bundle.id !== source.id) fail(`English version reorders the sessions (${bundle.id})`);
  if (bundle.blocks.length !== source.blocks.length) fail(`${bundle.id}: blocks differ in the English version`);
  bundle.blocks.forEach((block, blockIndex) => {
    if (block.items.length !== source.blocks[blockIndex].items.length) {
      fail(`${bundle.id}: exercises per block differ in the English version`);
    }
  });
  if (bundleSeconds(bundle) !== EXPECTED_SECONDS) fail(`${bundle.id}: the English version changes the duration`);
}
if (Object.keys(english.exercises).length !== Object.keys(EXERCISES).length) {
  fail("English version changes the number of exercises");
}
for (const [id, exercise] of Object.entries(english.exercises)) {
  if (exercise.slug !== EXERCISES[id].slug || exercise.focus !== EXERCISES[id].focus) {
    fail(`${id}: the English version must not change slug and focus`);
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
  console.log(`Media checked: ${mediaTargets.length} URLs (${mediaTargets.length - failures.length} ok)`);
}

/* result */
const totalSessions = BUNDLES.length;
console.log(`Sessions: ${totalSessions} · catalog: ${Object.keys(EXERCISES).length} exercises · 600s per session`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(` - ${problem}`));
  process.exitCode = 1;
} else {
  console.log("All green.");
}
