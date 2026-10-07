/**
 * Bildausschnitt je Übung – automatisch erzeugt von `scripts/framing.mjs`.
 *
 * Grundlage: Messung des sichtbaren Inhalts über alle Frames der Clips (6 fps, ffmpeg), je Frame gegengeprüft.
 *
 *   aspect  = Höhe/Breite des Video-Rahmens (1.567:1); höher als 16:9, damit die
 *             Person größer erscheint, aber ohne je Inhalt seitlich zu verlieren.
 *   zoom    = Skalierung im Rahmen (nur leerer Hintergrund wird beschnitten).
 *   x/y     = Drehpunkt in Prozent (transform-origin).
 *   objectX = horizontaler Szenenausschnitt in Prozent (object-position).
 *
 * Rand 2.0 %, Sicherheitsabschlag 10 %, Obergrenze 1.6x.
 * Neu berechnen: `npm run framing` (einzelne Übungen: `--only=<id,...>`).
 *
 * Zuletzt neu gerechnet: rotational-push-up, lying-scissor-kick, pilates-corkscrew.
 */
export const FRAMING = {
  "squat": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 1
  },
  "push-ups": {
    "zoom": 1.274,
    "x": 0.5,
    "y": 0.8621,
    "objectX": 0.3594
  },
  "close-grip-push-ups": {
    "zoom": 1.326,
    "x": 0.5,
    "y": 0.937,
    "objectX": 0.2891
  },
  "rear-decline-bridge": {
    "zoom": 1.129,
    "x": 0.5,
    "y": 1,
    "objectX": 0.5527
  },
  "jumping-jack": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.2189
  },
  "running": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5176
  },
  "burpee": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.7284
  },
  "front-plank": {
    "zoom": 1.066,
    "x": 0.5,
    "y": 1,
    "objectX": 0.3067
  },
  "side-bridge-side-plank": {
    "zoom": 1.015,
    "x": 0.5,
    "y": 1,
    "objectX": 0.3594
  },
  "twisting-crunch": {
    "zoom": 1.103,
    "x": 0.5,
    "y": 1,
    "objectX": 0.8339
  },
  "sit-ups": {
    "zoom": 1.131,
    "x": 0.5,
    "y": 0.8511,
    "objectX": 0.3946
  },
  "reverse-crunch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5176
  },
  "lying-floor-leg-raise": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.6933
  },
  "lying-straight-leg-raise": {
    "zoom": 1.044,
    "x": 0.5,
    "y": 1,
    "objectX": 0.3946
  },
  "v-up": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.6054
  },
  "stretching-plyo-side-lunge-stretch": {
    "zoom": 1.035,
    "x": 0.5,
    "y": 1,
    "objectX": 0.4121
  },
  "stretching-above-head-chest-stretch": {
    "zoom": 1.001,
    "x": 0.5,
    "y": 1,
    "objectX": 0.3419
  },
  "stretching-adductor-stretch": {
    "zoom": 1.001,
    "x": 1,
    "y": 0,
    "objectX": 1
  },
  "stretching-all-fours-squad-stretch": {
    "zoom": 1.21,
    "x": 0.5,
    "y": 0.8412,
    "objectX": 0.3243
  },
  "stretching-boat-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.8866
  },
  "stretching-bridge-pose-setu-bandhasana": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.7987
  },
  "stretching-butterfly-yoga-pose": {
    "zoom": 1.121,
    "x": 0.5,
    "y": 0.9809,
    "objectX": 0.2716
  },
  "stretching-ceiling-look-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.1837
  },
  "stretching-chin-to-chest-stretch": {
    "zoom": 1.142,
    "x": 0.5,
    "y": 0.7384,
    "objectX": 0.7636
  },
  "stretching-crossover-kneeling-hip-flexor-stretch": {
    "zoom": 1.198,
    "x": 0.5,
    "y": 0.8358,
    "objectX": 0.2189
  },
  "stretching-dynamic-chest-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.4473
  },
  "stretching-feet-and-ankles-rotation-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.4121
  },
  "stretching-feet-and-ankles-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.2716
  },
  "stretching-flexion-leg-sit-up": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.4824
  },
  "stretching-front-toe-touch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.8866
  },
  "stretching-hamstring-stretch": {
    "zoom": 1.053,
    "x": 0.5,
    "y": 0.2787,
    "objectX": 0.4121
  },
  "stretching-hip-circles-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.377
  },
  "stretching-hip-extension-stretch": {
    "zoom": 1.097,
    "x": 0.5,
    "y": 1,
    "objectX": 0.746
  },
  "stretching-hip-flexor-and-quad-stretch": {
    "zoom": 1.066,
    "x": 0.5,
    "y": 1,
    "objectX": 0.7284
  },
  "stretching-iron-cross-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5703
  },
  "stretching-knee-raise": {
    "zoom": 1.175,
    "x": 0.5,
    "y": 0.8729,
    "objectX": 0.6581
  },
  "stretching-kneeling-back-rotation-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.3946
  },
  "stretching-kneeling-lat-stretch": {
    "zoom": 1.216,
    "x": 0.5,
    "y": 1,
    "objectX": 0.623
  },
  "stretching-kneeling-triceps-extension": {
    "zoom": 1.09,
    "x": 0.5,
    "y": 1,
    "objectX": 0.3067
  },
  "stretching-neck-side-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.4649
  },
  "stretching-quadriceps-lying-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.992
  },
  "stretching-quadriceps-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5176
  },
  "stretching-rear-deltoid-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.1134
  },
  "stretching-reverse-dip": {
    "zoom": 1.044,
    "x": 0.5,
    "y": 0.8529,
    "objectX": 0.4649
  },
  "stretching-runners-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 1
  },
  "stretching-seated-calf-stretch": {
    "zoom": 1.081,
    "x": 0.5,
    "y": 0.6978,
    "objectX": 0.0431
  },
  "stretching-seated-lower-back-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5527
  },
  "stretching-seated-shoulder-flexor-depresor-retractor": {
    "zoom": 1.101,
    "x": 0.5,
    "y": 0.9865,
    "objectX": 0.377
  },
  "stretching-seated-twist-straight-arm": {
    "zoom": 1.041,
    "x": 0.5326,
    "y": 1,
    "objectX": 1
  },
  "stretching-seated-wide-angle-pose-sequence": {
    "zoom": 1.066,
    "x": 0.5,
    "y": 0.3804,
    "objectX": 0.6581
  },
  "stretching-side-wrist-pull-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.0256
  },
  "stretching-single-leg-stretch-bent-knee": {
    "zoom": 1.009,
    "x": 0.5,
    "y": 1,
    "objectX": 0.377
  },
  "stretching-single-straight-leg-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.377
  },
  "stretching-sitting-bent-over-back-stretch": {
    "zoom": 1.053,
    "x": 0.5,
    "y": 1,
    "objectX": 0.1837
  },
  "stretching-slopes-towards-stretch": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.5879
  },
  "stretching-spine-stretch": {
    "zoom": 1.222,
    "x": 0.5,
    "y": 1,
    "objectX": 0.7636
  },
  "stretching-standing-back-rotation-stretch": {
    "zoom": 1.121,
    "x": 0.5,
    "y": 0.9122,
    "objectX": 0.5176
  },
  "stretching-standing-reach-up-back-rotation-stretch": {
    "zoom": 1.009,
    "x": 0.5,
    "y": 1,
    "objectX": 0.6757
  },
  "stretching-standing-side-bend-bent-arm": {
    "zoom": 1.009,
    "x": 0.5,
    "y": 1,
    "objectX": 0.9569
  },
  "stretching-wrist-circles": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.7811
  },
  "rotational-push-up": {
    "zoom": 1,
    "x": 0.5,
    "y": 0.5,
    "objectX": 0.4824
  },
  "lying-scissor-kick": {
    "zoom": 1.062,
    "x": 0.4375,
    "y": 0,
    "objectX": 0
  },
  "pilates-corkscrew": {
    "zoom": 1.018,
    "x": 0.5,
    "y": 0,
    "objectX": 0.6933
  }
};

/** Globaler Rahmen für alle Übungen. */
export const PANEL_ASPECT = "1.567";
