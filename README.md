# MinMax Workout — Trainingsdokumentation

Mobile-first Web-App zum Erfassen der Trainingsgewichte und zum Verfolgen des
Fortschritts. Läuft komplett offline, ohne Konto und ohne Server.

## Nutzung

Die App ist eine statische Seite. Zwei Wege:

- **Lokal:** `index.html` im Browser öffnen.
- **GitHub Pages** (empfohlen, damit sie auf dem Handy als App installierbar ist):
  Repo → *Settings* → *Pages* → Source: *Deploy from a branch*, Branch:
  `claude/training-documentation-app-pl65iu`, Ordner `/ (root)`. Danach die
  angezeigte URL am Handy öffnen und über „Zum Home-Bildschirm hinzufügen"
  installieren.

Der Service Worker (`sw.js`) braucht HTTPS oder `localhost` — über GitHub Pages
funktioniert die App danach auch ohne Internetverbindung.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Komplette App: Trainingsplan, UI, Speicherung, Diagramme |
| `sw.js` | Service Worker für den Offline-Betrieb |
| `manifest.webmanifest` | Installierbarkeit als App |
| `icon.svg`, `icon-maskable.svg` | App-Icons |

Keine externen Abhängigkeiten, kein Build-Schritt. Alles Nötige — Styles, Logik
und Diagramme — liegt inline in `index.html`, damit die App auch bei schlechtem
Empfang sofort und vollständig lädt.

## Speicherung

Alle Daten liegen im `localStorage` des Browsers auf dem Gerät:

| Schlüssel | Inhalt |
|---|---|
| `trainingsplan.v1.sessions` | Gespeicherte Einheiten mit Datum |
| `trainingsplan.v1.drafts` | Laufende, noch nicht gespeicherte Eingaben |
| `trainingsplan.v1.ui` | Zuletzt geöffneter Tab und Diagramm-Auswahl |

Jede Eingabe wird sofort gesichert — App-Wechsel, Tab-Wechsel oder ein Neustart
des Browsers gehen nicht verloren. Erst „Einheit speichern" schreibt die Werte
mit dem Tagesdatum in die Historie.

Über *Daten exportieren* / *Daten importieren* im Fortschritt-Tab lässt sich der
gesamte Verlauf als JSON sichern und auf einem anderen Gerät wieder einlesen.
Der Import ergänzt bestehende Einheiten, statt sie zu überschreiben.

## Trainingsplan

Vier Trainingstage in der Reihenfolge des Plans: **Total Body** (6 Übungen),
**Upper Body** (7), **Lower Body** (6), **Arms & Delts** (8).

Die Sätze/Wiederholungen und die Plangewichte sind als Referenz hinterlegt; die
tatsächlich trainierten Gewichte werden pro Einheit erfasst (bis zu drei
Nachkommastellen, Komma und Punkt werden beide akzeptiert).

## Diagramm-Farben

Die Verlaufskurven nutzen eine achtstufige kategoriale Palette, die in hellem
und dunklem Modus gegen Rot-/Grünschwäche geprüft ist (Protanopie und
Deuteranopie, ΔE ≥ 8 in OKLab). Die Farbe hängt an der Übung, nicht an ihrer
Position — das Ausblenden einer Kurve über die Legende färbt die übrigen nicht
um. Drei Farben liegen im hellen Modus unter 3:1 Kontrast; die Tabellenansicht
unter dem Diagramm hält jeden Wert auch ohne Farberkennung lesbar.
