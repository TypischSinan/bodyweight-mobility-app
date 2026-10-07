import { posterUrl, videoUrl, availableGender } from "./data/exercises.js";
import {
  PRIMER_SECONDS,
  WORK_SECONDS,
  blockSeconds,
  bundleExerciseCount,
  bundleSeconds,
  bundleSequence,
  formatDuration,
} from "./data/bundles.js";
import { FRAMING, PANEL_ASPECT } from "./data/framing.js";
import { LANGUAGES, applyStaticText, buildData, locale, t } from "./i18n.js";
import { createSessionTimer } from "./timer.js";
import { createCues } from "./audio.js";
import {
  addSession,
  clearHistory,
  computeStats,
  createBackup,
  loadHistory,
  loadPrefs,
  restoreBackup,
  savePrefs,
} from "./storage.js";

/* ------------------------------------------------------------------ Setup */
const $ = (id) => document.getElementById(id);

const dom = {
  categoryFilters: $("category-filters"),
  focusSelect: $("focus-select"),
  bundleList: $("bundle-list"),
  libraryEmpty: $("library-empty"),
  libraryResetFilters: $("library-reset-filters"),
  resultCount: $("result-count"),
  libraryView: $("library-view"),
  detailView: $("detail-view"),
  detailBack: $("detail-back"),
  detailCategory: $("detail-category"),
  detailTitle: $("detail-title"),
  detailSummary: $("detail-summary"),
  detailMetaLine: $("detail-meta-line"),
  detailPlan: $("detail-plan"),
  detailStart: $("detail-start"),
  playerView: $("player-view"),
  playerBack: $("player-back"),
  playerBlock: $("player-block"),
  playerTitle: $("player-title"),
  playerIndex: $("player-index"),
  playerTotal: $("player-total"),
  timer: $("timer"),
  exerciseProgress: $("exercise-progress"),
  sessionProgress: $("session-progress"),
  sessionLeft: $("session-left"),
  media: $("exercise-media"),
  poster: $("media-poster"),
  mediaKind: $("media-kind"),
  mediaNote: $("media-note"),
  exerciseName: $("exercise-name"),
  exerciseSub: $("exercise-sub"),
  cueText: $("cue-text"),
  mistakeText: $("mistake-text"),
  breathText: $("breath-text"),
  detailsToggle: $("details-toggle"),
  detailsPanel: $("details-panel"),
  prevButton: $("prev-button"),
  startButton: $("start-button"),
  startIcon: $("start-icon"),
  startLabel: $("start-label"),
  nextButton: $("next-button"),
  soundToggle: $("sound-toggle"),
  genderToggle: $("gender-toggle"),
  nextName: $("next-name"),
  dashboardView: $("dashboard-view"),
  streakCount: $("streak-count"),
  weekSessions: $("week-sessions"),
  weekMinutes: $("week-minutes"),
  totalSessions: $("total-sessions"),
  totalMinutes: $("total-minutes"),
  weekChart: $("week-chart"),
  weekLabel: $("week-label"),
  historyList: $("history-list"),
  clearHistory: $("clear-history"),
  exportData: $("export-data"),
  importData: $("import-data"),
  importFile: $("import-file"),
  installHint: $("install-hint"),
  completionModal: $("completion-modal"),
  completionTitle: $("completion-title"),
  completionStats: $("completion-stats"),
  completionClose: $("completion-close"),
  liveRegion: $("live-region"),
  navItems: Array.from(document.querySelectorAll(".nav-item")),
  brandLink: $("brand-link"),
  langSwitch: $("lang-switch"),
  langButtons: Array.from(document.querySelectorAll(".lang-switch button")),
};

let prefs = loadPrefs();
// The language is a preference; without a stored choice the browser decides.
let lang = prefs.lang ?? (navigator.language?.toLowerCase().startsWith("de") ? "de" : "en");
// Catalog and sessions in the active language (see src/i18n.js).
let data = buildData(lang);
const cues = createCues();
cues.setEnabled(prefs.sound);

const filters = { category: "all", focus: "all" };
// detailId = the session picked on the detail screen, activeBundle = the one loaded in the player.
// Mixing the two would have kept the previous session's timer running.
const state = { view: "library", detailId: null, hasSession: false };

let timer = null;
let sequence = [];
let activeBundle = null;
let wakeLock = null;
let leadInTimer = null;
let lastMediaKey = "";
let nextPosterKey = "";

