/**
 * English overlay for the session data in `src/data/bundles.js`.
 *
 * The German file stays the source of truth: it owns the structure (ids,
 * categories, focuses, intensities, blocks and the order of the exercises) and
 * the fixed rhythm. Nothing here changes times or composition – this module only
 * carries the display strings that the language switch swaps in at render time.
 *
 * `title` is deliberately missing: the session titles are English already.
 *
 * Keys must cover every entry of `BUNDLES`, every distinct block label used
 * anywhere in a session, every key of `CATEGORY_LABELS` (plus "all") and every
 * distinct `level` value used in `BUNDLES` or `EXERCISES` (checked in
 * scripts/validate.mjs).
 */

export const EN_BUNDLES = {
  "full-body-basics": {
    level: "Beginner",
    summary: "Warm-up, three basic strength moves, one core block and a calm cool-down.",
    tags: ["No jumps", "Joint-friendly"],
  },
  "upper-body": {
    level: "Beginner+",
    summary: "Three push-up variations as a ladder, plus floor triceps and a core block against sagging.",
    tags: ["No equipment", "Push focus"],
  },
  "core-intensive": {
    level: "Beginner+",
    summary: "Ten different core exercises: hold, curl up, twist – nothing twice.",
    tags: ["Core", "No jumps"],
  },
  "legs-glutes": {
    level: "Beginner",
    summary: "Squats and glute bridges as the strength part, then stretches for the whole leg chain.",
    tags: ["Lower body", "Mobility at the end"],
  },
  "full-body-burn": {
    level: "Advanced",
    summary: "Ten intervals in two rounds – muscular endurance at a high heart rate.",
    tags: ["HIIT", "Jump-heavy"],
  },
  "cardio-starter": {
    level: "Beginner",
    summary: "An easy start with joint mobilisation, then three cardio intervals and strength to finish.",
    tags: ["No jumps", "Easy"],
  },
  "mobility-basics": {
    level: "Beginner",
    summary: "Four dynamic exercises wake the joints up, six held stretches round it off from head to toe.",
    tags: ["Warm-up", "Flow"],
  },
  "hip-mobility": {
    level: "Beginner+",
    summary: "A dynamic flow for hip circles and side lunges, then seven stretches around the hip.",
    tags: ["Flow", "Hips"],
  },
  "shoulders-thorax": {
    level: "Beginner",
    summary: "Wrists, rib cage and thoracic spine: mobilise, then stretch lats, shoulder and triceps.",
    tags: ["Posture", "Desk balance"],
  },
  "ankles-squat": {
    level: "Beginner",
    summary: "Mobilise ankles and calves, then a strength block with squats and stretches for leg and calf.",
    tags: ["Squat depth", "Foot work"],
  },
  "desk-reset": {
    level: "Beginner",
    summary: "For neck, wrists and hip flexors after long hours of sitting – all standing or on the floor.",
    tags: ["Desk", "Gentle"],
  },
  "full-body-stretch": {
    level: "Beginner",
    summary: "From neck and chest through lats and back to legs and adductors – one stretch per minute.",
    tags: ["Recovery", "No jumps"],
  },
  "hip-hamstring": {
    level: "Beginner",
    summary: "Ten stretches for hip flexors, hamstrings and adductors – one after another, no repeats.",
    tags: ["Recovery", "Lower body"],
  },
  "evening-wind-down": {
    level: "Beginner",
    summary: "A calm sequence without load: first back and neck, then hips, legs and core.",
    tags: ["Recovery", "Evening"],
  },
  "back-spine-release": {
    level: "Beginner",
    summary: "Rotation, side bend and forward fold in turn – good after a long sitting or training block.",
    tags: ["Back", "Recovery"],
  },
  "upper-recovery": {
    level: "Beginner",
    summary: "Chest, shoulder, triceps, lats and neck – the counter-move to push-ups and planks.",
    tags: ["Recovery", "After training"],
  },
};

/** Block headings shown in the plan and as the badge in the player. */
export const EN_BLOCK_LABELS = {
  Primer: "Primer",
  Flow: "Flow",
  Cardio: "Cardio",
  Kraft: "Strength",
  Rumpf: "Core",
  Haltung: "Posture",
  Halten: "Holds",
  Dehnung: "Stretching",
  "Cool-down": "Cool-down",
  Oberkörper: "Upper body",
  Unterkörper: "Lower body",
  "Runde 1": "Round 1",
  "Runde 2": "Round 2",
};

/** Filter row and history rows; "all" is the extra entry of the filter row. */
export const EN_CATEGORY_LABELS = {
  all: "All",
  strength: "Strength",
  conditioning: "HIIT",
  mobility: "Mobility",
  flexibility: "Stretch",
};

/** Shown in the detail eyebrow next to the category. */
export const EN_LEVELS = {
  Einsteiger: "Beginner",
  "Einsteiger+": "Beginner+",
  Fortgeschritten: "Advanced",
};
