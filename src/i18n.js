/**
 * Language layer.
 *
 * Two languages, German first (the app was written in German, `de` is the
 * source of truth) and English as a full second language. This module owns:
 *
 *  - the chrome strings of the interface (`STRINGS`, addressed by key),
 *  - `applyStaticText()` for everything that already stands in index.html,
 *  - `buildData()` which takes the German catalog and lays the English display
 *    strings from `src/data/en.*.js` on top of it, without touching structure,
 *    order or timing.
 *
 * The German data files stay untouched by the switch: ids, blocks, seconds and
 * media fields are language-independent, only display text is swapped.
 */
import { BUNDLES, CATEGORIES, CATEGORY_LABELS } from "./data/bundles.js";
import { EXERCISES, FOCUS_LABELS, KIND_LABELS } from "./data/exercises.js";
import {
  EN_BLOCK_LABELS,
  EN_BUNDLES,
  EN_CATEGORY_LABELS,
  EN_LEVELS,
} from "./data/en.bundles.js";
import { EN_EXERCISES, EN_FOCUS_LABELS, EN_KIND_LABELS } from "./data/en.exercises.js";

export const LANGUAGES = ["de", "en"];

/** BCP 47 tag for dates and weekday labels. */
export const locale = (lang) => (lang === "en" ? "en-GB" : "de-DE");