const pad = (value) => String(value).padStart(2, "0");
const secondsToDigit = (ms) => Math.ceil(ms / 1000);

/* --------------------------------------------------------------- Library */
function renderCategoryFilters() {
  dom.categoryFilters.innerHTML = data.categories.map(
    (category) => `<button class="filter-button" type="button" data-category="${category.id}" aria-pressed="${
      filters.category === category.id
    }">${category.label}</button>`,
  ).join("");

  dom.categoryFilters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      filters.category = button.dataset.category;
      renderCategoryFilters();
      renderLibrary();
    });
  });
}

function renderFocusSelect() {
  const options = [
    { id: "all", label: t(lang, "focus.all") },
    ...Object.entries(data.focusLabels).map(([id, label]) => ({ id, label })),
  ];
  dom.focusSelect.innerHTML = options
    .map((option) => `<option value="${option.id}">${option.label}</option>`)
    .join("");
  dom.focusSelect.value = filters.focus;
}

/** Deliberately text-light card: number, title, one meta line. Details live on the detail screen. */
function sessionCard(bundle, index) {
  const minutes = Math.round(bundleSeconds(bundle) / 60);
  const intensity = [1, 2, 3]
    .map((level) => `<i class="${level <= bundle.intensity ? "on" : ""}"></i>`)
    .join("");

  return `
    <button class="bundle-card" type="button" data-bundle="${bundle.id}" style="--i:${index}">
      <span class="bundle-index" aria-hidden="true">${pad(index + 1)}</span>
      <span>
        <strong class="bundle-title">${bundle.title}</strong>
        <span class="bundle-meta">
          <span>${data.categoryLabels[bundle.category]}</span><i aria-hidden="true"></i>
          <span>${t(lang, "card.minutes", minutes)}</span><i aria-hidden="true"></i>
          <span>${t(lang, "card.exercises", bundleExerciseCount(bundle))}</span>
          <span class="intensity" title="${t(lang, "card.intensity", bundle.intensity)}">${intensity}</span>
        </span>
      </span>
    </button>`;
}

function renderLibrary() {
  const visible = data.bundles.filter(
    (bundle) =>
      (filters.category === "all" || bundle.category === filters.category) &&
      (filters.focus === "all" || bundle.focus === filters.focus),
  );

  dom.bundleList.innerHTML = visible.map(sessionCard).join("");
  dom.libraryEmpty.hidden = visible.length > 0;
  dom.resultCount.textContent =
    visible.length === data.bundles.length
      ? t(lang, "count.sessions", data.bundles.length)
      : t(lang, "count.range", visible.length, data.bundles.length);

  dom.bundleList.querySelectorAll(".bundle-card").forEach((card) => {
    card.addEventListener("click", () => openDetail(card.dataset.bundle));
  });
}

/* ---------------------------------------------------------------- Detail */
function renderDetail(bundle) {
  const total = bundleSeconds(bundle);
  const count = bundleExerciseCount(bundle);

  dom.detailCategory.textContent = `${data.categoryLabels[bundle.category]} · ${bundle.level}`;
  dom.detailTitle.textContent = bundle.title;
  dom.detailSummary.textContent = bundle.summary;
  // A single line: duration, count and focus. Everything else is in the plan.
  dom.detailMetaLine.textContent = [
    formatDuration(total),
    t(lang, "card.exercises", count),
    data.focusLabels[bundle.focus] ?? bundle.focus,
  ].join(" · ");

  let counter = 0;
  dom.detailPlan.innerHTML = bundle.blocks
    .map((block, blockIndex) => {
      const items = block.items
        .map((item) => {
          counter += 1;
          // The first exercise is the 60-second primer, the rest run 40 s;
          // the trailing "+20" is the 20-second rest that follows it.
          const seconds = counter === 1 ? PRIMER_SECONDS : WORK_SECONDS;
          const pause = counter < count ? `<i>+20</i>` : "";
          return `<div class="plan-item">
            <span class="plan-index">${pad(counter)}</span>
            <span class="plan-name">${data.exercises[item.id].name}</span>
            <span class="plan-time">${seconds}s${pause}</span>
          </div>`;
        })
        .join("");
      return `<div class="plan-block">
        <div class="plan-block-head"><span>${block.label}</span><span>${formatDuration(
          blockSeconds(bundle, blockIndex),
        )}</span></div>
        ${items}
      </div>`;
    })
    .join("");
}

