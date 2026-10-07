/**
 * Persistenz: Trainingshistorie und Einstellungen in localStorage.
 * Alle Zugriffe sind gekapselt, damit ein leerer oder privater Speicher die App
 * nicht bricht.
 */
const HISTORY_KEY = "pulse.history.v1";
const PREFS_KEY = "pulse.prefs.v1";
const HISTORY_LIMIT = 200;
const BACKUP_VERSION = 1;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt – die Session läuft trotzdem weiter */
  }
}

export function loadHistory() {
  const history = read(HISTORY_KEY, []);
  return Array.isArray(history) ? history.filter((entry) => entry && entry.bundleId) : [];
}

export function addSession({ bundleId, title, category, seconds }) {
  const history = loadHistory();
  const entry = {
    bundleId,
    title,
    category,
    seconds,
    finishedAt: new Date().toISOString(),
  };
  history.unshift(entry);
  write(HISTORY_KEY, history.slice(0, HISTORY_LIMIT));
  return entry;
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

/**
 * Sicherung erzeugen. Der Fortschritt liegt nur im localStorage dieses Browsers –
 * verschwindet der (Websitedaten löschen, Gerätewechsel), wäre er sonst weg.
 */
export function createBackup() {
  return {
    app: "pulse",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history: loadHistory(),
    prefs: loadPrefs(),
  };
}

/**
 * Sicherung einlesen und mit dem vorhandenen Verlauf zusammenführen (gleiche
 * Session wird nicht doppelt gezählt). Wirft einen Fehler mit lesbarer Meldung,
 * wenn die Datei nicht passt.
 */
export function restoreBackup(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      throw new Error("Die Datei ist keine gültige Pulse-Sicherung.");
    }
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.history)) {
    throw new Error("In der Datei fehlt der Trainingsverlauf.");
  }

  const incoming = data.history.filter((entry) => entry && entry.bundleId && entry.finishedAt);
  if (!incoming.length) throw new Error("Die Sicherung enthält keine Sessions.");

  const existing = loadHistory();
  const merged = new Map();
  for (const entry of [...existing, ...incoming]) {
    merged.set(`${entry.bundleId}@${entry.finishedAt}`, entry);
  }
  const history = [...merged.values()]
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
    .slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, history);

  if (data.prefs && typeof data.prefs === "object") {
    const prefs = loadPrefs();
    savePrefs({
      gender: data.prefs.gender === "female" ? "female" : prefs.gender,
      sound: typeof data.prefs.sound === "boolean" ? data.prefs.sound : prefs.sound,
    });
  }

  return { added: history.length - existing.length, total: history.length };
}

export function loadPrefs() {
  const prefs = read(PREFS_KEY, {});
  return {
    gender: prefs.gender === "female" ? "female" : "male",
    sound: prefs.sound !== false,
    lastBundleId: typeof prefs.lastBundleId === "string" ? prefs.lastBundleId : null,
  };
}

export function savePrefs(patch) {
  const next = { ...loadPrefs(), ...patch };
  write(PREFS_KEY, next);
  return next;
}

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function computeStats(history) {
  const today = new Date();
  const todayKey = dayKey(today);

  const byDay = new Map();
  for (const entry of history) {
    const key = dayKey(entry.finishedAt);
    const current = byDay.get(key) ?? { sessions: 0, minutes: 0 };
    current.sessions += 1;
    current.minutes += Math.round((entry.seconds ?? 0) / 60);
    byDay.set(key, current);
  }

  // Tage für das 7-Tage-Diagramm (heute als letzter Eintrag)
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dayKey(date);
    const data = byDay.get(key) ?? { sessions: 0, minutes: 0 };
    days.push({
      key,
      label: date.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
      isToday: key === todayKey,
      ...data,
    });
  }

  // Streak: heute zählt, solange heute noch nicht trainiert wurde auch gestern
  let streak = 0;
  const cursor = new Date(today);
  if (!byDay.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (byDay.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const week = days.reduce(
    (acc, day) => ({ sessions: acc.sessions + day.sessions, minutes: acc.minutes + day.minutes }),
    { sessions: 0, minutes: 0 },
  );

  return {
    streak,
    days,
    weekSessions: week.sessions,
    weekMinutes: week.minutes,
    totalSessions: history.length,
    totalMinutes: history.reduce((sum, entry) => sum + Math.round((entry.seconds ?? 0) / 60), 0),
    recent: history.slice(0, 6),
  };
}
