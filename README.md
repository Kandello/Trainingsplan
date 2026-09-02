# MinMax Workout — Trainingsdokumentation

Mobile-first Web-App zum Erfassen der Trainingsgewichte und zum Verfolgen des
Fortschritts. Läuft offline und gleicht die gespeicherten Einheiten zwischen
Handy und PC ab.

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

Ohne Einrichtung läuft die App rein lokal. Für den Abgleich zwischen
Android-Handy und PC-Firefox einmalig ein kostenloses Firebase-Projekt anlegen.
Dieselbe Anleitung steht auch in der App hinter dem Sync-Button oben rechts.

Die Beschriftungen der Firebase-Konsole ändern sich gelegentlich; deshalb steht
jeweils dabei, wo der Punkt sitzt.

**1. Projekt anlegen**
- [console.firebase.google.com](https://console.firebase.google.com) öffnen.
- „Projekt erstellen" → Name vergeben, z. B. `trainingsplan`.
- Google Analytics kann abgewählt werden, wird nicht gebraucht.

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
npm i firebase@10.14.1 esbuild
cat > entry.js <<'EOF'
export { initializeApp, getApps, getApp } from "firebase/app";
export { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect,
         getRedirectResult, signOut, GoogleAuthProvider, connectAuthEmulator,
         signInWithCredential } from "firebase/auth";
export { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
         collection, doc, setDoc, deleteDoc, deleteField, onSnapshot,
         serverTimestamp, connectFirestoreEmulator } from "firebase/firestore";
EOF
npx esbuild entry.js --bundle --format=esm --minify --target=es2020 \
  --outfile=vendor/firebase.js
```

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

Zusätzlich sichert *Daten exportieren* im Fortschritt-Tab den gesamten Verlauf
als JSON; der Import ergänzt bestehende Einheiten, statt sie zu überschreiben.

## Trainingsplan

Vier Trainingstage in der Reihenfolge des Plans: **Total Body** (6 Übungen),
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

Unter *Fortschritt → Trainings-Log* stehen alle gespeicherten Einheiten,
neueste zuerst. Eine Einheit antippen klappt sie auf:

- **Gewicht ändern** — direkt im Feld, wird beim Verlassen übernommen. Eine
  leere oder unlesbare Eingabe springt auf den alten Wert zurück.
- **× je Zeile** entfernt einen einzelnen Eintrag. War es der letzte, verschwindet
  die Einheit ganz.
- **Ganze Einheit löschen** entfernt sie nach Rückfrage komplett.

Änderungen schlagen sofort auf Miniverlauf und Diagramm durch. Bei aktivem Sync
werden Löschungen mit übertragen, statt vom anderen Gerät zurückzukehren.

## Diagramm-Farben

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