/* ---------------------------------------------------------------- Player */
function playMedia() {
  const playback = dom.media.play();
  if (playback && typeof playback.catch === "function") playback.catch(() => {});
}

// Per-exercise crop: it only trims empty background, so the person stays
// visible in every frame (see scripts/framing.mjs).
function applyFraming(exercise) {
  const framing = FRAMING[exercise.id] ?? { zoom: 1, x: 0.5, y: 0.5, objectX: 0.5 };
  const root = document.documentElement.style;
  root.setProperty("--panel-aspect", PANEL_ASPECT);
  root.setProperty("--object-x", `${(framing.objectX * 100).toFixed(1)}%`);
  root.setProperty("--zoom", String(framing.zoom));
  root.setProperty("--zoom-x", `${(framing.x * 100).toFixed(1)}%`);
  root.setProperty("--zoom-y", `${(framing.y * 100).toFixed(1)}%`);
}

function setMedia(exercise, force = false) {
  const gender = availableGender(exercise, prefs.gender);
  const key = `${exercise.slug}:${gender}`;
  if (!force && key === lastMediaKey) return;
  lastMediaKey = key;

  applyFraming(exercise);
  dom.media.hidden = false;
  dom.poster.hidden = true;
  dom.mediaNote.hidden = true;
  dom.poster.src = posterUrl(exercise, prefs.gender);
  dom.media.src = videoUrl(exercise, prefs.gender);
  dom.media.setAttribute("aria-label", t(lang, "media.demoLabel", exercise.name));
  dom.media.load();
  playMedia();
}

/** During a rest the still image of the next exercise replaces the video. */
function setRestMedia(exercise) {
  const key = `rest:${exercise.slug}`;
  if (key === lastMediaKey) return;
  lastMediaKey = key;

  applyFraming(exercise);
  dom.media.pause();
  dom.media.hidden = true;
  dom.mediaNote.hidden = true;
  dom.poster.hidden = false;
  dom.poster.src = posterUrl(exercise, prefs.gender);
  dom.poster.alt = t(lang, "media.restAlt", exercise.name);
}

// If the browser throttled or blocked playback, catch up on it later.
dom.media.addEventListener("canplay", () => {
  if (dom.media.paused && !dom.media.hidden) playMedia();
});

dom.media.addEventListener("error", () => {
  dom.media.hidden = true;
  dom.poster.hidden = false;
  dom.mediaNote.hidden = false;
  dom.mediaNote.textContent = t(lang, "media.offline");
});

function setStartButton(mode, label) {
  if (mode === "busy") {
    dom.startIcon.textContent = "…";
    dom.startLabel.textContent = label;
    dom.startButton.disabled = true;
    dom.startButton.setAttribute("aria-busy", "true");
    return;
  }
  dom.startButton.disabled = false;
  dom.startButton.removeAttribute("aria-busy");
  if (mode === "run") {
    dom.startIcon.textContent = "Ⅱ";
    dom.startLabel.textContent = t(lang, "player.pause");
  } else {
    dom.startIcon.textContent = "▶";
    dom.startLabel.textContent = t(lang, "player.start");
  }
}

/** Next work item after `index` (rests are skipped). */
function workItemAfter(index) {
  for (let i = index + 1; i < sequence.length; i += 1) {
    if (!sequence[i].rest) return sequence[i];
  }
  return null;
}

