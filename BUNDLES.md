# Sessions

16 sessions in `src/data/bundles.js`, each exactly **600 seconds** (10:00). Every
session has **10 exercises**, uses each of them **at most once**, and consists
only of exercises that need neither equipment nor furniture.

The schedule follows a fixed rhythm rather than the data:

```
Primer (exercise 1)   60 s
Exercises 2 … 10      each 40 s
Rest in between       9 × 20 s
                     ─────────
                     600 s = 10:00
```

So the blocks only list exercise IDs; `PRIMER_SECONDS`, `WORK_SECONDS` and
`REST_SECONDS` in `src/data/bundles.js` define the timings, and `npm run validate`
enforces them (10 exercises, 19 steps, 9 rests of 20 s, total 600 s — also when
recomputed from the block times the plan displays).

Category, level, focus and block labels below are the strings the German UI
actually shows; the gloss in brackets is for readers of this document.

| # | Session | Category | Level | Focus | Blocks | Exercises |
|---|---------|----------|-------|-------|--------|-----------|
| 01 | Full Body Basics | Kraft (strength) | Einsteiger (beginner) | Ganzkörper (full body) | Primer · Kraft · Rumpf · Cool-down | 10 |
| 02 | Upper Body | Kraft (strength) | Einsteiger+ (beginner+) | Oberkörper (upper body) | Primer · Kraft · Haltung · Cool-down | 10 |
| 03 | Core Intensive | Kraft (strength) | Einsteiger+ (beginner+) | Core | Haltung · Kraft · Cool-down | 10 |
| 04 | Legs & Glutes | Kraft (strength) | Einsteiger (beginner) | Beine (legs) | Primer · Kraft · Dehnung | 10 |
| 05 | Full Body Burn | HIIT | Fortgeschritten (advanced) | Ganzkörper (full body) | Runde 1 · Runde 2 | 10 |
| 06 | Cardio Starter | HIIT | Einsteiger (beginner) | Ganzkörper (full body) | Primer · Cardio · Kraft · Rumpf · Cool-down | 10 |
| 07 | Mobility Basics | Mobility | Einsteiger (beginner) | Ganzkörper (full body) | Flow · Halten | 10 |
| 08 | Hip Mobility | Mobility | Einsteiger+ (beginner+) | Hüfte (hips) | Flow · Halten | 10 |
| 09 | Shoulders & Thorax | Mobility | Einsteiger (beginner) | Schultern (shoulders) | Flow · Halten | 10 |
| 10 | Ankles & Squat | Mobility | Einsteiger (beginner) | Waden & Füße (calves & feet) | Flow · Kraft · Halten | 10 |
| 11 | Desk Reset | Mobility | Einsteiger (beginner) | Nacken & Hände (neck & hands) | Flow · Halten | 10 |
| 12 | Full Body Stretch | Stretch | Einsteiger (beginner) | Ganzkörper (full body) | Oberkörper · Unterkörper | 10 |
| 13 | Hip & Hamstring | Stretch | Einsteiger (beginner) | Hüfte (hips) | Halten | 10 |
| 14 | Evening Wind Down | Stretch | Einsteiger (beginner) | Ganzkörper (full body) | Halten | 10 |
| 15 | Back & Spine Release | Stretch | Einsteiger (beginner) | Rücken (back) | Halten | 10 |
| 16 | Upper Recovery | Stretch | Einsteiger (beginner) | Oberkörper (upper body) | Halten | 10 |

## Rules behind the composition

- **Rhythm**: every session runs exactly 10 minutes — a 60 s primer, 9×40 s of
  work, 9×20 s of rest. A rest sits between two exercises (across block
  boundaries as well); after the last exercise there is none.
- **No repetition within a session.** The same exercise may appear in several
  sessions — the sessions are standalone programmes.
- **Order follows purpose**: primer (wake up pulse and joints) → main work
  (forceful, large muscles) → core → cool-down, or for mobility/stretch
  flow (dynamic, distal to proximal) → holds (static, large muscles before
  small ones, always both sides).
