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
Android-Handy und PC-Firefox einmalig ein kostenloses Firebase-Projekt anlegen:

1. [console.firebase.google.com](https://console.firebase.google.com) → Projekt anlegen.
2. **Firestore Database** → *Create database* → Produktionsmodus.
3. **Firestore → Rules** → Inhalt von `firestore.rules` einfügen → *Veröffentlichen*.
4. **Authentication → Sign-in method** → *Google* aktivieren.
5. **Authentication → Settings → Authorized domains** → die GitHub-Pages-Domain
   eintragen (z. B. `kandello.github.io`). Ohne diesen Schritt schlägt die
   Anmeldung mit `auth/unauthorized-domain` fehl.
6. **Projektübersicht → Web-App (`</>`)** hinzufügen und das `firebaseConfig`
   kopieren — entweder in `firebase-config.js` eintragen und pushen, oder in der
   App über den Sync-Button oben rechts einfügen (dann nur auf diesem Gerät).

Danach auf beiden Geräten mit demselben Google-Konto anmelden. Der Chip oben
rechts zeigt den Zustand: *Sync aktiv*, *Wartet* (offline, wird nachgeholt) oder
*Sync-Fehler* mit Klartext-Ursache.

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
**Upper Body** (7), **Lower Body** (6), **Arms & Delts** (8).

- `StandingCalfRaise` kommt zweimal vor (Total Body 1×6–8 / Lower Body 2×8–10)
  und wird als zwei getrennte Übungen mit eigener Historie geführt.
- Bei Von-bis-Angaben ist der höhere Wert hinterlegt (CrunchMachine 60 kg,
  OH Triceps 149 kg).
- Das `+` bei HipThrust bedeutet „nächstes Mal steigern" — der Schalter steht
  dort beim ersten Öffnen auf *Steigern*.

Gewichte werden mit bis zu drei Nachkommastellen erfasst; Komma und Punkt
werden beide akzeptiert.

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