function renderPlayer({ announce = false } = {}) {
  if (!timer || !activeBundle) return;
  const snapshot = timer.state();
  const item = sequence[snapshot.index];
  const isRest = Boolean(item.rest);
  // During a rest the screen already shows the next exercise.
  const shown = isRest ? item.nextExercise : item.exercise;
  const after = isRest ? workItemAfter(snapshot.index + 1) : workItemAfter(snapshot.index);
  const left = secondsToDigit(snapshot.remaining);

  // Position counts exercises: during a rest it already shows the exercise
  // the screen is displaying.
  const done = sequence.slice(0, snapshot.index + 1).filter((entry) => !entry.rest).length;
  dom.playerBlock.textContent = isRest ? t(lang, "player.blockRest") : item.block;
  dom.playerTitle.textContent = activeBundle.title;
  dom.playerIndex.textContent = pad(isRest ? done + 1 : done);
  dom.playerTotal.textContent = pad(bundleExerciseCount(activeBundle));

  dom.timer.textContent = String(left);
  dom.exerciseProgress.style.width = `${Math.min(100, snapshot.exerciseProgress * 100)}%`;
  dom.sessionProgress.style.width = `${Math.min(100, snapshot.sessionProgress * 100)}%`;
  dom.sessionLeft.textContent = formatDuration(Math.round(snapshot.sessionRemaining / 1000));

  dom.mediaKind.textContent = isRest
    ? t(lang, "player.restBadge")
    : (data.kindLabels[shown.kind] ?? t(lang, "player.kindFallback"));
  dom.exerciseName.textContent = shown.name;
  dom.exerciseSub.textContent = shown.sub;
  dom.cueText.textContent = shown.cue;
  dom.mistakeText.textContent = shown.mistake;
  dom.breathText.textContent = shown.breath;
  dom.nextName.textContent = after ? after.exercise.name : t(lang, "player.done");

  // Preload the next poster so the switch does not stutter.
  if (nextPosterKey !== shown.slug) {
    nextPosterKey = shown.slug;
    const preload = new Image();
    preload.src = posterUrl(shown, prefs.gender);
  }

  dom.genderToggle.disabled = Boolean(shown.only);
  dom.genderToggle.title = shown.only
    ? t(lang, "player.genderOnlyOne")
    : t(lang, "player.genderTitle");

  if (isRest) setRestMedia(shown);
  else setMedia(shown);

  // The labels follow the selected language even when the media itself does not
  // change – a language switch must not leave the previous wording behind.
  dom.media.setAttribute("aria-label", t(lang, "media.demoLabel", shown.name));
  dom.poster.alt = isRest ? t(lang, "media.restAlt", shown.name) : "";

  if (!leadInTimer) setStartButton(snapshot.running ? "run" : "idle");

  if (announce) {
    dom.liveRegion.textContent = isRest
      ? t(lang, "announce.rest", item.seconds, shown.name, shown.cue)
      : t(lang, "announce.exercise", shown.name, item.seconds, shown.cue);
  }
}

function buildTimer(bundle) {
  if (timer) timer.destroy();
  activeBundle = bundle;
  sequence = bundleSequence(bundle, data.exercises);
  lastMediaKey = "";

  timer = createSessionTimer({
    sequence,
    onUpdate: () => renderPlayer(),
    onTransition: (index) => renderPlayer({ announce: true }),
    onComplete: () => {
      releaseWakeLock();
      saveCompletedSession();
    },
    onBeep: (kind) => cues.cue(kind),
  });
}

function setDetailsOpen(open) {
  dom.detailsPanel.hidden = !open;
  dom.detailsToggle.setAttribute("aria-expanded", String(open));
  dom.detailsToggle.textContent = open ? t(lang, "player.less") : t(lang, "player.details");
}

function openPlayer(bundle, { autostart = false } = {}) {
  const isLoaded = Boolean(timer) && activeBundle?.id === bundle.id;
  if (!isLoaded) {
    buildTimer(bundle);
  } else if (timer.state().finished) {
    // Reopening a finished session starts it over from the beginning.
    timer.reset();
  }
  state.hasSession = true;
  prefs = savePrefs({ lastBundleId: bundle.id });
  setDetailsOpen(false);
  setView("player");
  renderPlayer({ announce: true });
  if (autostart) startSession();
}

function startSession() {
  if (!timer) return;
  cues.unlock();

  if (timer.isRunning()) {
    timer.pause();
    releaseWakeLock();
    setStartButton("idle");
    return;
  }

  if (leadInTimer) {
    clearTimeout(leadInTimer);
    leadInTimer = null;
    setStartButton("idle");
    return;
  }

  const snapshot = timer.state();
  const isFreshStart = snapshot.index === 0 && snapshot.remaining === snapshot.durations[0];
  if (!isFreshStart) {
    startTimer();
    return;
  }

  let countdown = 3;
  setStartButton("busy", t(lang, "player.ready", countdown));
  cues.cue("count");
  const step = () => {
    countdown -= 1;
    if (countdown > 0) {
      cues.cue("count");
      setStartButton("busy", t(lang, "player.ready", countdown));
      leadInTimer = setTimeout(step, 800);
      return;
    }
    leadInTimer = null;
    startTimer();
  };
  leadInTimer = setTimeout(step, 800);
}

