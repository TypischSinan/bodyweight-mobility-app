# Übungsmedien: Herkunft und Nutzung

## Quelle

Alle Demo-Videos und Standbilder kommen aus
[`luisaraujoc/free-exercise-db-api`](https://github.com/luisaraujoc/free-exercise-db-api)
und werden direkt über das dort verlinkte Cloudflare-R2-CDN geladen:

```
https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/<male|female>/<slug>.mp4
https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/<male|female>/<slug>.jpg
```

- **Datensatz**: 317 Übungen, 10 Körperregionen, je Übung eine männliche und
  (meist) eine weibliche 1080p-Aufnahme plus Poster.
- `data/exercise-db-snapshot.json` ist eine Momentaufnahme dieses Datensatzes,
  gekürzt auf die Felder, die `npm run validate` braucht (Name, `equipment`,
  Video-URLs). Sie wird nur zur Prüfung verwendet, nicht im Browser geladen.

## Herkunft & Lizenz – was gilt

- **Code dieses Projekts**: MIT, siehe [LICENSE](LICENSE). Copyright-Hinweis und
  Lizenztext mitführen, keine Gewährleistung.
- **Quelldatensatz**: Das Quell-Repo stellt in seinem Abschnitt „License“ klar:
  *„Code and exercise metadata are released under the MIT License“* – die
  MIT-Angabe deckt also **Code und Übungs-Metadaten**, nicht ausdrücklich die
  Videodateien. Diese Lizenzangabe wird hier **nicht** ersetzt oder
  umgeschrieben. Wer Metadaten von dort weiterverwendet, muss die Bedingungen
  der MIT-Lizenz des Ursprungs einhalten – insbesondere den Copyright- und
  Lizenzhinweis mitliefern und die Gewährleistungsausschlüsse übernehmen.
- **Diese App reicht die Medien nur durch**: Sie werden zur Laufzeit vom CDN des
  Quell-Repos gestreamt, sind hier nicht eingebettet und werden nicht
  weiterlizenziert. Es werden keine Videodateien mit dem Repository verteilt.
- **Keine Zusicherung über die Rechtekette des Videomaterials**: siehe unten.

### Wichtiger Vorbehalt zur Herkunft der Videos

Das Quell-Repo schreibt in seinem README unter
*„Where did the videos come from?“* offen, dass die Videos **nicht selbst gedreht**
wurden: Der Maintainer hat sie über eine Werbeanzeige gekauft und weiß nicht, wo
der Verkäufer sie her hat – mit dem ausdrücklichen Hinweis *„So use with caution.“*
Für das Videomaterial ist die Rechtekette damit **nicht** belegt; das Repo bittet
Rechteinhaber ausdrücklich, sich zu melden, und nimmt das Material dann sofort
herunter.

Konsequenz für dieses Projekt: Die Medien sind hier für den lokalen/privaten
Gebrauch eingebunden. Vor einer Veröffentlichung oder kommerziellen Nutzung muss
entweder die Herkunft geklärt oder auf eigenes bzw. klar lizenziertes Material
umgestellt werden. Der Austausch ist vorbereitet: Medien werden ausschließlich
über `videoUrl()` / `posterUrl()` in `src/data/exercises.js` gebildet – Base-URL
(`CDN`) und Slugs pro Übung anpassen genügt. Anschließend `npm run framing`
und `npm run validate:media` laufen lassen.

## Was dieses Projekt selbst hinzufügt

- Auswahl der 63 gerätefreien Übungen und Zusammenstellung der 16 Sessions
  (`src/data/bundles.js`).
- Die Prüfung auf Geräte: Sichtung aller Demo-Clips (Poster und Mittelframes) und
  eine handgeführte Ausschlussliste in `scripts/validate.mjs`. Das
  `equipment`-Feld des Datensatzes ist nachweislich fehlerhaft; drei Übungen
  wurden deshalb ersetzt (Details in [BUNDLES.md](BUNDLES.md)).
- Deutsche Fokuskategorien, Kurztexte und Coaching-Zeilen (Ausführung, typischer
  Fehler, Atmung) je Übung in `src/data/exercises.js`. Sie sind verdichtete
  deutsche Fassungen der englischen `formCues` / `commonMistakes` / `breathing`
  des Datensatzes.
- Der gemessene Bildausschnitt je Übung (`src/data/framing.js`), erzeugt aus den
  Clips mit `scripts/framing.mjs`.
- Alle übrigen Inhalte (Markup, Design, Timer, Pausensignale, Trainingslog,
  Installation als Web-App) sind Teil dieses Projekts.
