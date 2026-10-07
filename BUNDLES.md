# Sessions

16 Sessions in `src/data/bundles.js`, jede exakt **600 Sekunden** (10:00). Jede
Session hat **10 Übungen**, nutzt jede davon **höchstens einmal** und besteht
ausschließlich aus Übungen, die ohne Gerät und ohne Möbel ausgeführt werden.

Der Zeitplan folgt einem festen Rhythmus, nicht den Daten:

```
Primer (Übung 1)      60 s
Übung 2 … 10          je 40 s
Pause dazwischen      9 × 20 s
                     ─────────
                     600 s = 10:00
```

Die Blöcke listen also nur Übungs-IDs; `PRIMER_SECONDS`, `WORK_SECONDS` und
`REST_SECONDS` in `src/data/bundles.js` legen die Zeiten fest, `npm run validate`
erzwingt sie (10 Übungen, 19 Schritte, 9 Pausen à 20 s, Summe 600 s – auch über
die Blockzeiten gerechnet, die der Ablauf anzeigt).

| # | Session | Kategorie | Level | Fokus | Blöcke | Übungen |
|---|---------|-----------|-------|-------|--------|---------|
| 01 | Full Body Basics | Kraft | Einsteiger | Ganzkörper | Primer · Kraft · Rumpf · Cool-down | 10 |
| 02 | Upper Body | Kraft | Einsteiger+ | Oberkörper | Primer · Kraft · Haltung · Cool-down | 10 |
| 03 | Core Intensive | Kraft | Einsteiger+ | Core | Haltung · Kraft · Cool-down | 10 |
| 04 | Legs & Glutes | Kraft | Einsteiger | Beine | Primer · Kraft · Dehnung | 10 |
| 05 | Full Body Burn | HIIT | Fortgeschritten | Ganzkörper | Runde 1 · Runde 2 | 10 |
| 06 | Cardio Starter | HIIT | Einsteiger | Ganzkörper | Primer · Cardio · Kraft · Rumpf · Cool-down | 10 |
| 07 | Mobility Basics | Mobility | Einsteiger | Ganzkörper | Flow · Halten | 10 |
| 08 | Hip Mobility | Mobility | Einsteiger+ | Hüfte | Flow · Halten | 10 |
| 09 | Shoulders & Thorax | Mobility | Einsteiger | Schultern | Flow · Halten | 10 |
| 10 | Ankles & Squat | Mobility | Einsteiger | Waden & Füße | Flow · Kraft · Halten | 10 |
| 11 | Desk Reset | Mobility | Einsteiger | Nacken & Hände | Flow · Halten | 10 |
| 12 | Full Body Stretch | Stretch | Einsteiger | Ganzkörper | Oberkörper · Unterkörper | 10 |
| 13 | Hip & Hamstring | Stretch | Einsteiger | Hüfte | Halten | 10 |
| 14 | Evening Wind Down | Stretch | Einsteiger | Ganzkörper | Halten | 10 |
| 15 | Back & Spine Release | Stretch | Einsteiger | Rücken | Halten | 10 |
| 16 | Upper Recovery | Stretch | Einsteiger | Oberkörper | Halten | 10 |

## Regeln der Zusammenstellung

- **Rhythmus**: jede Session läuft genau 10 Minuten – 60 s Primer, 9×40 s Arbeit,
  9×20 s Pause. Die Pause steht zwischen zwei Übungen (auch über Blockgrenzen
  hinweg), nach der letzten Übung folgt keine mehr.
- **Keine Wiederholung innerhalb einer Session**. Dieselbe Übung darf in mehreren
  Sessions vorkommen – die Sessions sind eigenständige Programme.
- **Reihenfolge nach Zweck**: Primer (Puls und Gelenke wecken) → Hauptarbeit
  (kraftvoll, große Muskeln) → Rumpf → Cool-down bzw. bei Mobility/Stretch
  Flow (dynamisch, distal zu proximal) → Halten (statisch, große Muskeln vor
  kleinen, immer beidseitig).
- **Machbarkeit ohne Gerät**: geprüft in `scripts/validate.mjs`. Der Katalog wird
  gegen `data/exercise-db-snapshot.json` (Feld `equipment`, muss `body weight`
  sein) **und** gegen eine handgeprüfte Ausschlussliste (`NEEDS_APPARATUS`)
  geprüft.