function startTimer() {
  setStartButton("run");
  timer.start();
  requestWakeLock();
}

/* ------------------------------------------------------------- Completion */
// Kept so that a language switch can redraw the summary that is on screen.
let lastCompletion = null;

/** Draws the summary of a finished session in the active language. */
function renderCompletion({ entry, stats }) {
  dom.completionTitle.textContent = t(lang, "completion.done", activeBundle?.title ?? "");
  dom.completionStats.innerHTML = [
    [t(lang, "completion.duration"), formatDuration(Math.round(entry.seconds / 60) * 60)],
    [t(lang, "completion.exercises"), `${bundleExerciseCount(activeBundle)}`],
    [
      t(lang, "completion.streak"),
      stats.streak === 1
        ? t(lang, "completion.day", stats.streak)
        : t(lang, "completion.days", stats.streak),
    ],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function saveCompletedSession() {
  const entry = addSession({
    bundleId: activeBundle.id,
    title: activeBundle.title,
    category: activeBundle.category,
    seconds: bundleSeconds(activeBundle),
  });
  lastCompletion = { entry, stats: computeStats(loadHistory(), locale(lang)) };
  renderCompletion(lastCompletion);

  dom.completionModal.hidden = false;
  dom.completionClose.focus();
  setStartButton("idle");
}

function closeCompletion() {
  dom.completionModal.hidden = true;
  renderDashboard();
  setView("dashboard");
  dom.startButton.focus();
}

/* -------------------------------------------------------------- Dashboard */
function renderDashboard() {
  const stats = computeStats(loadHistory(), locale(lang));
  const maxMinutes = Math.max(10, ...stats.days.map((day) => day.minutes));

  dom.streakCount.textContent = String(stats.streak);
  dom.weekSessions.textContent = String(stats.weekSessions);
  dom.weekMinutes.textContent = String(stats.weekMinutes);
  dom.totalSessions.textContent = String(stats.totalSessions);
  dom.totalMinutes.textContent = String(stats.totalMinutes);
  dom.weekLabel.textContent = t(lang, "dashboard.minutes", stats.weekMinutes);
  dom.clearHistory.hidden = stats.totalSessions === 0;

  dom.weekChart.innerHTML = stats.days
    .map((day) => {
      const height = day.minutes > 0 ? Math.max(12, Math.round((day.minutes / maxMinutes) * 100)) : 4;
      return `<div class="day-bar${day.isToday ? " today" : ""}">
        <div class="bar${day.minutes > 0 ? " done" : ""}" style="height:${height}%">
          <span>${day.minutes > 0 ? day.minutes : ""}</span>
        </div>
        <small>${day.label}</small>
      </div>`;
    })
    .join("");

  dom.historyList.innerHTML = stats.recent.length
    ? stats.recent
        .map((entry) => {
          const date = new Date(entry.finishedAt);
          return `<div class="history-row">
            <span class="history-check" aria-hidden="true">✓</span>
            <div>
              <strong>${entry.title}</strong>
              <small>${data.categoryLabels[entry.category] ?? entry.category} · ${date.toLocaleDateString(
                locale(lang),
                {
                  day: "2-digit",
                  month: "2-digit",
                },
              )}</small>
            </div>
            <b>${t(lang, "card.minutes", Math.round((entry.seconds ?? 0) / 60))}</b>
          </div>`;
        })
        .join("")
    : `<div class="empty-state">${t(lang, "dashboard.empty")}</div>`;
}

/* -------------------------------------------------------------- Navigation */
function setView(view, { scroll = true } = {}) {
  state.view = view;
  dom.libraryView.hidden = view !== "library";
  dom.detailView.hidden = view !== "detail";
  dom.playerView.hidden = view !== "player";
  dom.dashboardView.hidden = view !== "dashboard";
  // fit=true: plan and player fill the iPhone screen completely, so the page
  // itself does not scroll there (see style.css).
  document.body.classList.toggle("fit", view === "detail" || view === "player");

  const tab = view === "dashboard" ? "dashboard" : view === "player" || view === "detail" ? "training" : "sessions";
  dom.navItems.forEach((nav) => nav.classList.toggle("is-active", nav.dataset.tab === tab));

  if (scroll) window.scrollTo({ top: 0, behavior: view === "library" ? "smooth" : "auto" });
}

function openLibrary() {
  if (timer && timer.isRunning()) timer.pause();
  releaseWakeLock();
  renderLibrary();
  setView("library");
}

function openDetail(bundleId) {
  const bundle = data.bundles.find((item) => item.id === bundleId);
  if (!bundle) return;
  state.detailId = bundle.id;
  renderDetail(bundle);
  setView("detail");
}

function openDashboard() {
  renderDashboard();
  setView("dashboard");
}

function openTrainingTab() {
  // The tab toggles between plan and running session – which also makes it the
  // way back out of the player.
  if (state.view === "player") {
    if (timer && timer.isRunning()) timer.pause();
    releaseWakeLock();
    openDetail(activeBundle?.id ?? state.detailId);
    return;
  }

  // If a session is still running, go straight back to it – otherwise to the picker.
  if (state.hasSession && timer && activeBundle && !timer.state().finished) {
    renderPlayer();
    setView("player");
    return;
  }
  const bundle =
    data.bundles.find((item) => item.id === state.detailId) ??
    data.bundles.find((item) => item.id === prefs.lastBundleId) ??
    data.bundles[0];
  openDetail(bundle.id);
}

/* ------------------------------------------------------------- Wake Lock */
async function requestWakeLock() {
  if (!("wakeLock" in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  if (!wakeLock) return;
  try {
    wakeLock.release();
  } catch {
    /* irrelevant */
  }
  wakeLock = null;
}

/* ------------------------------------------------------------ Going back */
/** Leaves the player and pauses the session. */
function leavePlayer() {
  if (timer && timer.isRunning()) timer.pause();
  releaseWakeLock();
  openDetail(activeBundle?.id ?? state.detailId);
}

/**
 * Swiping right = back – the familiar iPhone gesture, in addition to the button
 * next to the title.
 */
function attachSwipeBack(element, goBack) {
  let start = null;

  element.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        start = null;
        return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    },
    { passive: true },
  );

  element.addEventListener(
    "touchend",
    (event) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const elapsed = Date.now() - start.time;
      start = null;
      // Clearly to the right, barely up or down, not a long gesture.
      if (dx > 70 && Math.abs(dy) < 50 && elapsed < 700) goBack();
    },
    { passive: true },
  );

  element.addEventListener("touchcancel", () => {
    start = null;
  });
}

attachSwipeBack(dom.detailView, openLibrary);
attachSwipeBack(dom.playerView, leavePlayer);

/* ----------------------------------------------------------------- Events */
dom.detailBack.addEventListener("click", openLibrary);
dom.playerBack.addEventListener("click", leavePlayer);
dom.brandLink.addEventListener("click", (event) => {
  event.preventDefault();
  openLibrary();
});
dom.detailStart.addEventListener("click", () => {
  const bundle = data.bundles.find((item) => item.id === state.detailId);
  if (bundle) openPlayer(bundle, { autostart: true });
});
dom.detailsToggle.addEventListener("click", () => {
  setDetailsOpen(dom.detailsPanel.hidden);
});
dom.startButton.addEventListener("click", startSession);
dom.nextButton.addEventListener("click", () => {
  if (timer) timer.step(1);
});
dom.prevButton.addEventListener("click", () => {
  if (timer) timer.step(-1);
});
dom.soundToggle.addEventListener("click", () => {
  prefs = savePrefs({ sound: !prefs.sound });
  cues.setEnabled(prefs.sound);
  if (prefs.sound) cues.unlock();
  syncToggles();
});
dom.genderToggle.addEventListener("click", () => {
  prefs = savePrefs({ gender: prefs.gender === "male" ? "female" : "male" });
  syncToggles();
  const item = sequence[timer.state().index];
  setMedia(item.rest ? item.nextExercise : item.exercise, true);
  renderPlayer();
});
dom.focusSelect.addEventListener("change", () => {
  filters.focus = dom.focusSelect.value;
  renderLibrary();
});
dom.libraryResetFilters.addEventListener("click", () => {
  filters.category = "all";
  filters.focus = "all";
  renderCategoryFilters();
  renderFocusSelect();
  renderLibrary();
});
dom.clearHistory.addEventListener("click", () => {
  if (!window.confirm(t(lang, "confirm.clear"))) return;
  clearHistory();
  renderDashboard();
});

// Backup as a JSON file: otherwise the progress only lives in this browser's
// storage (localStorage) and would be lost when clearing website data.
dom.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = t(lang, "backup.fileName", new Date().toISOString().slice(0, 10));
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  dom.liveRegion.textContent = t(lang, "live.backup");
});

