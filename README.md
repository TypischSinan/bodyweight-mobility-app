# Pulse — 10 Minuten Training

16 gerätefreie Sessions à exakt zehn Minuten. Jede Session besteht aus **10
Übungen** im festen Rhythmus: 60 s Primer, danach je 40 s Arbeit mit 20 s Pause
dazwischen. Innerhalb einer Session kommt jede Übung nur einmal vor; der Aufbau
folgt Blöcken (Primer → Arbeit → Rumpf → Cool-down bzw. Flow → Halten), und zu
jeder Bewegung gibt es ein Demo-Video mit Formhinweisen.

## Schnellstart

```bash
npm run dev          # http://127.0.0.1:5173
PORT=4000 npm run dev
```

Es gibt **keine Abhängigkeiten und keinen Build-Schritt** – nur Node ≥ 20 für den
Dev-Server. Ein `npm install` ist nicht nötig.

```bash
npm run validate        # Daten prüfen: 600 s pro Session, 10 Übungen, 40/20-Rhythmus,
                        # keine Doppelungen, nur gerätefreie Übungen, PWA-Dateien
npm run validate:media  # zusätzlich: jede Video- und Poster-URL am CDN antwortet mit 200
npm run framing         # Bildausschnitte neu berechnen (braucht ffmpeg + einmalig `npm install`)
npm run framing -- --only=<slug,...>   # nur einzelne Übungen neu vermessen
npm run icons           # App-Icons in assets/icons erzeugen (ohne Abhängigkeit)
```

Nur `npm run framing` braucht eine Abhängigkeit (`jpeg-js`, Dev-only). Die App
selbst, der Dev-Server und `npm run icons` laufen ohne `node_modules`.

## Aufbau

```
index.html                    Markup aller Ansichten (Library, Detail, Player, Dashboard)
style.css                     Design-System (dunkles „Instrumentenpanel", Säure-Lime, Mono-Ziffern)
manifest.webmanifest          Name, Farben und Icons für die Installation
sw.js                         Service Worker: App-Hülle für den Offline-Start
favicon.svg                   Vektor-Favicon (dieselbe Raute wie die Kopfzeile)
src/app.js                    Zustand, Ansichten, Player-Steuerung, Filter, Dashboard
src/timer.js                  driftfreier Session-Timer (rechnet mit Zeitstempeln, nicht mit Ticks)
src/audio.js                  Countdown-/Wechsel-/Pausensignale über WebAudio (keine Audiodateien)
src/storage.js                Trainingshistorie + Einstellungen (localStorage), Auswertung, Sicherung
src/data/exercises.js         Übungskatalog: Medien-Slug, Fokus, Coaching-Texte (deutsch)
src/data/bundles.js           16 Sessions: Blöcke aus Übungs-IDs, Rhythmus-Konstanten
src/data/framing.js           Bildausschnitt je Übung (erzeugt von scripts/framing.mjs)
assets/icons/                 App-Icons (erzeugt von scripts/icons.mjs)
scripts/dev.mjs               Static-Server ohne Abhängigkeiten
scripts/validate.mjs          Prüfskript für Daten, Bildausschnitte, Installation und Medien
scripts/framing.mjs           Analyse der Clips: Rahmen, Zoom, Drehpunkt je Übung
scripts/icons.mjs             PNG-Erzeugung der App-Icons (nur Node-Standardbibliothek)
data/exercise-db-snapshot.json Momentaufnahme des Quelldatensatzes (nur Prüffelder)
```

## Installation auf dem Handy

Pulse ist eine installierbare Web-App – kein Store, kein Build:

1. Seite im Browser öffnen (Chrome/Safari, **https** oder `localhost`).
2. Teilen-Menü → **„Zum Home-Bildschirm"** (Android: „App installieren").
3. Die Verknüpfung startet die App ohne Adressleiste (`display: standalone`).

Damit startet die App auch **ohne Netz**: `sw.js` legt die App-Hülle (HTML, CSS,
Module, Icons) in den Cache. Der Service Worker lädt eigene Dateien zuerst aus
dem Netz – so greift ein Update sofort und HTML und Module können nicht
auseinanderlaufen – und fällt nur bei fehlender Verbindung auf den Cache zurück.
Nur die Demo-Clips kommen zwingend vom CDN; ohne Netz zeigt der Player das
Standbild.

## Wo der Fortschritt liegt (Datenspeicherung)