export const STRINGS = {
  de: {
    "app.title": "Pulse — 10 Minute Training",
    "meta.description":
      "Pulse — 16 gerätefreie 10-Minuten-Sessions mit Demo-Videos, Timer und Trainingslog.",
    "lang.group": "Sprache",

    "library.hero": 'Wähle eine<br /><span class="accent">Session.</span>',
    "library.filterCategory": "Kategorie filtern",
    "library.filterFocus": "Fokus filtern",
    "library.heading": "Sessions",
    "library.empty": "Keine Session passt zu dieser Kombination.",
    "library.resetFilters": "Filter zurücksetzen",
    "focus.all": "Alle Foki",
    "count.sessions": (total) => `${total} Sessions`,
    "count.range": (visible, total) => `${visible} von ${total}`,
    "card.minutes": (minutes) => `${minutes} Min`,
    "card.exercises": (count) => `${count} Übungen`,
    "card.intensity": (level) => `Intensität ${level} von 3`,

    "detail.eyebrow": "Kraft · Einsteiger",
    "detail.back": "Zurück zu den Sessions",
    "detail.start": '<span aria-hidden="true">▶</span> Session starten',

    "player.back": "Zurück zum Ablauf",
    "player.demo": "Übungsdemo",
    "player.seconds": "SEK",
    "player.left": "übrig",
    "player.blockRest": "Pause",
    "player.kindFallback": "Übung",
    "player.restBadge": "Pause · gleich",
    "player.nextLabel": "Danach",
    "player.done": "Fertig",
    "player.details": "Details",
    "player.less": "Weniger",
    "player.muscles": "Muskeln",
    "player.watch": "Achte auf",
    "player.breathing": "Atmung",
    "player.prev": "Vorherige Übung",
    "player.next": "Nächste Übung",
    "player.prevTitle": "Vorherige Übung (←)",
    "player.nextTitle": "Nächste Übung (→)",
    "player.startTitle": "Start / Pause (Leertaste)",
    "player.start": "Start",
    "player.pause": "Pause",
    "player.ready": (countdown) => `Bereit ${countdown}`,
    "player.soundOn": "Ton",
    "player.soundOff": "Stumm",
    "player.soundTitle": "Ton ein/aus",
    "player.genderMale": "Mann",
    "player.genderFemale": "Frau",
    "player.genderTitle": "Demo-Aufnahme wechseln (Mann / Frau)",
    "player.genderOnlyOne": "Für diese Übung gibt es nur eine Demo-Aufnahme.",
    "media.demoLabel": (name) => `Demo: ${name}`,
    "media.restAlt": (name) => `Als Nächstes: ${name}`,
    "media.offline": "Demo-Video gerade nicht erreichbar – Standbild wird gezeigt.",
    "announce.exercise": (name, seconds, cue) => `${name}, ${seconds} Sekunden. ${cue}.`,
    "announce.rest": (seconds, name, cue) =>
      `Pause, ${seconds} Sekunden. Als Nächstes ${name}. ${cue}.`,

    "dashboard.hero": 'Weiter<br /><span class="accent">dranbleiben.</span>',
    "dashboard.streakUnit": "Tage<br />Streak",
    "dashboard.weekSessions": "Sessions · 7 Tage",
    "dashboard.weekMinutes": "Minuten · 7 Tage",
    "dashboard.totalSessions": "Sessions gesamt",
    "dashboard.totalMinutes": "Minuten gesamt",
    "dashboard.lastDays": "Letzte 7 Tage",
    "dashboard.recent": "Zuletzt gemacht",
    "dashboard.minutes": (minutes) => `${minutes} Minuten`,
    "dashboard.empty": "Noch keine Session abgeschlossen. Deine erste wartet in den Sessions.",
    "dashboard.installHint":
      'Tipp: <b>Teilen → „Zum Home-Bildschirm"</b> – dann startet Pulse als App und der Fortschritt bleibt dauerhaft gespeichert.',
    "dashboard.export": "Fortschritt sichern",
    "dashboard.import": "Sicherung laden",
    "dashboard.clear": "Zurücksetzen",
    "confirm.clear": "Gesamten Trainingsfortschritt löschen?",
    "backup.fileName": (date) => `pulse-fortschritt-${date}.json`,
    "live.backup": "Sicherung erstellt.",
    "live.imported": (added, total) =>
      `${added} Sessions übernommen, ${total} insgesamt.`,
    "error.invalidFile": "Die Datei ist keine gültige Pulse-Sicherung.",
    "error.noHistory": "In der Datei fehlt der Trainingsverlauf.",
    "error.noSessions": "Die Sicherung enthält keine Sessions.",

    "completion.eyebrow": "Session geschafft",
    "completion.title": "Stark gemacht.",
    "completion.done": (title) => `${title} geschafft.`,
    "completion.duration": "Dauer",
    "completion.exercises": "Übungen",
    "completion.streak": "Streak",
    "completion.day": (days) => `${days} Tag`,
    "completion.days": (days) => `${days} Tage`,
    "completion.close": "Weiter",

    "nav.aria": "Hauptnavigation",
    "nav.sessions": '<span aria-hidden="true">▦</span>Sessions',
    "nav.training": '<span aria-hidden="true">▶</span>Training',
    "nav.dashboard": '<span aria-hidden="true">◔</span>Dashboard',
  },

  en: {
    "app.title": "Pulse — 10 Minute Training",
    "meta.description":
      "Pulse — 16 equipment-free 10-minute sessions with demo videos, timer and training log.",
    "lang.group": "Language",

    "library.hero": 'Pick a<br /><span class="accent">session.</span>',
    "library.filterCategory": "Filter by category",
    "library.filterFocus": "Filter by focus",
    "library.heading": "Sessions",
    "library.empty": "No session matches this combination.",
    "library.resetFilters": "Reset filters",
    "focus.all": "All focuses",
    "count.sessions": (total) => `${total} sessions`,
    "count.range": (visible, total) => `${visible} of ${total}`,
    "card.minutes": (minutes) => `${minutes} min`,
    "card.exercises": (count) => `${count} exercises`,
    "card.intensity": (level) => `Intensity ${level} of 3`,

    "detail.eyebrow": "Strength · Beginner",
    "detail.back": "Back to the sessions",
    "detail.start": '<span aria-hidden="true">▶</span> Start session',

    "player.back": "Back to the plan",
    "player.demo": "Exercise demo",
    "player.seconds": "SEC",
    "player.left": "left",
    "player.blockRest": "Rest",
    "player.kindFallback": "Exercise",
    "player.restBadge": "Rest · next",
    "player.nextLabel": "Next",
    "player.done": "Done",
    "player.details": "Details",
    "player.less": "Less",
    "player.muscles": "Muscles",
    "player.watch": "Watch for",
    "player.breathing": "Breathing",
    "player.prev": "Previous exercise",
    "player.next": "Next exercise",
    "player.prevTitle": "Previous exercise (←)",
    "player.nextTitle": "Next exercise (→)",
    "player.startTitle": "Start / pause (space)",
    "player.start": "Start",
    "player.pause": "Pause",
    "player.ready": (countdown) => `Ready ${countdown}`,
    "player.soundOn": "Sound",
    "player.soundOff": "Muted",
    "player.soundTitle": "Sound on/off",
    "player.genderMale": "Male",
    "player.genderFemale": "Female",
    "player.genderTitle": "Switch demo recording (male / female)",
    "player.genderOnlyOne": "Only one demo recording exists for this exercise.",
    "media.demoLabel": (name) => `Demo: ${name}`,
    "media.restAlt": (name) => `Up next: ${name}`,
    "media.offline": "Demo video currently unreachable — showing the still image.",
    "announce.exercise": (name, seconds, cue) => `${name}, ${seconds} seconds. ${cue}.`,
    "announce.rest": (seconds, name, cue) =>
      `Rest, ${seconds} seconds. Up next ${name}. ${cue}.`,

    "dashboard.hero": 'Stay<br /><span class="accent">consistent.</span>',
    "dashboard.streakUnit": "day<br />streak",
    "dashboard.weekSessions": "Sessions · 7 days",
    "dashboard.weekMinutes": "Minutes · 7 days",
    "dashboard.totalSessions": "Sessions total",
    "dashboard.totalMinutes": "Minutes total",
    "dashboard.lastDays": "Last 7 days",
    "dashboard.recent": "Recently done",
    "dashboard.minutes": (minutes) => `${minutes} minutes`,
    "dashboard.empty": "No session finished yet. Your first one is waiting under Sessions.",
    "dashboard.installHint":
      'Tip: <b>Share → “Add to Home Screen”</b> – then Pulse starts as an app and your progress is kept for good.',
    "dashboard.export": "Back up progress",
    "dashboard.import": "Load backup",
    "dashboard.clear": "Reset",
    "confirm.clear": "Delete all training progress?",
    "backup.fileName": (date) => `pulse-progress-${date}.json`,
    "live.backup": "Backup created.",
    "live.imported": (added, total) => `${added} sessions imported, ${total} in total.`,
    "error.invalidFile": "This file is not a valid Pulse backup.",
    "error.noHistory": "The file contains no training history.",
    "error.noSessions": "The backup contains no sessions.",

    "completion.eyebrow": "Session complete",
    "completion.title": "Well done.",
    "completion.done": (title) => `${title} done.`,
    "completion.duration": "Duration",
    "completion.exercises": "Exercises",
    "completion.streak": "Streak",
    "completion.day": (days) => `${days} day`,
    "completion.days": (days) => `${days} days`,
    "completion.close": "Continue",

    "nav.aria": "Main navigation",
    "nav.sessions": '<span aria-hidden="true">▦</span>Sessions',
    "nav.training": '<span aria-hidden="true">▶</span>Training',
    "nav.dashboard": '<span aria-hidden="true">◔</span>Dashboard',
  },
};