dom.importData.addEventListener("click", () => dom.importFile.click());

dom.importFile.addEventListener("change", async () => {
  const file = dom.importFile.files?.[0];
  if (!file) return;
  try {
    const result = restoreBackup(await file.text());
    prefs = loadPrefs();
    syncToggles();
    renderDashboard();
    dom.liveRegion.textContent = t(lang, "live.imported", result.added, result.total);
  } catch (error) {
    window.alert(t(lang, `error.${error?.code ?? "invalidFile"}`));
  } finally {
    dom.importFile.value = "";
  }
});
dom.completionClose.addEventListener("click", closeCompletion);
dom.completionModal.addEventListener("click", (event) => {
  if (event.target === dom.completionModal) closeCompletion();
});

dom.langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

dom.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.tab === "sessions") openLibrary();
    else if (item.dataset.tab === "training") openTrainingTab();
    else openDashboard();
  });
});

document.addEventListener("keydown", (event) => {
  if (!dom.completionModal.hidden) {
    if (event.key === "Escape") closeCompletion();
    return;
  }
  if (state.view === "detail") {
    if (event.key === "Escape") openLibrary();
    return;
  }

  if (state.view !== "player" || !timer) return;

  if (event.code === "Space") {
    event.preventDefault();
    startSession();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    timer.step(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    timer.step(-1);
  } else if (event.key.toLowerCase() === "r") {
    timer.reset();
  } else if (event.key === "Escape") {
    leavePlayer();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (!timer?.isRunning()) return;
  requestWakeLock();
  if (dom.media.paused) playMedia();
});

function syncToggles() {
  dom.soundToggle.setAttribute("aria-pressed", String(prefs.sound));
  dom.soundToggle.textContent = prefs.sound ? t(lang, "player.soundOn") : t(lang, "player.soundOff");
  dom.genderToggle.textContent = t(
    lang,
    prefs.gender === "male" ? "player.genderMale" : "player.genderFemale",
  );
  dom.genderToggle.setAttribute("aria-pressed", String(prefs.gender === "female"));
}

/* ---------------------------------------------------------------- Language */
function syncLangSwitch() {
  dom.langButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });
}

