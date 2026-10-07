import {
  EXERCISES,
  FOCUS_LABELS,
  KIND_LABELS,
  posterUrl,
  videoUrl,
  availableGender,
} from "./data/exercises.js";
import {
  BUNDLES,
  CATEGORIES,
  CATEGORY_LABELS,
  PRIMER_SECONDS,
  WORK_SECONDS,
  blockSeconds,
  bundleExerciseCount,
  bundleSeconds,
  bundleSequence,
  formatDuration,
} from "./data/bundles.js";
import { FRAMING, PANEL_ASPECT } from "./data/framing.js";
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
};

let prefs = loadPrefs();
const cues = createCues();
cues.setEnabled(prefs.sound);

const filters = { category: "all", focus: "all" };
// detailId = was im Detail-Schirm gewählt wurde, activeBundle = was im Player geladen ist.
// Beides zu vermischen hätte den Timer der vorigen Session weiterlaufen lassen.
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

/* ----------------------------------------------------------- Bibliothek */
function renderCategoryFilters() {
  dom.categoryFilters.innerHTML = CATEGORIES.map(
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
  const options = [{ id: "all", label: "Alle Foki" }, ...Object.entries(FOCUS_LABELS).map(([id, label]) => ({ id, label }))];
  dom.focusSelect.innerHTML = options
    .map((option) => `<option value="${option.id}">${option.label}</option>`)
    .join("");
  dom.focusSelect.value = filters.focus;
}

/** Karte bewusst textarm: Nummer, Titel, eine Metazeile. Details stehen im Detail-Schirm. */
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
          <span>${CATEGORY_LABELS[bundle.category]}</span><i aria-hidden="true"></i>
          <span>${minutes} Min</span><i aria-hidden="true"></i>
          <span>${bundleExerciseCount(bundle)} Übungen</span>
          <span class="intensity" title="Intensität ${bundle.intensity} von 3">${intensity}</span>
        </span>
      </span>
    </button>`;
}

function renderLibrary() {
  const visible = BUNDLES.filter(
    (bundle) =>
      (filters.category === "all" || bundle.category === filters.category) &&
      (filters.focus === "all" || bundle.focus === filters.focus),
  );

  dom.bundleList.innerHTML = visible.map(sessionCard).join("");
  dom.libraryEmpty.hidden = visible.length > 0;
  dom.resultCount.textContent =
    visible.length === BUNDLES.length ? `${BUNDLES.length} Sessions` : `${visible.length} von ${BUNDLES.length}`;

  dom.bundleList.querySelectorAll(".bundle-card").forEach((card) => {
    card.addEventListener("click", () => openDetail(card.dataset.bundle));
  });
}

/* ---------------------------------------------------------------- Detail */
function renderDetail(bundle) {
  const total = bundleSeconds(bundle);
  const count = bundleExerciseCount(bundle);

  dom.detailCategory.textContent = `${CATEGORY_LABELS[bundle.category]} · ${bundle.level}`;
  dom.detailTitle.textContent = bundle.title;
  dom.detailSummary.textContent = bundle.summary;
  // Eine einzige Zeile: Dauer, Anzahl und Fokus. Alles Weitere steht im Ablauf.
  dom.detailMetaLine.textContent = [
    formatDuration(total),
    `${count} Übungen`,
    FOCUS_LABELS[bundle.focus] ?? bundle.focus,
  ].join(" · ");

  let counter = 0;
  dom.detailPlan.innerHTML = bundle.blocks
    .map((block, blockIndex) => {
      const items = block.items
        .map((item) => {
          counter += 1;
          // Erste Übung ist der 60-Sekunden-Primer, alle weiteren laufen 40 s;
          // danach steht jeweils die 20-Sekunden-Pause (+20).
          const seconds = counter === 1 ? PRIMER_SECONDS : WORK_SECONDS;
          const pause = counter < count ? `<i>+20</i>` : "";
          return `<div class="plan-item">
            <span class="plan-index">${pad(counter)}</span>
            <span class="plan-name">${EXERCISES[item.id].name}</span>
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

// Bildausschnitt je Übung: schneidet nur leeren Hintergrund weg, die Person
// bleibt in jedem Frame sichtbar (siehe scripts/framing.mjs).
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
  dom.media.setAttribute("aria-label", `Demo: ${exercise.name}`);
  dom.media.load();
  playMedia();
}

/** In der Pause steht statt des Videos das Standbild der nächsten Übung. */
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
  dom.poster.alt = `Als Nächstes: ${exercise.name}`;
}

// Falls der Browser die Wiedergabe gedrosselt oder blockiert hat, später nachholen.
dom.media.addEventListener("canplay", () => {
  if (dom.media.paused && !dom.media.hidden) playMedia();
});

