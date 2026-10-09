# MinMax Workout — Trainingsdokumentation

Mobile-first Web-App zum Erfassen der Trainingsgewichte und zum Verfolgen des
Fortschritts. Läuft offline und gleicht die gespeicherten Einheiten zwischen
Handy und PC ab.

Das zugehörige Firebase-Projekt ist **Minmax Workouttracker** mit der
Projekt-ID `minmax-workouttracker`. Veröffentlicht wird die App über
[GitHub Pages](https://kandello.github.io/Trainingsplan/).
Eine gespeicherte Browser-Konfiguration für ein anderes Projekt blockiert den
Sync und lässt sich im Sync-Dialog zurücksetzen.

Neben jedem Übungsnamen zeigt ▼ / blauer ● / ▲ die letzte gespeicherte
Empfehlung an. Grün bedeutet einen vom Server bestätigten Abgleich.
Fehlgeschlagene Änderungen und Löschungen bleiben in einer lokalen,
kontogebundenen Warteschlange; „Erneut abgleichen“ wiederholt den Abgleich.
„Datensicherung herunterladen“ enthält auch die lokale Wiederherstellungskopie.

Die helle Oberfläche verwendet Blau-Grau, Navy und weiße Eingabefelder.
„Dein Training“ zählt bestätigte Übungen; leere Plätze werden nicht mitgezählt.
Eigene Farbsets bleiben lokal gespeichert und erhalten.

Die Gestaltung „Edle Oberflächen“ ergänzt sanfte Verläufe mit 145° Richtung,
feine helle Oberkanten und zweistufige weiche Navy-Schatten. Neutrale Karten
verlaufen von Weiß zu `#F0F5F9`; persönliche Kartenfarben werden oben mit 8 %
Weiß aufgehellt und enden bei der unveränderten gewählten Farbe. Eingabefelder
und die Diagrammfläche bleiben weiß und deckend. Kopfbuttons und Navigation
behalten ihre leichte Transparenz über Carbon. Ausgewählte, bestätigte und
Warnzustände behalten ihre eigenen Farben und Rahmen. Farbvorschauen zeigen
den Kartenverlauf, reine Farbproben und gespeicherte Hex-Werte bleiben exakt.
Alle Oberflächentokens stehen gemeinsam in `index.html`; Geometrie, Daten und
Sync werden dafür nicht geändert. Browserprüfungen und echte Screenshots mit
Standard- und persönlichen Farben: `node tools/preview-surfaces.cjs`.

Prüfungen: `node tools/test.cjs`, `node tools/test-sdk.cjs` und
`node tools/test-studio.cjs`.
Kontotrennung: `node tools/test-accounts.cjs`; Browser-/Mehrtab-Prüfung:
`node tools/preview-accounts.cjs`. Der echte lokale Regeltest läuft mit
`node tools/run-account-rules.cjs` (Firebase CLI und Java 21; ausschließlich
Demo-Projekt `demo-minmax-accounts`, Auth/Firestore auf localhost).
Für optionale Browserprüfungen und Screenshots mit isolierten Beispieldaten:
`npm install --prefix tools --no-save --package-lock=false playwright`,
danach `node tools/preview.cjs` (verwendet eine lokale Edge-Installation).
Screenshots werden im nicht veröffentlichten Ordner `artifacts/` abgelegt.

## Nutzung

Die App ist eine statische Seite ohne Build-Schritt.

- **Lokal:** `index.html` im Browser öffnen.
- **GitHub Pages** (nötig für Sync und Installation als App):
  Repo → *Settings* → *Pages* → Source: *Deploy from a branch*, Branch:
  `claude/training-documentation-app-pl65iu`, Ordner `/ (root)`.
  Danach die URL am Handy öffnen und über „Zum Home-Bildschirm hinzufügen"
  installieren.

Service Worker und Google-Anmeldung brauchen HTTPS oder `localhost` — über
GitHub Pages ist das gegeben.

## Geräte-Sync einrichten

MinMax enthält die öffentliche Konfiguration des bestehenden Projekts bereits.
Für die normale Nutzung genügt **Mit Google anmelden**; ein neues Firebase-Projekt
oder das manuelle Einfügen einer Konfiguration ist nicht nötig. Ohne Anmeldung
bleibt die App im lokalen Gastbereich.

Die Konfiguration liegt zusätzlich direkt in `index.html`, damit ein fehlender
oder alter Cache-Eintrag von `firebase-config.js` den Sync nicht abschaltet.
Die zusätzliche Datei wird mit Inhaltsversion geladen und offline gespeichert.
Nach Änderungen daran aktualisiert `node tools/embed-firebase-config.cjs` die
eingebettete Kopie und die passende Offline-URL. Regressionstest:
`node tools/test-sync-config.cjs`.

Die folgende technische Anleitung ist für die Projektverwaltung gedacht;
für bestehende Nutzer ist diese Einrichtung bereits erledigt.

Die Beschriftungen der Firebase-Konsole ändern sich gelegentlich; deshalb steht
jeweils dabei, wo der Punkt sitzt.

**1. Bestehendes Projekt öffnen**
- [console.firebase.google.com](https://console.firebase.google.com) öffnen.
- **Minmax Workouttracker** auswählen und die Projekt-ID `minmax-workouttracker` prüfen.
- Die folgenden Einrichtungsschritte gelten, soweit noch nicht eingerichtet.

**2. Firestore-Datenbank anlegen**
- Linke Seitenleiste → „Erstellen" (engl. *Build*) → „Firestore Database".
- Button „Datenbank erstellen".
- Standort `eur3 (europe-west)` — **später nicht mehr änderbar**.
- Modus: „Im Produktionsmodus starten" (nicht Testmodus — der läuft nach
  30 Tagen ab).
- „Erstellen". Danach erscheint eine leere Datenbank.

**3. Zugriffsregeln veröffentlichen**
- In der Firestore-Ansicht oben auf den Reiter „Regeln" (*Rules*).
- Den kompletten vorhandenen Text markieren und löschen.
- Inhalt von [`firestore.rules`](firestore.rules) einfügen.
- Button „Veröffentlichen".

Ohne diesen Schritt endet jeder Zugriff mit `permission-denied`.

**4. Google-Anmeldung aktivieren**
- Seitenleiste → „Authentication" → „Jetzt starten".
- Reiter „Sign-in method" → in der Liste „Google" anklicken.
- Schalter auf „Aktivieren", Support-E-Mail auswählen, „Speichern".

**5. Domain freigeben**
- Weiter in „Authentication" → Reiter „Settings" bzw. „Einstellungen"
  (neben *Users* und *Sign-in method*).
- Abschnitt „Autorisierte Domains" (*Authorized domains*).
- „Domain hinzufügen" → genau `kandello.github.io` eintragen — ohne `https://`
  und ohne Pfad. Dass `localhost` dort schon steht, ist normal.

Fehlt dieser Schritt, bricht die Anmeldung mit `auth/unauthorized-domain` ab.

**6. Konfiguration holen**
- Zahnrad oben links neben „Projektübersicht" → „Projekteinstellungen".
- Reiter „Allgemein", runterscrollen bis „Meine Apps".
- Symbol `</>` (Web) anklicken, Spitzname z. B. `Trainingsplan`.
- „Firebase Hosting einrichten" **nicht** ankreuzen → „App registrieren".
- Im angezeigten Code steht ein Block:

```js
const firebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  appId: "…"
};
```

Nur die geschweifte Klammer samt Inhalt kopieren — von `{` bis `}`.

**7. Eintragen**

Zwei Wege, beide gleichwertig:
- In der App auf den Sync-Button → unten einfügen → „Konfiguration speichern".
  Gilt nur für dieses Gerät, muss am zweiten Gerät wiederholt werden.
- Oder in [`firebase-config.js`](firebase-config.js) eintragen und pushen —
  dann gilt sie für alle Geräte.

Danach springt der Chip auf „Anmelden". Auf beiden Geräten mit **demselben
Google-Konto** anmelden. Der Chip zeigt anschliessend *Sync aktiv*, *Wartet*
(offline, wird nachgeholt) oder *Sync-Fehler* mit Klartext-Ursache.

Die App findest du später über Projekteinstellungen → „Meine Apps" →
„Konfiguration" wieder.

Die Werte in `firebase-config.js` sind keine Geheimnisse — der Schutz kommt aus
den Firestore-Regeln, nicht aus dem `apiKey`.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Komplette App: Trainingsplan, UI, Speicherung, Diagramme, Sync |
| `vendor/firebase.js` | Gebündeltes Firebase-SDK (App, Auth, Firestore) |
| `firebase-config.js` | Projekt-Konfiguration für den Sync |
| `firestore.rules` | Zugriffsregeln — jede Person sieht nur ihre eigenen Daten |
| `sw.js` | Service Worker für den Offline-Betrieb |
| `manifest.webmanifest`, `icon*.svg` | Installierbarkeit als App |

Keine CDN-Abhängigkeiten: Styles, Logik, Diagramme und das Firebase-SDK liegen
im Repo, damit die App auch bei schlechtem Empfang vollständig lädt.

### Firebase-SDK aktualisieren

`vendor/firebase.js` ist ein eingecheckter Build. Neu erzeugen mit:

```sh
npm ci --prefix tools
node tools/node_modules/esbuild/bin/esbuild ./tools/firebase-entry.js --bundle --format=esm --minify --target=es2020 --outfile=./vendor/firebase.js
```

### Lokale Prüfungen

`npm ci --prefix tools` installiert die Entwicklungsabhängigkeiten.
`node tools/test.cjs` prüft die App mit simuliertem Firebase, ohne Cloud-Zugriffe.
Der SDK-Einstieg liegt in `tools/firebase-entry.js`.

## Speicherung

| Ort | Inhalt |
|---|---|
| Firestore `users/{uid}/sessions` | Gespeicherte Einheiten — geräteübergreifend |
| Firestore `users/{uid}/state/plan` | Getauschte Übungen und ihre Reihenfolge |
| `localStorage` | Lokale Kopie, laufende Eingaben, zuletzt geöffneter Tab |

Jede Tastatureingabe wird sofort lokal gesichert — App-Wechsel oder Neustart
gehen nicht verloren. Erst „Einheit speichern" schreibt die Werte mit dem
Tagesdatum in die Historie und überträgt sie. Ohne Netz landen sie im lokalen
Firestore-Cache und gehen automatisch raus, sobald wieder Verbindung besteht.

Laufende, noch nicht gespeicherte Eingaben bleiben bewusst lokal — sonst würde
ein halb ausgefüllter Trainingstag vom anderen Gerät überschrieben.

### Eigene Vorlagen als einfache Textdateien

Unter **+ → Vorlage wählen** stehen Standardvorlagen und **Eigene Vorlagen**.
**Textvorlage importieren** öffnet eine UTF-8-Datei zuerst als bearbeitbaren
Entwurf. Erst **Als eigene Vorlage speichern** legt die Vorlage in deiner
Bibliothek ab; **Plan speichern** erstellt stattdessen einen zusätzlichen
Trainingsplan mit neuen Übungs-IDs und leerer Historie. Der aktive Plan lässt
sich über **+ → Aktuellen Plan als Vorlage öffnen** übernehmen: berücksichtigt
werden aktuelle Übungstausche, Reihenfolge, leere Plätze, Sätze und Wiederholungen.

Im Editor und bei geöffneten eigenen Vorlagen lädt **Vorlage als Text
exportieren** eine `.txt`-Datei herunter. Sie enthält keine Trainingshistorie,
protokollierten Gewichte, Empfehlungen, Kontodaten oder Interviewangaben.
Gleichnamige Vorlagen werden nur nach Rückfrage ersetzt; das Löschen einer
Vorlage verändert keine daraus erstellten Pläne oder Trainings.

```text
MinMax-Vorlage: 1
Plan: Mein Plan

[Oberkörper]
Brustpresse | 3 | 8-12
Rudern | 3 | 10
Klimmzüge | 2 | 6-8 | Körpergewicht
Platz: Brust

[Beine]
Beinpresse | 3 | 10-15
```

Die drei Spalten bedeuten **Übung | Sätze | Wiederholungen**. Feste Zahlen und
Bereiche mit Bindestrich oder Gedankenstrich sind erlaubt; Zahlen müssen
zwischen 1 und 99 liegen. Die optionale vierte Spalte **Körpergewicht** erhält
den entsprechenden Übungstyp. **Platz: Beliebig** oder ein deutscher Muskelname
legt einen leeren Platz an. Zeilen mit **#** sind Kommentare. Ein **|** im
Übungsnamen wird als `\|`, ein Backslash als `\\` geschrieben. Namen, die
mit **#** oder **Übung:** beginnen, erhalten beim Export ein zusätzliches
**Übung:** vor der Zeile. UTF-8-BOM und Windows-Zeilenumbrüche werden akzeptiert.
Fehler nennen die betroffene Zeile und verändern den vorhandenen Entwurf nicht.
Grenzen: 128 KB je Datei, 1–14 Tage, höchstens 50 Übungsplätze je Tag und
50 aktive eigene Vorlagen. Eine gleichnamige Übung steht je Tag nur einmal.

Beispieldatei: [minmax-vorlage-beispiel.txt](assets/minmax-vorlage-beispiel.txt).
Vorlagen sind auch offline verfügbar und liegen lokal kontogebunden unter
`trainingsplan.v1.templates`. Bei angemeldeten Nutzern ergänzt das optionale
Feld `templates` den vorhandenen Abgleich unter `users/{uid}/state/plan`.
Exportierte Datensicherungen enthalten die eigene Bibliothek; ältere Sicherungen
ohne dieses Feld bleiben importierbar und entfernen vorhandene Vorlagen nicht.
Löschmarkierungen verhindern, dass entfernte Vorlagen bei einem Abgleich zurückkehren.
Die Formatlogik steht in `tools/template-format.js` und wird mit dem Studio
in `index.html` eingebettet. Prüfungen: `node tools/test-templates.cjs` und
`node tools/preview-templates.cjs`.

### Eigene Bereiche pro Google-Konto

Dieselbe App kann von mehreren Personen mit jeweils eigenem Google-Konto
genutzt werden. Trainings, Pläne, Empfehlungen, laufende Eingaben,
Baukasten-Entwürfe, Farben und Wiederherstellungskopien bleiben auch lokal
getrennt. Nach dem Abmelden öffnet sich der Gastbereich; beim Wiederanmelden
erscheint ausschließlich der Bestand dieses Kontos. Gastdaten werden nur über
**Gastdaten ausdrücklich übernehmen** und eine Bestätigung zugeordnet.

Beim ersten Update werden die bisherigen, noch unzugeordneten lokalen Daten
vollständig separat gesichert. Nach der Google-Anmeldung bestätigt man einmal
**Vorhandene Daten diesem Konto zuordnen** oder wählt **Ohne Übernahme starten**.
Ohne Zuordnung erfolgt kein Upload dieses Altbestands; die Sicherung bleibt
erhalten. Die ursprünglichen Speicherschlüssel werden nicht überschrieben.

Neue Installationen ohne Altbestand zeigen diese Zuordnungsabfrage nicht.
Der Sync-Dialog öffnet sich grundsätzlich erst durch Antippen von **Sync**;
ein gesicherter Altbestand wartet bis zur ausdrücklich gewählten Zuordnung.
Die angezeigte Kontoadresse kommt ausschließlich aus der aktuellen
Google-Anmeldung; es wird kein festes Konto vorgegeben. Dies prüft
`node tools/test-new-users.cjs`, einschließlich Kontowechsel und Abmeldung.

Kontobereiche liegen als vollständig geprüfte lokale Momentaufnahmen unter
`trainingsplan.v3.accounts.minmax-workouttracker.profile.<Nutzer-ID>`; Gast und
unzugeordneter Altbestand haben eigene Bereiche. Ausstehende Änderungen sind
an ihren Eigentümer gebunden; verspätete Sync-Antworten anderer Konten werden
ignoriert. Ein Kontowechsel aktualisiert auch weitere geöffnete App-Tabs.
JSON-Export und Import gelten ausschließlich für den aktiven Bereich.

Die Speicherlogik wird aus `tools/account-storage.js` mit
`node tools/embed-accounts.cjs` in die App eingebettet. Die App selbst benötigt
weiterhin keinen Build-Schritt und kein neues Firebase-Projekt.

Zusätzlich sichert *Daten exportieren* im Fortschritt-Tab den gesamten Verlauf
als JSON; der Import ergänzt bestehende Einheiten, statt sie zu überschreiben.

## Trainingsplan

### MinMax Studio — Trainingsplan-Baukasten

Das **+** neben den Plan-Titeln öffnet MinMax Studio. Drei Wege führen zum
gemeinsamen Editor: **Plan empfehlen**, **Vorlage wählen** und **Selbst
zusammenstellen**. Erst **Plan speichern** legt einen zusätzlichen Plan an.
Bestehende Einheiten werden nicht geändert oder zusammengeführt.

Ohne eigenen Plan startet die App direkt auf der Startseite des Baukastens.
Mit eingerichtetem Plan öffnet sich die **Übersichtskachel** (Startseite) mit
einer Kachel pro Trainingstag, ohne automatischen Sync- oder Baukasten-Dialog.
Ein noch offener Trainingstag wird beim Neuladen stattdessen wiederhergestellt,
einschließlich Eingaben, Bestätigungen und Scrollposition. **Einheit speichern**
beendet diese Wiederaufnahme; der nächste Start zeigt die Übersichtskachel.
Der Zustand bleibt im lokalen UI-Bereich des jeweiligen Kontos. Ältere offene
Eingaben werden anhand des zuletzt genutzten Trainingstags weitergeführt.
Die Kacheln zeigen
den vollständigen Tagesnamen und das Datum der letzten gespeicherten Einheit;
ohne bisherige Einheit entfällt die Datumszeile. Antippen öffnet den Tag,
der Tab **Übersicht** und der Handy-/Browser-Zurück-Button führen zurück zur
Übersichtskachel. Die **Übersichtsleiste** (Navigation unten) ist auf der
Startseite ausgeblendet; ein eigener Button öffnet dort **Fortschritt**.
Die Carbon-Fotografie in `assets/carbon.jpg` wird auf Startseite, Trainingstagen
und Fortschritt mit CSS blau getönt und offline zwischengespeichert.
Die Kopfzeile bleibt transparent, ihre Buttons und die abgerundete
Übersichtsleiste sind leicht durchscheinend. Die Leiste hat seitlich und unten 6 px Abstand
(zusätzlich zum sicheren Bildschirmrand). Unveränderte Kontodaten und
Planantworten bauen die Ansicht nicht erneut auf; die Übersicht verwendet
keine Einblendanimation. Persönliche Kartenfarben und Trainingsdaten bleiben
erhalten. Bei
einem bereits angemeldeten Konto wird ein noch ausstehender Cloud-Plan zuerst
geladen, bevor die App einen leeren Bereich als neuen Einstieg behandelt.
Ein vorhandener Entwurf kann dort fortgesetzt werden. Der ursprüngliche
MinMax-Plan bleibt für bestehende Nutzer erhalten und wird neuen Nutzern nicht
automatisch angelegt. **Romans MinMax-Plan** ist eine elfte, ausdrücklich
auswählbare Vorlage mit Total Body, Upper Body, Lower Body und Arms & Delts:
7/7/5/6 Übungen, originale Sätze und Wiederholungen, eigene neue Übungs-IDs,
keine persönlichen Gewichte, Empfehlungen oder Trainingshistorie. Erst
**Plan speichern** legt den gewählten Plan an.
`node tools/embed-roman-plan.cjs` übernimmt die öffentliche Basisstruktur ohne
Gewichte in die Engine; danach `node tools/build-catalog.cjs` ausführen.
`node tools/test-onboarding.cjs` prüft Einstieg, Altbestand und Vorlage.
`node tools/test-overview.cjs` prüft Tagesanzahl, Datumsaktualisierung,
Kontotrennung und Neustart; `node tools/preview-overview.cjs` prüft die
Ansichten bei 360/412 px und Desktop mit unabhängigen Beispieldaten.
`node tools/test-overview-start.cjs` prüft verzögerte Anmeldung, wiederholte
Abgleich-Antworten und den Erhalt einer fokussierten Trainingseingabe.
`node tools/test-training-resume.cjs` prüft Wiederaufnahme, Abschluss und
Kontotrennung; `node tools/preview-navigation.cjs` prüft Browser-Zurück,
Dialogschließen, Carbon auf allen Planseiten und Offline-Wiederaufnahme
bei 360/412 px und Desktop.

Das Interview fragt Ziel, Erfahrung, Trainingstage (1–5), Zeit (30–120 Minuten),
Gerätevorliebe und bis zu drei geordnete Muskelprioritäten ab. **Ich starte
gerade** setzt die Trainingserfahrung auf 0 Jahre. Der regelbasierte Generator
arbeitet offline mit 35 geprüften Standardübungen. Zeit, Sätze und
Wiederholungen sind editierbare Startvorgaben, keine individuellen
Leistungsprognosen; es werden keine Trainingsgewichte erfunden.

Die elf Vorlagen zeigen beim Antippen eine gemeinsame blaue Karte mit
Überschrift, Tagesangabe, Vorteilen und Einschränkungen. Danach lässt sich die
Vorlage mit Standardübungen oder mit leeren, nach Muskeln beschrifteten Plätzen
öffnen. Im Editor sind Namen, Übungsauswahl, Reihenfolge, Sätze und
Wiederholungen anpassbar. Der Arbeitsentwurf liegt separat auf diesem Gerät
unter `trainingsplan.v1.builderDraft`; auch Schließen und Escape erhalten ihn.
**Entwurf verwerfen** braucht eine Bestätigung.

Die lokal mitgelieferte Bibliothek enthält **521 Kraftübungen und Varianten**,
mit Muskel-/Gerätefiltern und deutscher sowie englischer Suche. Info zeigt
Beschreibung, Nutzen, Einstellung, Cues und Quellen. Tutorials öffnen externe
Anleitungen beziehungsweise eine ausdrücklich benannte Videosuche und
benötigen Internet. 18 kompakte 3D-Geräteillustrationen stellen Gerätetypen dar.
Der Picker steht auch beim Füllen und Tauschen bestehender Übungen bereit.

`studio-data.js` enthält einen aufbereiteten Snapshot der öffentlichen
[wger-Schnittstelle](https://wger.readthedocs.io/en/latest/api/api.html) sowie
Vorlagen und Generator. Jeder Eintrag enthält seine Quelle, Autorangaben und
jeweilige Creative-Commons-Lizenz; diese stehen auch in der Übungsinfo.
Anpassungen und neue Hinweise sind gekennzeichnet. Die wger-Software selbst
wurde nicht übernommen. Kein Katalogabruf und keine KI-API sind beim Benutzen
der App nötig.

Für die Entwicklung: `tools/build-catalog.cjs` verarbeitet den separat
heruntergeladenen Snapshot in `artifacts/wger-source.json` und bindet
`tools/studio-engine.js` ein. `tools/embed-studio.cjs` übernimmt die Studio-UI
aus `tools/studio-ui.js` in `index.html`; beide Ausgaben sind eingecheckt, die
App selbst benötigt keinen Build. Gerätebilder liegen in `assets/studio/`.
Browserprüfung: `node tools/preview-studio.cjs`; echte Offline-Prüfung:
`node tools/test-offline-studio.cjs`. Beide verwenden isolierte Beispieldaten.

Falls der Katalog nicht geladen werden kann, bleiben die Trainingsansicht und
der bisherige manuelle Planassistent erreichbar.

Vier Trainingstage in der Reihenfolge des Plans: **Total Body** (7 Übungen),
**Upper Body** (7), **Lower Body** (5), **Arms & Delts** (6).

Aus dem Foto-Plan herausgenommen: `LegPress` (Lower Body), `DBWristCurl` und
`DBWristExtension` (Arms & Delts). Sie bleiben der App als Übungen bekannt —
ihr bisheriger Verlauf ist im Fortschritt unter *Ersetzte Übungen* weiter
abrufbar und im Trainings-Log korrekt beschriftet.

- `StandingCalfRaise` kommt zweimal vor (Total Body 1×6–8 / Lower Body 2×8–10)
  und wird als zwei getrennte Übungen mit eigener Historie geführt.
- Bei Von-bis-Angaben ist der höhere Wert hinterlegt (CrunchMachine 60 kg,
  OH Triceps 149 kg).
- Das `+` bei HipThrust bedeutet „nächstes Mal steigern" — das steht als
  Hinweis in der Karte. Der Schalter wird bewusst *nicht* vorbelegt: eine
  Vorauswahl zählt als Eingabe und schriebe die Übung sonst in jede
  gespeicherte Einheit, auch ohne Training.

Gewichte werden mit bis zu drei Nachkommastellen erfasst; Komma und Punkt
werden beide akzeptiert.

### Sätze und Wiederholungen

`2×6–8` heisst zwei Sätze mit je 6 bis 8 Wiederholungen. Beide Werte stehen als
antippbare Chips in der Übungskarte: Antippen öffnet ein kleines Eingabefenster,
**Enter** übernimmt, **daneben tippen oder Escape** bricht ab. Bei den
Wiederholungen ergeben zwei gleiche Zahlen eine feste Vorgabe (`3×10`),
vertauschte Eingaben werden sortiert.

Die Änderung gilt nur für diese eine Übung, wird lokal gespeichert, liegt im
JSON-Export und synchronisiert wie der Tausch unter `users/{uid}/state/plan`.

Die Gewichtsangabe daneben bleibt bewusst grau und nicht antippbar — sie ist die
Planvorgabe; das tatsächliche Gewicht wird bei jedem Training im Eingabefeld
protokolliert.

### Verlauf in der Übungskarte

Unter dem Namen stehen die letzten Trainings mit Datum und Gewicht, dazu eine
kleine Kurve und die Veränderung zum vorletzten Mal. Es werden bis zu drei
Einträge gezeigt; passt die Zeile nicht, entfällt zuerst die Kurve, dann der
älteste Eintrag — auf schmalen Displays bleiben so mindestens zwei sichtbar.

### Reihenfolge per Ziehen ändern

Die kleine Ziffer links neben jeder Übung ist gleichzeitig der Anfasser dafür:
**gedrückt halten** (rund 350 ms, ohne dabei zu wischen) aktiviert den
Zug-Modus — die Karte hebt sich sichtbar ab, die Ziffer wird kurz blau. Danach
folgt die Karte senkrecht dem Finger; sobald sie die Mitte der Nachbarkarte
passiert, rückt diese sichtbar an ihren Platz — so lässt sich eine Übung in
einem Zug über mehrere Positionen hinweg verschieben, nicht nur um eine.

Wird dabei nahe an den oberen (unter dem Kopfbereich) oder unteren Rand
(über der Tableiste) gezogen, scrollt die Seite sanft mit — gedrosselt und
in beide Richtungen erprobt, damit es nicht ins Endlose läuft. Die Umordnung
wird dabei nicht angehalten: jeder Scroll-Schritt prüft sofort erneut, ob sich
die gezogene Übung an eine neue Position geschoben hat, auch wenn der Finger
selbst stillhält.

Ein kurzer Tipp ohne Halten oder eine Bewegung, bevor die Haltezeit um ist,
wird als normales Scrollen behandelt — es passiert nichts. Die neue Reihenfolge
wird wie beim Tausch unter `users/{uid}/state/plan` gespeichert, liegt im
JSON-Export und gilt auf allen Geräten.

### Übungen tauschen

Der Tausch-Button (⇄) rechts neben jeder Übung ersetzt sie durch eine andere.
Sätze und Wiederholungen des Slots werden übernommen.

- Die **ersetzte Übung behält ihren Verlauf** und bleibt im Fortschritt unter
  *Ersetzte Übungen* auswählbar. Im Tagesdiagramm taucht sie nicht mehr auf —
  die Farbpalette ist auf acht gleichzeitige Kurven ausgelegt.
- Die **neue Übung startet mit leerem Verlauf** und wird ab der nächsten
  gespeicherten Einheit mitgeschrieben.
- Wird ein **bereits bekannter Name** eingegeben (die Vorschlagsliste im
  Eingabefeld zeigt alle), verwendet die App die vorhandene Übung samt ihrer
  Historie wieder — Zurücktauschen erzeugt also keine Dublette.
- **Original wiederherstellen** setzt den Slot auf die Übung aus dem Foto-Plan
  zurück.

Der angepasste Plan wird lokal gespeichert, liegt im JSON-Export mit drin und
wird bei aktiviertem Sync unter `users/{uid}/state/plan` mitsynchronisiert.

### Mehrere Trainingspläne

MinMax Workout ist ein Trainingsplan wie jeder andere — in der Kopfzeile steht
er als einer von mehreren kleinen Plan-Buttons; ein Antippen wechselt den
aktiven Plan, ab fünf Plänen wird die Reihe seitlich scrollbar. Das **+** am
Ende öffnet jetzt MinMax Studio (siehe oben). Der weiterhin vorhandene manuelle
Assistent dient als Rückfall bei fehlendem Katalog:

1. Name des Plans
2. Trainingstage pro Woche
3. Name je Trainingstag (frei, z. B. „Push")
4. Anzahl Übungen je Tag zum Start

Jeder Tag startet danach mit leeren Übungs-Boxen — nur eine Positionsziffer und
ein grosses **+**. Antippen öffnet ein kleines Fenster für Name, Sätze und
Wiederholungen; danach verhält sich die Box wie jede andere Übungskarte
(Gewicht protokollieren, Senken/Halten/Steigern, Mini-Verlauf, Tauschen,
Ziehen-Umordnen — alles ohne Unterschied zu MinMax Workout). Über **Übung
hinzufügen** am Ende jedes Tages lassen sich jederzeit weitere Boxen ergänzen;
das gilt nur für selbst angelegte Pläne, MinMax' Tage stehen fest im Code.

**Fortschritt** zeigt immer nur Trainingstage und Übungen des gerade aktiven
Plans. Ein Planwechsel öffnet dessen Übersichtskachel; das Antippen eines
Trainingstags öffnet genau diesen Tag.

Übungsnamen dürfen sich zwischen Plänen wiederholen (z. B. „Kniebeugen" in
zwei verschiedenen Plänen) — es entstehen zwei unabhängige Übungen mit
komplett getrennter Historie, kein Zusammenführen über den Namen. Alle Pläne
liegen lokal gespeichert, im JSON-Export und werden bei aktiviertem Sync
zusammen mit dem MinMax-Plan unter `users/{uid}/state/plan` synchronisiert.

## Werte korrigieren

### Letzte Gewichte übernehmen

Der Button oben im Trainingstag füllt die Gewichtsfelder mit dem jeweils
**zuletzt erfassten** Wert der Übung — unabhängig davon, wie viele Einheiten
seither vergangen sind oder ob die Übung zwischendurch ausgelassen wurde.
Gespeichert wird dabei nichts; es ist eine Voreinstellung.

Gefüllt werden **nur leere Felder**. Bereits eingetragene Werte bleiben in
jedem Fall stehen, auch bei mehrfachem Antippen.

Die Zahlen haben drei Zustände:

| Farbe | Bedeutung |
|---|---|
| grau/leer | nichts eingetragen — die Übung landet nicht in der Einheit |
| **blau** | Wert steht da, aber noch nicht bestätigt |
| **grün** | mit dem Haken als absolviert bestätigt |

Der Haken rechts neben dem Feld bestätigt, dass die Übung absolviert ist; ein
weiterer Druck nimmt die Bestätigung zurück. Eine Korrektur an einem grünen
Wert bleibt grün.

**In die Einheit kommt ausschliesslich, was grün ist.** Blaue Werte zählen wie
leere: kein Eintrag, kein Punkt in der Verlaufskurve. Eine ausgelassene Übung
braucht damit keine Aktion — einfach nicht bestätigen. Der Speichern-Button
bleibt inaktiv, solange nichts bestätigt ist, und der Hinweis darunter nennt,
wie viele blaue Werte übergangen werden.

Am Ende des Trainingstags steht links neben „Einheit speichern" ein blauer
**Alle**-Button, der alle eingetragenen blauen Werte auf einmal bestätigt. Er
ist inaktiv, solange es nichts zu bestätigen gibt.

Das gilt auch für den Tendenz-Schalter: eine gesetzte Tendenz ohne Gewicht
(z. B. bei Klimmzügen) blendet den Haken ebenfalls ein und wird erst nach
Bestätigung gespeichert.

Eine Einheit lässt sich jederzeit unvollständig speichern: aufgenommen wird
nur, wofür du ein Gewicht eingetragen oder eine Tendenz gewählt hast. Der
Button zeigt die Anzahl mit, z. B. „Einheit speichern (2)".

Laufende Eingaben überstehen einen Reload mitten im Training — jede
Tastatureingabe wird sofort lokal gesichert und beim Öffnen wiederhergestellt,
inklusive der Tendenz-Schalter.

Beim Speichern prüft die App jede Eingabe gegen das zuletzt erfasste Gewicht
derselben Übung. Weicht ein Wert um **mehr als 30 %** ab, kommt eine
Sicherheitsabfrage mit alter und neuer Zahl — das fängt Tippfehler wie 1125
statt 112,5 ab, bevor sie in der Historie landen. Übungen ohne Vorgeschichte
lösen keine Abfrage aus, weil es nichts zu vergleichen gibt.

Unter *Fortschritt → Trainings-Log* öffnet ein Tipp auf die Überschrift alle
gespeicherten Einheiten, neueste zuerst. Das Log startet geschlossen; erneutes
Antippen schließt es wieder. Die Überschrift ist auch per Tastatur bedienbar.
Eine einzelne Einheit antippen klappt ihre Einträge auf:

- **Gewicht ändern** — direkt im Feld, wird beim Verlassen übernommen. Eine
  leere oder unlesbare Eingabe springt auf den alten Wert zurück.
- **× je Zeile** entfernt einen einzelnen Eintrag. War es der letzte, verschwindet
  die Einheit ganz.
- **Ganze Einheit löschen** entfernt sie nach Rückfrage komplett.

Änderungen schlagen sofort auf Miniverlauf und Diagramm durch. Bei aktivem Sync
werden Löschungen mit übertragen, statt vom anderen Gerät zurückzukehren.

## Diagramm-Farben

### Eigene Farben und Looks

Über den Farbbutton öffnet sich „Farben & Looks“. Farbsets ändern Hintergrund
und Übungsboxen gemeinsam mit einem Klick. „Diesen Look merken“ speichert die
Kombination als einen von bis zu acht Lieblingslooks.

Unter „Einzelfarbe“ wählt man Hintergrund oder Übungsboxen. Hex-Werte (auch
dreistellig) und getrennte Regler mit Zahlenfeldern für Farbton, Sättigung und
Helligkeit ermöglichen eine genaue Auswahl. Die Vorschau verändert noch nicht
die App; erst „Farbe übernehmen“ speichert die Auswahl. Zu dunkle Farben zeigen
vorher ausdrücklich die aufgehellte Variante für den dunklen Text der App.
Die letzten zwölf übernommenen Farben lassen sich per Klick wiederverwenden.

Farben, Favoriten und zuletzt verwendete Farben bleiben auf diesem Gerät
gespeichert. „Zurücksetzen“ stellt den Standardlook wieder her; Favoriten und
Farbverlauf bleiben erhalten.

### Verlaufskurven

Die kompakte Diagrammkarte nutzt eine 180 px hohe Zeichenfläche. Die Legende
zeigt vollständige Übungsnamen in etwa halb so hohen Chips (24 px) mit einem
Rahmen in der jeweiligen Kurvenfarbe. Antippen blendet die Kurve aus oder ein;
ausgeblendete Übungen erhalten einen gestrichelten, gedämpften Rahmen. Die
Darstellung wird mit `node tools/preview.cjs` bei 360/412 px und Desktop geprüft,
einschließlich Aufklappen des Logs, Tastaturbedienung und Gewichtskorrektur.

Die Verlaufskurven nutzen eine achtstufige kategoriale Palette, die in hellem
und dunklem Modus gegen Rot-/Grünschwäche geprüft ist (Protanopie und
Deuteranopie, ΔE ≥ 8 in OKLab). Die Farbe hängt an der Übung, nicht an ihrer
Position — das Ausblenden einer Kurve über die Legende färbt die übrigen nicht
um. Drei Farben liegen im hellen Modus unter 3:1 Kontrast; die Tabellenansicht
unter dem Diagramm hält jeden Wert auch ohne Farberkennung lesbar.

## Lokal gegen den Firebase-Emulator testen

```sh
npx firebase emulators:start --project demo-trainingsplan --only auth,firestore
npx http-server -p 8099 .
```

Dann `http://127.0.0.1:8099/index.html?emulator=1` öffnen. Der Emulator-Hook
greift ausschliesslich auf `localhost`/`127.0.0.1` und nur mit `?emulator=1`.