/**
 * Puts the active language on everything that is on screen. A running session
 * keeps its state: only display strings are swapped, the timer is untouched.
 */
function applyLanguage() {
  data = buildData(lang);
  applyStaticText(lang);

  if (activeBundle) {
    activeBundle = data.bundles.find((bundle) => bundle.id === activeBundle.id) ?? activeBundle;
    sequence = bundleSequence(activeBundle, data.exercises);
  }

  syncLangSwitch();
  syncToggles();
  renderCategoryFilters();
  renderFocusSelect();

  if (state.view === "player") renderPlayer({ announce: false });
  else if (state.view === "detail") {
    const bundle = data.bundles.find((item) => item.id === state.detailId);
    if (bundle) renderDetail(bundle);
  } else if (state.view === "dashboard") renderDashboard();
  else renderLibrary();

  if (!dom.completionModal.hidden && lastCompletion) renderCompletion(lastCompletion);
}

function setLanguage(next) {
  if (!LANGUAGES.includes(next) || next === lang) return;
  lang = next;
  prefs = savePrefs({ lang });
  applyLanguage();
}

/* ------------------------------------------------- Installation & Offline */
// Service worker: caches the app shell so the home-screen shortcut also starts
// without a network (timer and log keep working offline).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* e.g. without HTTPS – the app still works */
    });
  });
}

const installed =
  window.matchMedia?.("(display-mode: standalone)").matches === true || window.navigator.standalone === true;
// Only show the hint where it is actually true (iOS Safari, not installed).
const isIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
if (!installed && isIos) dom.installHint.hidden = false;

/* ------------------------------------------------------------------- Start */
// Global video frame (comes from the framing analysis, applies to every exercise).
document.documentElement.style.setProperty("--panel-aspect", PANEL_ASPECT);

applyStaticText(lang);
renderCategoryFilters();
renderFocusSelect();
renderLibrary();
syncToggles();
syncLangSwitch();
setView("library", { scroll: false });
