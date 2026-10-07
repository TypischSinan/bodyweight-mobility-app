# Exercise media: origin and usage

## Source

All demo videos and stills come from
[`luisaraujoc/free-exercise-db-api`](https://github.com/luisaraujoc/free-exercise-db-api)
and are loaded directly from the Cloudflare R2 CDN linked there:

```
https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/<male|female>/<slug>.mp4
https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/<male|female>/<slug>.jpg
```

- **Dataset**: 317 exercises, 10 body regions, one male and (usually) one female
  1080p recording plus a poster per exercise.
- `data/exercise-db-snapshot.json` is a snapshot of that dataset, trimmed to the
  fields `npm run validate` needs (name, `equipment`, video URLs). It is used for
  validation only and is never loaded in the browser.

## Origin & license — what applies

- **Code of this project**: MIT, see [LICENSE](LICENSE). Keep the copyright
  notice and the license text, no warranty.
- **Upstream dataset**: in its "License" section the source repo states:
  *"Code and exercise metadata are released under the MIT License"* — so its MIT
  grant explicitly covers **code and exercise metadata**, not the video files.
  That license statement is **not** replaced or rewritten here. Anyone reusing
  metadata from there has to comply with the terms of the upstream MIT license —
  in particular by shipping the copyright and license notice and by taking over
  the warranty disclaimers.
- **This app only passes the media through**: it is streamed at runtime from the
  source repo's CDN, is not embedded here, and is not relicensed. No video files
  are distributed with this repository.
- **No assurance about the rights chain of the video material**: see below.

### Important caveat about the origin of the videos

In its README, under *"Where did the videos come from?"*, the source repo openly
states that the videos were **not filmed by the maintainer**: he bought them
through an ad and does not know where the seller got them — with the explicit
warning *"So use with caution."* The rights chain for the video material is
therefore **not** established; the repo explicitly asks rights holders to get in
touch and takes the material down right away in that case.

Consequence for this project: this repository is public and links to that CDN, so
it is *not* a commercial product and no media files are redistributed — but the
residual risk sits with anyone deploying or commercialising it. If you fork this
for anything beyond personal use, either clarify the origin or switch the material
to your own or clearly licensed footage. The swap is prepared for: media URLs are
built exclusively through `videoUrl()` / `posterUrl()` in `src/data/exercises.js`
— adapting the base URL (`CDN`) and the per-exercise slugs is enough. Afterwards
run `npm run framing` and `npm run validate:media`.

## What this project adds itself

- The selection of the 63 equipment-free exercises and the composition of the 16
  sessions (`src/data/bundles.js`).
- The equipment audit: reviewing every demo clip (posters and mid-clip frames)
  plus a hand-maintained exclusion list in `scripts/validate.mjs`. The dataset's
  `equipment` field is demonstrably wrong; three exercises were replaced because
  of it (details in [BUNDLES.md](BUNDLES.md)).
- German focus categories, short texts and coaching lines (execution, common
  mistake, breathing) per exercise in `src/data/exercises.js`. They are condensed
  German renderings of the dataset's English `formCues` / `commonMistakes` /
  `breathing`.
- The measured framing per exercise (`src/data/framing.js`), generated from the
  clips with `scripts/framing.mjs`.
- Everything else (markup, design, timer, rest cues, training log, installation
  as a web app) is part of this project.