dom.media.addEventListener("error", () => {
  dom.media.hidden = true;
  dom.poster.hidden = false;
  dom.mediaNote.hidden = false;
  dom.mediaNote.textContent = "Demo-Video gerade nicht erreichbar – Standbild wird gezeigt.";
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
    dom.startLabel.textContent = "Pause";
  } else {
    dom.startIcon.textContent = "▶";
    dom.startLabel.textContent = "Start";
  }
}

/** Nächste Arbeitseinheit nach `index` (Pausen werden übersprungen). */
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
  // In der Pause zeigt der Schirm schon die nächste Übung.
  const shown = isRest ? item.nextExercise : item.exercise;
  const after = isRest ? workItemAfter(snapshot.index + 1) : workItemAfter(snapshot.index);
  const left = secondsToDigit(snapshot.remaining);

  // Position als Übungszähler: während der Pause steht dort schon die nächste
  // Übung, die der Schirm zeigt.
  const done = sequence.slice(0, snapshot.index + 1).filter((entry) => !entry.rest).length;
  dom.playerBlock.textContent = isRest ? "Pause" : item.block;
  dom.playerTitle.textContent = activeBundle.title;
  dom.playerIndex.textContent = pad(isRest ? done + 1 : done);
  dom.playerTotal.textContent = pad(bundleExerciseCount(activeBundle));

  dom.timer.textContent = String(left);
  dom.exerciseProgress.style.width = `${Math.min(100, snapshot.exerciseProgress * 100)}%`;
  dom.sessionProgress.style.width = `${Math.min(100, snapshot.sessionProgress * 100)}%`;
  dom.sessionLeft.textContent = formatDuration(Math.round(snapshot.sessionRemaining / 1000));

  dom.mediaKind.textContent = isRest ? "Pause · gleich" : KIND_LABELS[shown.kind] ?? "Übung";
  dom.exerciseName.textContent = shown.name;
  dom.exerciseSub.textContent = shown.sub;
  dom.cueText.textContent = shown.cue;
  dom.mistakeText.textContent = shown.mistake;
  dom.breathText.textContent = shown.breath;
  dom.nextName.textContent = after ? after.exercise.name : "Fertig";

  // Poster der nächsten Übung vorladen, damit der Wechsel nicht hängt.
  if (nextPosterKey !== shown.slug) {
    nextPosterKey = shown.slug;
    const preload = new Image();
    preload.src = posterUrl(shown, prefs.gender);
  }

  dom.genderToggle.disabled = Boolean(shown.only);
  dom.genderToggle.title = shown.only
    ? "Für diese Übung gibt es nur eine Demo-Aufnahme."
    : "Demo-Aufnahme wechseln (Mann / Frau)";

  if (isRest) setRestMedia(shown);
  else setMedia(shown);

  if (!leadInTimer) setStartButton(snapshot.running ? "run" : "idle");

  if (announce) {
    dom.liveRegion.textContent = isRest
      ? `Pause, ${item.seconds} Sekunden. Als Nächstes ${shown.name}. ${shown.cue}.`
      : `${shown.name}, ${item.seconds} Sekunden. ${shown.cue}.`;
  }
}

function buildTimer(bundle) {
  if (timer) timer.destroy();
  activeBundle = bundle;
  sequence = bundleSequence(bundle);
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
  dom.detailsToggle.textContent = open ? "Weniger" : "Details";
}

