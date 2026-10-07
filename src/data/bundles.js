import { EXERCISES } from "./exercises.js";

/**
 * Sessions. Jede Session:
 *  - hat genau 10 Übungen und dauert exakt 10:00 (600 Sekunden: 60 s Primer,
 *    9×40 s Arbeit und 9×20 s Pause dazwischen, geprüft in scripts/validate.mjs),
 *  - enthält jede Übung höchstens einmal,
 *  - ist in Blöcke gegliedert (Primer → Arbeit → Cool-down bzw. Flow → Halten),
 *  - nutzt ausschließlich gerätefreie Übungen aus dem Katalog.
 *
 * Zeiten stehen bewusst nicht in den Daten: sie folgen dem festen Rhythmus.
 */
export const BUNDLES = [
  {
    id: "full-body-basics",
    title: "Full Body Basics",
    category: "strength",
    focus: "ganzkoerper",
    level: "Einsteiger",
    intensity: 1,
    summary: "Warmlaufen, drei Grundübungen, ein Block Rumpf und ein ruhiges Cool-down.",
    tags: ["Ohne Sprünge", "Gelenkschonend"],
    blocks: [
      {
        label: "Primer",
        items: [
          { id: "running" },
          { id: "jumping-jack" },
        ],
      },
      {
        label: "Kraft",
        items: [
          { id: "squat" },
          { id: "push-ups" },
          { id: "rear-decline-bridge" },
        ],
      },
      {
        label: "Rumpf",
        items: [
          { id: "front-plank" },
          { id: "twisting-crunch" },
          { id: "sit-ups" },
        ],
      },
      {
        label: "Cool-down",
        items: [
          { id: "stretching-hamstring-stretch" },
          { id: "stretching-butterfly-yoga-pose" },
        ],
      },
    ],
  },
  {
    id: "upper-body",
    title: "Upper Body",
    category: "strength",
    focus: "oberkoerper",
    level: "Einsteiger+",
    intensity: 2,
    summary: "Drei Liegestütz-Varianten als Leiter, dazu Trizeps am Boden und Rumpf gegen das Durchhängen.",
    tags: ["Ohne Geräte", "Push-Fokus"],
    blocks: [
      { label: "Primer", items: [{ id: "jumping-jack" }] },
      {
        label: "Kraft",
        items: [
          { id: "push-ups" },
          { id: "close-grip-push-ups" },
          { id: "rotational-push-up" },
        ],
      },
      {
        label: "Haltung",
        items: [
          { id: "front-plank" },
          { id: "side-bridge-side-plank" },
        ],
      },
      {
        label: "Cool-down",
        items: [
          { id: "stretching-kneeling-triceps-extension" },
          { id: "stretching-above-head-chest-stretch" },
          { id: "stretching-rear-deltoid-stretch" },
          { id: "stretching-kneeling-lat-stretch" },
        ],
      },
    ],
  },
  {
    id: "core-intensive",
    title: "Core Intensive",
    category: "strength",
    focus: "core",
    level: "Einsteiger+",
    intensity: 2,
    summary: "Zehn verschiedene Rumpfübungen: halten, einrollen, drehen – keine Wiederholung doppelt.",
    tags: ["Rumpf", "Ohne Sprünge"],
    blocks: [
      {
        label: "Haltung",
        items: [
          { id: "front-plank" },
          { id: "side-bridge-side-plank" },
        ],
      },
      {
        label: "Kraft",
        items: [
          { id: "sit-ups" },
          { id: "twisting-crunch" },
          { id: "reverse-crunch" },
          { id: "lying-floor-leg-raise" },
          { id: "lying-straight-leg-raise" },
          { id: "v-up" },
          { id: "pilates-corkscrew" },
        ],
      },
      { label: "Cool-down", items: [{ id: "stretching-spine-stretch" }] },
    ],
  },
  {
    id: "legs-glutes",
    title: "Legs & Glutes",
    category: "strength",
    focus: "beine",
    level: "Einsteiger",
    intensity: 2,
    summary: "Squats und Glute Bridges als Kraftteil, danach Dehnungen für die ganze Beinkette.",
    tags: ["Unterkörper", "Mobilität am Ende"],
    blocks: [
      {
        label: "Primer",
        items: [
          { id: "running" },
          { id: "stretching-plyo-side-lunge-stretch" },
        ],
      },
      {
        label: "Kraft",
        items: [
          { id: "squat" },
          { id: "rear-decline-bridge" },
        ],
      },
      {
        label: "Dehnung",
        items: [
          { id: "stretching-all-fours-squad-stretch" },
          { id: "stretching-quadriceps-lying-stretch" },
          { id: "stretching-hamstring-stretch" },
          { id: "stretching-seated-calf-stretch" },
          { id: "stretching-front-toe-touch" },
          { id: "stretching-adductor-stretch" },
        ],
      },
    ],
  },
  {
    id: "full-body-burn",
    title: "Full Body Burn",
    category: "conditioning",
    focus: "ganzkoerper",
    level: "Fortgeschritten",
    intensity: 3,
    summary: "Zehn Intervalle in zwei Runden – Kraftausdauer mit hoher Herzfrequenz.",
    tags: ["HIIT", "Springe-Intensiv"],
    blocks: [
      {
        label: "Runde 1",
        items: [
          { id: "jumping-jack" },
          { id: "burpee" },
          { id: "squat" },
          { id: "push-ups" },
          { id: "sit-ups" },
        ],
      },
      {
        label: "Runde 2",
        items: [
          { id: "lying-scissor-kick" },
          { id: "rear-decline-bridge" },
          { id: "v-up" },
          { id: "running" },
          { id: "front-plank" },
        ],
      },
    ],
  },
  {
    id: "cardio-starter",
    title: "Cardio Starter",
    category: "conditioning",
    focus: "ganzkoerper",
    level: "Einsteiger",
    intensity: 2,
    summary: "Lockerer Einstieg mit Gelenkmobilisation, dann drei Cardio-Intervalle und Kraft zum Abschluss.",
    tags: ["Ohne Sprünge", "Locker"],
    blocks: [
      {
        label: "Primer",
        items: [
          { id: "stretching-hip-circles-stretch" },
          { id: "stretching-feet-and-ankles-rotation-stretch" },
        ],
      },
      {
        label: "Cardio",
        items: [
          { id: "running" },
          { id: "jumping-jack" },
          { id: "squat" },
          { id: "burpee" },
        ],
      },
      {
        label: "Kraft",
        items: [
          { id: "push-ups" },
          { id: "rear-decline-bridge" },
        ],
      },
      { label: "Rumpf", items: [{ id: "side-bridge-side-plank" }] },
      { label: "Cool-down", items: [{ id: "stretching-hip-flexor-and-quad-stretch" }] },
    ],
  },
  {
    id: "mobility-basics",
    title: "Mobility Basics",
    category: "mobility",
    focus: "ganzkoerper",
    level: "Einsteiger",
    intensity: 1,
    summary: "Vier dynamische Übungen wecken die Gelenke, sechs Halte-Dehnungen runden von Kopf bis Fuß ab.",
    tags: ["Aufwärmen", "Flow"],
    blocks: [
      {
        label: "Flow",
        items: [
          { id: "stretching-feet-and-ankles-rotation-stretch" },
          { id: "stretching-hip-circles-stretch" },
          { id: "stretching-knee-raise" },
          { id: "stretching-flexion-leg-sit-up" },
        ],
      },
      {
        label: "Halten",
        items: [
          { id: "stretching-all-fours-squad-stretch" },
          { id: "stretching-adductor-stretch" },
          { id: "stretching-dynamic-chest-stretch" },
          { id: "stretching-kneeling-back-rotation-stretch" },
          { id: "stretching-spine-stretch" },
          { id: "stretching-seated-lower-back-stretch" },
        ],
      },
    ],
  },
  {
    id: "hip-mobility",
    title: "Hip Mobility",
    category: "mobility",
    focus: "huefte",
    level: "Einsteiger+",
    intensity: 2,
    summary: "Dynamischer Flow für Hüftkreise und Ausfallschritte, danach sieben Dehnungen rund um die Hüfte.",
    tags: ["Flow", "Hüfte"],
    blocks: [
      {
        label: "Flow",
        items: [
          { id: "stretching-hip-circles-stretch" },
          { id: "stretching-all-fours-squad-stretch" },
          { id: "stretching-plyo-side-lunge-stretch" },
        ],
      },
      {
        label: "Halten",
        items: [
          { id: "stretching-adductor-stretch" },
          { id: "stretching-butterfly-yoga-pose" },
          { id: "stretching-crossover-kneeling-hip-flexor-stretch" },
          { id: "stretching-runners-stretch" },
          { id: "stretching-hip-extension-stretch" },
          { id: "stretching-seated-wide-angle-pose-sequence" },
          { id: "stretching-iron-cross-stretch" },
        ],
      },
    ],
  },
  {
    id: "shoulders-thorax",
    title: "Shoulders & Thorax",
    category: "mobility",
    focus: "schultern",
    level: "Einsteiger",
    intensity: 1,
    summary: "Handgelenke, Brustkorb und Brustwirbelsäule: mobilisieren, dann Lat, Schulter und Trizeps dehnen.",
    tags: ["Haltung", "Büro-Ausgleich"],
    blocks: [
      {
        label: "Flow",
        items: [
          { id: "stretching-wrist-circles" },
          { id: "stretching-dynamic-chest-stretch" },
          { id: "stretching-standing-reach-up-back-rotation-stretch" },
          { id: "stretching-kneeling-back-rotation-stretch" },
        ],
      },
      {
        label: "Halten",
        items: [
          { id: "stretching-side-wrist-pull-stretch" },
          { id: "stretching-above-head-chest-stretch" },
          { id: "stretching-kneeling-lat-stretch" },
          { id: "stretching-rear-deltoid-stretch" },
          { id: "stretching-seated-shoulder-flexor-depresor-retractor" },
          { id: "stretching-kneeling-triceps-extension" },
        ],
      },
    ],
  },
  {
    id: "ankles-squat",
    title: "Ankles & Squat",
    category: "mobility",
    focus: "waeden-fuesse",
    level: "Einsteiger",
    intensity: 1,
    summary: "Sprunggelenke und Waden mobilisieren, dann ein Kraftblock Squat und Dehnungen für Bein und Wade.",
    tags: ["Squat-Tiefe", "Fußarbeit"],
    blocks: [
      {
        label: "Flow",
        items: [
          { id: "stretching-feet-and-ankles-rotation-stretch" },
          { id: "stretching-feet-and-ankles-stretch" },
          { id: "stretching-front-toe-touch" },
          { id: "stretching-knee-raise" },
        ],
      },
      { label: "Kraft", items: [{ id: "squat" }] },
      {
        label: "Halten",
        items: [
          { id: "stretching-seated-calf-stretch" },
          { id: "stretching-all-fours-squad-stretch" },
          { id: "stretching-quadriceps-lying-stretch" },
          { id: "stretching-hip-circles-stretch" },
          { id: "stretching-spine-stretch" },
        ],
      },
    ],
  },
  {
    id: "desk-reset",
    title: "Desk Reset",
    category: "mobility",
    focus: "nacken-haende",
    level: "Einsteiger",
    intensity: 1,
    summary: "Für Nacken, Handgelenke und Hüftbeuger nach langen Sitzphasen – alles im Stehen oder am Boden.",
    tags: ["Büro", "Sanft"],
    blocks: [
      {
        label: "Flow",
        items: [
          { id: "stretching-chin-to-chest-stretch" },
          { id: "stretching-neck-side-stretch" },
          { id: "stretching-wrist-circles" },
          { id: "stretching-side-wrist-pull-stretch" },
        ],
      },
      {
        label: "Halten",
        items: [
          { id: "stretching-ceiling-look-stretch" },
          { id: "stretching-crossover-kneeling-hip-flexor-stretch" },
          { id: "stretching-sitting-bent-over-back-stretch" },
          { id: "stretching-seated-lower-back-stretch" },
          { id: "stretching-standing-back-rotation-stretch" },
          { id: "stretching-hip-circles-stretch" },
        ],
      },
    ],
  },
  {
    id: "full-body-stretch",
    title: "Full Body Stretch",
    category: "flexibility",
    focus: "ganzkoerper",
    level: "Einsteiger",
    intensity: 1,
    summary: "Von Nacken und Brust über Lat und Rücken bis Beine und Adduktoren – eine Dehnung pro Minute.",
    tags: ["Recovery", "Ohne Sprünge"],
    blocks: [
      {
        label: "Oberkörper",
        items: [
          { id: "stretching-neck-side-stretch" },
          { id: "stretching-chin-to-chest-stretch" },
          { id: "stretching-above-head-chest-stretch" },
          { id: "stretching-kneeling-lat-stretch" },
          { id: "stretching-sitting-bent-over-back-stretch" },
        ],
      },
      {
        label: "Unterkörper",
        items: [
          { id: "stretching-adductor-stretch" },
          { id: "stretching-hamstring-stretch" },
          { id: "stretching-quadriceps-lying-stretch" },
          { id: "stretching-seated-wide-angle-pose-sequence" },
          { id: "stretching-butterfly-yoga-pose" },
        ],
      },
    ],
  },
  {
    id: "hip-hamstring",
    title: "Hip & Hamstring",
    category: "flexibility",
    focus: "huefte",
    level: "Einsteiger",
    intensity: 1,
    summary: "Zehn Dehnungen für Hüftbeuger, Hamstrings und Adduktoren – hintereinander, ohne Wiederholung.",
    tags: ["Recovery", "Unterkörper"],
    blocks: [
      {
        label: "Halten",
        items: [
          { id: "stretching-hamstring-stretch" },
          { id: "stretching-single-leg-stretch-bent-knee" },
          { id: "stretching-single-straight-leg-stretch" },
          { id: "stretching-front-toe-touch" },
          { id: "stretching-runners-stretch" },
          { id: "stretching-hip-flexor-and-quad-stretch" },
          { id: "stretching-quadriceps-stretch" },
          { id: "stretching-boat-stretch" },
          { id: "stretching-hip-extension-stretch" },
          { id: "stretching-iron-cross-stretch" },
        ],
      },
    ],
  },
  {
    id: "evening-wind-down",
    title: "Evening Wind Down",
    category: "flexibility",
    focus: "ganzkoerper",
    level: "Einsteiger",
    intensity: 1,
    summary: "Ruhige Folge ohne Belastung: erst Rücken und Nacken, dann Hüfte, Beine und Rumpf.",
    tags: ["Recovery", "Abends"],
    blocks: [
      {
        label: "Halten",
        items: [
          { id: "stretching-chin-to-chest-stretch" },
          { id: "stretching-seated-lower-back-stretch" },
          { id: "stretching-sitting-bent-over-back-stretch" },
          { id: "stretching-bridge-pose-setu-bandhasana" },
          { id: "stretching-butterfly-yoga-pose" },
          { id: "stretching-adductor-stretch" },
          { id: "stretching-hamstring-stretch" },
          { id: "stretching-quadriceps-lying-stretch" },
          { id: "stretching-spine-stretch" },
          { id: "stretching-all-fours-squad-stretch" },
        ],
      },
    ],
  },
  {
    id: "back-spine-release",
    title: "Back & Spine Release",
    category: "flexibility",
    focus: "ruecken",
    level: "Einsteiger",
    intensity: 1,
    summary: "Rotation, Seitneige und Vorbeuge im Wechsel – gut nach einem langen Sitz- oder Trainingsblock.",
    tags: ["Rücken", "Recovery"],
    blocks: [
      {
        label: "Halten",
        items: [
          { id: "stretching-sitting-bent-over-back-stretch" },
          { id: "stretching-seated-lower-back-stretch" },
          { id: "stretching-spine-stretch" },
          { id: "stretching-kneeling-back-rotation-stretch" },
          { id: "stretching-standing-back-rotation-stretch" },
          { id: "stretching-kneeling-lat-stretch" },
          { id: "stretching-seated-twist-straight-arm" },
          { id: "stretching-slopes-towards-stretch" },
          { id: "stretching-standing-side-bend-bent-arm" },
          { id: "stretching-bridge-pose-setu-bandhasana" },
        ],
      },
    ],
  },
  {
    id: "upper-recovery",
    title: "Upper Recovery",
    category: "flexibility",
    focus: "oberkoerper",
    level: "Einsteiger",
    intensity: 1,
    summary: "Brust, Schulter, Trizeps, Lat und Nacken – die Gegenbewegung zu Liegestützen und Planks.",
    tags: ["Recovery", "Nach dem Training"],
    blocks: [
      {
        label: "Halten",
        items: [
          { id: "stretching-above-head-chest-stretch" },
          { id: "stretching-dynamic-chest-stretch" },
          { id: "stretching-rear-deltoid-stretch" },
          { id: "stretching-kneeling-triceps-extension" },
          { id: "stretching-reverse-dip" },
          { id: "stretching-kneeling-lat-stretch" },
          { id: "stretching-seated-shoulder-flexor-depresor-retractor" },
          { id: "stretching-neck-side-stretch" },
          { id: "stretching-chin-to-chest-stretch" },
          { id: "stretching-wrist-circles" },
        ],
      },
    ],
  },
];