/**
 * Reads a string. Missing keys fall back to German and then to the key itself,
 * so a forgotten translation shows up as a readable key instead of `undefined`.
 */
export function t(lang, key, ...args) {
  const value = STRINGS[lang]?.[key] ?? STRINGS.de[key];
  if (value === undefined) return key;
  return typeof value === "function" ? value(...args) : value;
}

/** Applies the language to everything index.html ships as static markup. */
export function applyStaticText(lang) {
  document.documentElement.lang = lang;
  document.title = t(lang, "app.title");

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t(lang, "meta.description"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.innerHTML = t(lang, element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(lang, element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(lang, element.dataset.i18nTitle));
  });
}

/**
 * The catalog and the sessions in the requested language. German needs no work
 * (it is the source), English layers the translated display strings on top and
 * falls back field by field to German if something were missing.
 */
export function buildData(lang) {
  if (lang !== "en") {
    return {
      bundles: BUNDLES,
      exercises: EXERCISES,
      categories: CATEGORIES,
      categoryLabels: CATEGORY_LABELS,
      focusLabels: FOCUS_LABELS,
      kindLabels: KIND_LABELS,
    };
  }

  const exercises = {};
  for (const [id, exercise] of Object.entries(EXERCISES)) {
    const translation = EN_EXERCISES[id] ?? {};
    exercises[id] = {
      ...exercise,
      name: translation.name ?? exercise.name,
      sub: translation.sub ?? exercise.sub,
      cue: translation.cue ?? exercise.cue,
      mistake: translation.mistake ?? exercise.mistake,
      breath: translation.breath ?? exercise.breath,
      level: EN_LEVELS[exercise.level] ?? exercise.level,
    };
  }

  const bundles = BUNDLES.map((bundle) => {
    const translation = EN_BUNDLES[bundle.id] ?? {};
    return {
      ...bundle,
      level: EN_LEVELS[bundle.level] ?? bundle.level,
      summary: translation.summary ?? bundle.summary,
      tags: translation.tags ?? bundle.tags,
      blocks: bundle.blocks.map((block) => ({
        ...block,
        label: EN_BLOCK_LABELS[block.label] ?? block.label,
      })),
    };
  });

  return {
    bundles,
    exercises,
    categories: CATEGORIES.map((category) => ({
      ...category,
      label: EN_CATEGORY_LABELS[category.id] ?? category.label,
    })),
    categoryLabels: EN_CATEGORY_LABELS,
    focusLabels: EN_FOCUS_LABELS,
    kindLabels: EN_KIND_LABELS,
  };
}