function openPlayer(bundle, { autostart = false } = {}) {
  const isLoaded = Boolean(timer) && activeBundle?.id === bundle.id;
  if (!isLoaded) {
    buildTimer(bundle);
  } else if (timer.state().finished) {
    // Eine abgeschlossene Session beginnt beim erneuten Öffnen wieder von vorn.
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
  setStartButton("busy", `Bereit ${countdown}`);
  cues.cue("count");
  const step = () => {
    countdown -= 1;
    if (countdown > 0) {
      cues.cue("count");
      setStartButton("busy", `Bereit ${countdown}`);
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

/* -------------------------------------------------------------- Abschluss */
function saveCompletedSession() {
  const entry = addSession({
    bundleId: activeBundle.id,
    title: activeBundle.title,
    category: activeBundle.category,
    seconds: bundleSeconds(activeBundle),
  });
  const stats = computeStats(loadHistory());

  dom.completionTitle.textContent = `${activeBundle.title} geschafft.`;
  dom.completionStats.innerHTML = [
    ["Dauer", formatDuration(Math.round(entry.seconds / 60) * 60)],
    ["Übungen", `${bundleExerciseCount(activeBundle)}`],
    ["Streak", `${stats.streak} ${stats.streak === 1 ? "Tag" : "Tage"}`],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

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
  const stats = computeStats(loadHistory());
  const maxMinutes = Math.max(10, ...stats.days.map((day) => day.minutes));

  dom.streakCount.textContent = String(stats.streak);
  dom.weekSessions.textContent = String(stats.weekSessions);
  dom.weekMinutes.textContent = String(stats.weekMinutes);
  dom.totalSessions.textContent = String(stats.totalSessions);
  dom.totalMinutes.textContent = String(stats.totalMinutes);
  dom.weekLabel.textContent = `${stats.weekMinutes} Minuten`;
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
              <small>${CATEGORY_LABELS[entry.category] ?? entry.category} · ${date.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
              })}</small>
            </div>
            <b>${Math.round((entry.seconds ?? 0) / 60)} Min</b>
          </div>`;
        })
        .join("")
    : `<div class="empty-state">Noch keine Session abgeschlossen. Deine erste wartet in den Sessions.</div>`;
}

/* -------------------------------------------------------------- Navigation */
function setView(view, { scroll = true } = {}) {
  state.view = view;
  dom.libraryView.hidden = view !== "library";
  dom.detailView.hidden = view !== "detail";
  dom.playerView.hidden = view !== "player";
  dom.dashboardView.hidden = view !== "dashboard";
  // training=true: Ablauf und Player passen auf dem iPhone komplett auf den
  // Schirm, die Seite selbst scrollt dort nicht (siehe style.css).
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
  const bundle = BUNDLES.find((item) => item.id === bundleId);
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
  // Der Tab wechselt zwischen Ablauf und laufender Session – er ist damit auch
  // der Weg zurück aus dem Player (dort gibt es keinen Zurück-Knopf mehr).
  if (state.view === "player") {
    if (timer && timer.isRunning()) timer.pause();
    releaseWakeLock();
    openDetail(activeBundle?.id ?? state.detailId);
    return;
  }

  // Läuft noch eine Session, direkt dorthin zurück – sonst zur Auswahl.
  if (state.hasSession && timer && activeBundle && !timer.state().finished) {
    renderPlayer();
    setView("player");
    return;
  }
  const bundle =
    BUNDLES.find((item) => item.id === state.detailId) ??
    BUNDLES.find((item) => item.id === prefs.lastBundleId) ??
    BUNDLES[0];
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
    /* egal */
  }
  wakeLock = null;
}

/* ---------------------------------------------------------- Zurückgehen */
/** Verlässt den Player und hält die Session an. */
function leavePlayer() {
  if (timer && timer.isRunning()) timer.pause();
  releaseWakeLock();
  openDetail(activeBundle?.id ?? state.detailId);
}

/**
 * Wischen nach rechts = zurück – auf dem iPhone die gewohnte Geste, zusätzlich
 * zum Knopf neben dem Titel.
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
      // Deutlich nach rechts, kaum nach oben/unten, keine lange Geste.
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
  const bundle = BUNDLES.find((item) => item.id === state.detailId);
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
  if (!window.confirm("Gesamten Trainingsfortschritt löschen?")) return;
  clearHistory();
  renderDashboard();
});

// Sicherung als JSON-Datei: der Fortschritt liegt sonst nur im Speicher dieses
// Browsers (localStorage) und wäre bei „Websitedaten löschen" verloren.
dom.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pulse-fortschritt-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  dom.liveRegion.textContent = "Sicherung erstellt.";
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
    dom.liveRegion.textContent = `${result.added} Sessions übernommen, ${result.total} insgesamt.`;
  } catch (error) {
    window.alert(error.message);
  } finally {
    dom.importFile.value = "";
  }
});
dom.completionClose.addEventListener("click", closeCompletion);
dom.completionModal.addEventListener("click", (event) => {
  if (event.target === dom.completionModal) closeCompletion();
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
  dom.soundToggle.textContent = prefs.sound ? "Ton" : "Stumm";
  dom.genderToggle.textContent = prefs.gender === "male" ? "Mann" : "Frau";
  dom.genderToggle.setAttribute("aria-pressed", String(prefs.gender === "female"));
}

/* ------------------------------------------------- Installation & Offline */
// Service Worker: lädt die App-Hülle in den Cache, damit die Verknüpfung auf dem
// Home-Bildschirm auch ohne Netz startet (Timer und Log funktionieren offline).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* z. B. ohne HTTPS – die App läuft trotzdem */
    });
  });
}

const installed =
  window.matchMedia?.("(display-mode: standalone)").matches === true || window.navigator.standalone === true;
// Den Hinweis nur zeigen, wo er auch stimmt (iOS-Safari, nicht installiert).
const isIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
if (!installed && isIos) dom.installHint.hidden = false;

/* ------------------------------------------------------------------- Start */
// Globaler Video-Rahmen (kommt aus der Framing-Analyse, gilt für alle Übungen).
document.documentElement.style.setProperty("--panel-aspect", PANEL_ASPECT);

renderCategoryFilters();
renderFocusSelect();
renderLibrary();
syncToggles();
setView("library", { scroll: false });