export const CATEGORIES = [
  { id: "all", label: "Alle" },
  { id: "strength", label: "Kraft" },
  { id: "conditioning", label: "HIIT" },
  { id: "mobility", label: "Mobility" },
  { id: "flexibility", label: "Stretch" },
];

export const CATEGORY_LABELS = {
  strength: "Kraft",
  conditioning: "HIIT",
  mobility: "Mobility",
  flexibility: "Stretch",
};

/*
 * Rhythmus jeder Session: 10 Übungen. Die erste (Primer) läuft 60 s, jede
 * weitere 40 s, dazwischen liegen jeweils 20 s Pause:
 *
 *   60 + 9×40 + 9×20 = 600 s = 10:00
 *
 * Die Blöcke der Sessions enthalten deshalb nur noch Übungs-IDs – die Zeiten
 * ergeben sich aus dieser Regel (geprüft in scripts/validate.mjs).
 */
export const SESSION_EXERCISES = 10;
export const PRIMER_SECONDS = 60;
export const WORK_SECONDS = 40;
export const REST_SECONDS = 20;

/** Arbeitseinheiten einer Session in Reihenfolge: [{ id, exercise, block }] */
export function bundleWork(bundle) {
  return bundle.blocks.flatMap((block) =>
    block.items.map((item) => {
      const exercise = EXERCISES[item.id];
      if (!exercise) throw new Error(`Unbekannte Übung "${item.id}" in Session "${bundle.id}"`);
      return { id: item.id, exercise, block: block.label };
    }),
  );
}