Der Trainingsverlauf und die Einstellungen (Ton, Demo-Aufnahme Mann/Frau, letzte
Session) liegen im **`localStorage` der Seite** – kein Konto, kein Server, keine
Cookies. Wichtig ist die Herkunft: gespeichert wird pro **Origin** (Schema + Host
+ Port). Zwei Dateien desselben Hosts teilen sich den Speicher, ein anderer Host
oder ein privates Fenster haben ihren eigenen.

Auf iOS ist das der Grund, die App zu installieren: Safari räumt Skript-Speicher
von nicht installierten Seiten nach sieben Tagen ohne Interaktion auf. Eine über
„Zum Home-Bildschirm" installierte Web-App ist davon ausgenommen – der Fortschritt
bleibt also erhalten, solange die Verknüpfung existiert.

Zusätzlich lässt sich der Verlauf als Datei sichern (Dashboard → **„Fortschritt
sichern"** / **„Sicherung laden"**, JSON, umgesetzt in `createBackup()` /
`restoreBackup()` in `src/storage.js`). Beim Einlesen wird zusammengeführt statt
ersetzt: bereits vorhandene Sessions werden nicht doppelt gezählt. Das ist der
Weg für Gerätewechsel, eine neu aufgesetzte Verknüpfung oder wenn die
Websitedaten gelöscht wurden.

## iPhone 16 Pro Max

Die Trainingsansichten sind auf das Display des iPhone 16 Pro Max (440 × 956
CSS-Pixel) gerechnet:

- **Keine Seitenscrollung**: Ablauf und Player füllen genau die Höhe des sichtbaren
  Bereichs (`body.fit` in `style.css`). Nur der Ablauf scrollt zur Not intern,
  wenn ein Gerät noch weniger Höhe übrig lässt.
- **Geräte-Ränder**: Abstände berücksichtigen `env(safe-area-inset-*)` für Dynamic
  Island (59 px) und Home-Indikator (34 px); die Navigationsleiste sitzt darüber.
- **Größtmögliches Demo-Fenster**: Der Player zeigt das Video randlos über die
  volle Displaybreite (440 statt 408 px) und behält dabei das gemessene Format
  von 1,567:1 aus `src/data/framing.js` – dadurch wächst die Person, ohne dass
  Inhalt angeschnitten wird.
- **Kein Gummiband-Effekt** (`overscroll-behavior: none`) und keine
  Doppeltipp-Vergrößerung auf Bedienelementen.

## Gestaltungsprinzip: wenig Text, Details auf Anfrage

Die Oberfläche zeigt pro Bildschirm nur das Nötigste:

- **Library**: Kopfzeile, Kategorie-Segment, Fokus-Auswahl, dann pro Session nur
  Nummer, Titel und eine Metazeile. Die Beschreibung gibt es erst im Detail.
- **Ablauf (Trainings-Tab)**: Kategorie und Level, Titel mit dem Zurück-Knopf
  **neben** dem Titel (eine Zeile), eine Metazeile, ein Satz Beschreibung und der
  Ablauf als kompakte Zeilen – je Übung Name, Dauer und `+20` für die folgende
  Pause. Der Session-Start bleibt unten in Reichweite.
- **Player**: Timer, Video, **eine** Ausführungszeile und ein `Details`-Knopf für
  Muskeln, typischen Fehler und Atmung. In der Pause steht dort schon die nächste
  Übung samt Standbild.
- **Kopfzeile**: nur die Wortmarke, kein erklärender Zusatz.

## Bildausschnitt der Videos

Die Clips sind 16:9 mit viel leerem Hintergrund. `scripts/framing.mjs` vermisst
jeden Clip über **alle Frames** (ffmpeg, 6 fps) und berechnet daraus den globalen
Rahmen (1,567:1, höher als 16:9), den Szenenausschnitt und den Zoom je Übung – so
wird die Person größer dargestellt, ohne dass in irgendeinem Frame etwas
abgeschnitten wird. Anschließend prüft das Skript jeden Frame noch einmal mit
einer feinfühligeren Schwelle nach und bricht ab, wenn Inhalt den Rand berührt.
Mit `--only=<slug,...>` werden nur einzelne Übungen neu vermessen und die übrigen
Einträge unverändert übernommen.

## Funktionen

- **Library** mit Kategorie-Segment und Fokus-Auswahl, Intensitäts- und Umfangsangaben.
- **Session-Detail** mit dem kompletten Ablauf, gruppiert nach Blöcken und mit Zeiten.
- **Player** mit 3-2-1-Auftakt, driftfreiem Countdown, Fortschritt für Übung *und*
  Session, 20-Sekunden-Pausen zwischen den Übungen (Standbild der nächsten Übung,
  eigener Ton), einer Ausführungszeile mit aufklappbaren Details, nächster Übung,
  Ton-Toggle und Demo-Umschaltung Mann/Frau.
