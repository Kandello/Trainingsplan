# Pausentimer – Design

## Ziel
Satzpausen pro Übung mit möglichst wenig Interaktion: im Normalfall **ein Tipp**.
Die Pausendauer hängt von Übung, Gewicht und Wiederholungen ab und wird daher
je Übung gespeichert – trainings- und geräteübergreifend.

Nicht-Ziele: automatischer Start (Pausen zwischen Übungen sind unterschiedlich
lang), Satz-Zählung („Satz fertig“), Vorwarnung bei 10 s.

## Bedienung (vom Nutzer entschieden)
- Jede Übungskarte trägt im Kopf ein kleines Uhrsymbol `⏱ 1:30` (gespeicherte Zeit).
- **Tippen** startet die Pause sofort mit der gespeicherten Zeit.
- **Gedrückt halten** öffnet die Einstellung. Ist noch keine Zeit gespeichert,
  öffnet schon der erste Tipp die Einstellung.
- Die gewählte Zeit wird gespeichert und gilt ab dann in jedem Training.
- Während die Pause läuft, zeigt das Uhrsymbol der Übung die Restzeit (`⏱ 0:42`);
  erneutes Tippen bricht ab.
- Anzeige: eine schmale Linie läuft am Bildschirmrand entlang. Start **oben Mitte**,
  im **Uhrzeigersinn**, sie wächst, bis das Rechteck geschlossen ist.
- Ende: kurzer, unaufdringlicher Ton und **1 s Vibration**. Keine Vorwarnung.

## Festlegungen des Umsetzers (korrigierbar)
- Einstellung als kleines Bottom-Sheet: 60 · 90 · 120 · 180 s, dazu −15 / +15;
  Bereich 15–600 s. Eine Auswahl speichert und startet sofort.
- Speicherort: Feld `rest` (Sekunden) im bestehenden Übungs-Spezifikations-
  speicher (`exSpec`), der schon mit dem Konto synchronisiert wird.
- Es läuft höchstens ein Timer; ein neuer Start ersetzt den laufenden.
- Zeitbasis ist der Endzeitpunkt, nicht ein Zähler: Die Linie bleibt auch nach
  Bildschirmsperre, App-Wechsel oder Neuladen korrekt. Der Endzeitpunkt wird
  lokal gesichert.
- Linie: festes SVG-Overlay über allem, 3 px, Akzentfarbe, folgt den abgerundeten
  Bildschirmecken näherungsweise, fängt keine Berührungen ab.
- Ton: kurzer Sinuston über Web Audio, leise; folgt der Medienlautstärke.
- Während eines laufenden Trainings bleibt der Bildschirm an (Wake Lock).
- „Bewegung reduzieren“: Linie läuft trotzdem (sie ist Information), ohne
  zusätzliche Effekte.

## Grenzen
- Im Hintergrund oder bei gesperrtem Bildschirm drosselt Android Webseiten;
  Ton/Vibration kommen dann erst beim Zurückkehren. Durch Wake Lock bleibt die
  App im Training im Vordergrund. Ein garantierter Hintergrund-Alarm bräuchte
  Server-Push und ist bewusst nicht vorgesehen.