/**
 * Abfolge des Players: Arbeit und Pausen abwechselnd. Pausen tragen `rest: true`
 * und zeigen die nächste Übung an (`nextExercise`); nach der letzten Übung folgt
 * keine Pause mehr.
 */
export function bundleSequence(bundle) {
  const work = bundleWork(bundle);
  const sequence = [];

  work.forEach((entry, index) => {
    sequence.push({
      ...entry,
      rest: false,
      seconds: index === 0 ? PRIMER_SECONDS : WORK_SECONDS,
      nextExercise: work[index + 1]?.exercise ?? null,
    });
    if (index < work.length - 1) {
      sequence.push({
        id: null,
        exercise: null,
        rest: true,
        block: "Pause",
        seconds: REST_SECONDS,
        nextExercise: work[index + 1].exercise,
      });
    }
  });

  return sequence;
}

const workSecondsAt = (index) => (index === 0 ? PRIMER_SECONDS : WORK_SECONDS);

/** Gesamtdauer einer Session in Sekunden – Arbeit plus eingestreute Pausen. */
export function bundleSeconds(bundle) {
  const count = bundleExerciseCount(bundle);
  if (count === 0) return 0;
  const work = PRIMER_SECONDS + (count - 1) * WORK_SECONDS;
  const pauses = (count - 1) * REST_SECONDS;
  return work + pauses;
}

/** Dauer eines Blocks inklusive der Pausen zwischen seinen Übungen. */
export function blockSeconds(bundle, blockIndex) {
  const total = bundleExerciseCount(bundle);
  const before = bundle.blocks
    .slice(0, blockIndex)
    .reduce((count, block) => count + block.items.length, 0);
  const block = bundle.blocks[blockIndex];

  return block.items.reduce((sum, _item, offset) => {
    const index = before + offset;
    const pause = index < total - 1 ? REST_SECONDS : 0;
    return sum + workSecondsAt(index) + pause;
  }, 0);
}

export function bundleExerciseCount(bundle) {
  return bundle.blocks.reduce((sum, block) => sum + block.items.length, 0);
}

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