- **Tastatur**: Leertaste = Start/Pause, ← → = Übung wechseln, `R` = von vorn,
  `Esc` = zurück.
- **Navigation**: drei Tabs unten; der Trainings-Tab wechselt zwischen Ablauf und
  laufender Session. Wischen nach rechts geht ebenfalls zurück.
- **Trainingslog** mit Streak, 7-Tage-Diagramm (Minuten), Gesamtzahlen und Liste,
  dazu Sichern/Laden/Zurücksetzen des Verlaufs.
- **Robustheit**: Wake Lock hält den Bildschirm während der Session wach, ein
  Video-Fehler fällt auf Standbild plus Hinweis zurück, `prefers-reduced-motion`
  schaltet Animationen ab.

## Warum kein Framework

Die App ist ein rein klientseitiges Werkzeug ohne Serverlogik: Zustand, Timer und
Ansichten sind lokal, es gibt keine Datenbank, keine API, kein SEO-Ziel und keine
geteilten Komponenten über mehrere Teams. Ein Static-Server plus ES-Module deckt das
komplett ab – ohne Build, ohne `node_modules`, ohne Framework-Upgradepfad. Würde
später Serverlogik dazukommen (Accounts, Sync, personalisierte Pläne), ist der
Datenteil in `src/data/` framework-unabhängig und lässt sich direkt übernehmen.

## Übungen auswählen

`src/data/exercises.js` ist der einzige Ort, an dem Übungen stehen. Jede Übung
braucht **keine Geräte und keine Möbel**: keine Klimmzugstange, keine Bank, keine
Stufe, keine Ringe, keine Bänder.

Das `equipment`-Feld des Quelldatensatzes reicht dafür **nicht** aus: Es nennt
auch Übungen `body weight`, deren Demo-Clip eindeutig Gerät zeigt. Deshalb prüft
`npm run validate` zweistufig – gegen das Datensatzfeld *und* gegen eine
handgeprüfte Ausschlussliste (`NEEDS_APPARATUS`) in `scripts/validate.mjs`. Wie die
Liste entstanden ist und welche Übungen zuletzt ersetzt wurden, steht in
[BUNDLES.md](BUNDLES.md).

Der Rhythmus steckt nicht in den Daten, sondern in Konstanten – Sessions enthalten
nur Übungs-IDs:

```js
export const SESSION_EXERCISES = 10;   // Übungen je Session
export const PRIMER_SECONDS = 60;      // die erste Übung
export const WORK_SECONDS = 40;        // alle weiteren
export const REST_SECONDS = 20;        // Pause nach jeder Übung außer der letzten

// 60 + 9×40 + 9×20 = 600 s = 10:00
```

Eine neue Session ist damit nur eine Liste von Blöcken mit Übungs-IDs:

```js
{ id: "core-intensive", /* … */ blocks: [
  { label: "Haltung", items: [{ id: "front-plank" }] },
] }
```

## Medien, Daten und Lizenz

Demo-Videos und Poster kommen aus
[`luisaraujoc/free-exercise-db-api`](https://github.com/luisaraujoc/free-exercise-db-api)
(MIT, 317 Übungen, männliche und weibliche Aufnahme je Übung) und werden direkt
über deren R2-CDN geladen.

**Der Code dieses Projekts steht unter der MIT-Lizenz ([LICENSE](LICENSE)). Für
die eingebundenen Medien gilt das nicht automatisch:** Sie stammen aus dem
Quelldatensatz, dessen MIT-Bedingungen (Copyright-Hinweis und Lizenztext
mitführen, keine Gewährleistung) für das Material weiter gelten – eine
Weiterverwendung muss diese Bedingungen ebenfalls einhalten. Für das
Videomaterial selbst ist die Rechtekette zusätzlich unklar; Einzelheiten, die
Pflichten beim Weiterverwenden und der Weg zum Austausch der Medien stehen in
[ATTRIBUTIONS.md](ATTRIBUTIONS.md). Der Aufbau der Sessions steht in
[BUNDLES.md](BUNDLES.md).

Bekannte Grenzen: ohne Netzverbindung bleibt das Demo-Video leer (die App zeigt
dann das Standbild), und für einige Übungen – `Front Plank`, `Reverse Crunch`,
`Rotational Push-up`, `Lying Scissor Kick`, `Pilates Corkscrew` – gibt es im
Datensatz nur die weibliche Aufnahme, weshalb der Umschalter dort deaktiviert ist.