- **Feasibility without equipment**: enforced by `scripts/validate.mjs`. The
  catalogue is checked against `data/exercise-db-snapshot.json` (field
  `equipment`, which must be `body weight`) **and** against a hand-audited
  exclusion list (`NEEDS_APPARATUS`).

## The equipment audit — and why the dataset field is not enough

The upstream dataset's `equipment` field labels individual exercises
`body weight` although their demo clip clearly shows equipment. The first one we
noticed was **Old School Reverse Extensions**: the clip shows a barbell on a flat
bench, while the dataset claims "body weight". So the posters and mid-clip frames
of **every** catalogue exercise were reviewed (one ffmpeg frame per clip, poster
per exercise) and each suspicious movement was inspected individually. Result:
three exercises were not doable at home despite saying `body weight`, and were
replaced.

| Removed (equipment/furniture) | Replaced by | Rationale |
|---|---|---|
| `old-school-reverse-extensions` – barbell on a bench | `rotational-push-up` (Rotational Push-up, floor) | same role in the strength block, body weight only |
| `45-degree-bycicle-twisting-crunch` – 45° bench with foot pads | `lying-scissor-kick` (Full Body Burn) resp. `pilates-corkscrew` (Core Intensive) | core/oblique work on the floor |
| `stretching-peroneals-stretch` – resistance band around the foot | `stretching-front-toe-touch` (Ankles & Squat) | calf/foot chain, no aid needed |

Counter-checks that were **kept**: `rear-decline-bridge` (the clip shows a floor
bridge — the feet are elevated in the poster, but not in the actual movement) and
`stretching-seated-calf-stretch` / `stretching-reverse-dip` (performed on the
floor). Both remain in the catalogue.

## Deliberately not included

These exercises are `body weight` according to the dataset but rely on equipment
or furniture in execution — they were replaced instead of being sold as
"equipment-free". They therefore live in the exclusion list in
`scripts/validate.mjs` and cannot come back by accident:

- Parallel bars/pull-up bar: `chest-dips`, `triceps-dips`, `scapula-dips`, all
  `pull-up-*`/`chin-up-*`, `hanging-leg-hip-raise`, `hanging-straight-leg-raise`,
  `vertical-leg-raise-on-parallel-bars`, `commando-pull-up`
- Bench/chair/step: `bench-dips`, `incline-push-ups`, `deep-push-ups`,
  `crunch-on-bench`, `incline-leg-hip-raise`, `jump-step-up`, `bench-pull-ups`,
  `donkey-calf-raise`, `stretching-stairs-calf-stretch`,
  `stretching-standing-bench-calf-stretch`,
  `stretching-hip-flexor-stretch-rear-foot-elevated`
- Barbell/45° bench/band: `old-school-reverse-extensions`,
  `45-degree-bycicle-twisting-crunch`, `stretching-peroneals-stretch`
- Aids/rings/bands: `inverted-row-between-chairs`,
  `inverted-row-with-straps`, `ring-high-row`,
  `stretching-standing-wheel-rollout`

Substitute exercises with their own video: instead of bench dips →
`rotational-push-up`, instead of incline push-ups → `push-ups`/`close-grip-push-ups`,
instead of step calf raises → `stretching-seated-calf-stretch`.

## Exercise names

The display names are shortened and normalised; the dataset slug remains the key
for the media. Examples: `drv-squat`/`squat` → "Squat",
`rear-decline-bridge` → "Glute Bridge" (the video shows a floor bridge),
`old-school-reverse-extensions` → "Reverse Triceps Extension" (until it was
replaced), `stretching-ceiling-look-stretch` → "Hüftbeuger & Bauch" (the dataset
name "Standing Hip Flexor and Abdominal Stretch" describes the movement more
precisely). For exercises the dataset only ships in one version, the female
recording is used (`only: "female"`) and the toggle in the player is disabled
there.