## Prüfung auf Geräte – und warum das Datensatzfeld nicht reicht

Das `equipment`-Feld des Quelldatensatzes nennt einzelne Übungen `body weight`,
deren Demo-Clip klar Gerät zeigt. Aufgefallen ist das bei **Old School Reverse
Extensions**: Der Clip zeigt eine Langhantel auf einer Flachbank, obwohl der
Datensatz „body weight" behauptet. Deshalb wurden die Standbilder und
Mittelframes **aller** Katalog-Übungen gesichtet (ffmpeg-Frame pro Clip, Poster
je Übung) und jede auffällige Bewegung einzeln nachgesehen. Ergebnis: drei
Übungen waren trotz `body weight` nicht zuhause machbar und wurden ersetzt.

| Entfernt (Gerät/Möbel) | Ersetzt durch | Begründung |
|---|---|---|
| `old-school-reverse-extensions` – Langhantel auf der Bank | `rotational-push-up` (Rotational Push-up, Boden) | gleiche Rolle im Kraftblock, nur Körpergewicht |
| `45-degree-bycicle-twisting-crunch` – 45°-Bank mit Fußpolstern | `lying-scissor-kick` (Full Body Burn) bzw. `pilates-corkscrew` (Core Intensive) | Rumpf-/Obliques-Arbeit am Boden |
| `stretching-peroneals-stretch` – Widerstandsband um den Fuß | `stretching-front-toe-touch` (Ankles & Squat) | Waden-/Fußkette, ohne Hilfsmittel |

Gegenprobe, die **behalten** wurden: `rear-decline-bridge` (der Clip zeigt eine
Boden-Bridge – im Standbild sind die Füße erhöht, im Ablauf nicht) und
`stretching-seated-calf-stretch` / `stretching-reverse-dip` (am Boden ausgeführt).
Beide stehen weiter im Katalog.

## Bewusst nicht enthalten

Diese Übungen sind laut Datensatz `body weight`, in der Ausführung aber auf
Gerät oder Möbel angewiesen – sie wurden ersetzt statt als „gerätefrei" verkauft.
Sie stehen deshalb in der Ausschlussliste in `scripts/validate.mjs` und können
nicht versehentlich zurückkommen:

- Barren/Klimmzugstange: `chest-dips`, `triceps-dips`, `scapula-dips`, alle
  `pull-up-*`/`chin-up-*`, `hanging-leg-hip-raise`, `hanging-straight-leg-raise`,
  `vertical-leg-raise-on-parallel-bars`, `commando-pull-up`
- Bank/Stuhl/Stufe: `bench-dips`, `incline-push-ups`, `deep-push-ups`,
  `crunch-on-bench`, `incline-leg-hip-raise`, `jump-step-up`, `bench-pull-ups`,
  `donkey-calf-raise`, `stretching-stairs-calf-stretch`,
  `stretching-standing-bench-calf-stretch`,
  `stretching-hip-flexor-stretch-rear-foot-elevated`
- Langhantel/45°-Bank/Band: `old-school-reverse-extensions`,
  `45-degree-bycicle-twisting-crunch`, `stretching-peroneals-stretch`
- Hilfsmittel/Ringe/Bänder: `inverted-row-between-chairs`,
  `inverted-row-with-straps`, `ring-high-row`,
  `stretching-standing-wheel-rollout`

Ersatzübungen mit eigenem Video: statt Gerätedips → `rotational-push-up`,
statt erhöhter Liegestütze → `push-ups`/`close-grip-push-ups`, statt Wadenheben
auf der Stufe → `stretching-seated-calf-stretch`.

## Übungsnamen

Die Anzeigenamen sind gekürzt und vereinheitlicht, der Datensatz-Slug bleibt der
Schlüssel für die Medien. Beispiele: `drv-squat`/`squat` → „Squat",
`rear-decline-bridge` → „Glute Bridge" (das Video zeigt eine Boden-Bridge),
`old-school-reverse-extensions` → „Reverse Triceps Extension" (bis zum Ersatz),
`stretching-ceiling-look-stretch` → „Hüftbeuger & Bauch" (der Datensatzname
„Standing Hip Flexor and Abdominal Stretch" beschreibt die Bewegung genauer).
Bei Übungen, die es im Datensatz nur in einer Fassung gibt, wird die weibliche
Aufnahme genutzt (`only: "female"`), der Umschalter im Player ist dort
deaktiviert.
