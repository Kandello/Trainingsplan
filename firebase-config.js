/* Konfiguration des Firebase-Projekts für den Geräte-Sync.
 *
 * Firebase Console → Projektübersicht → Web-App (</>) hinzufügen.
 * Das dort angezeigte firebaseConfig-Objekt hier eintragen, committen, pushen.
 *
 * Alternativ lässt sich die Konfiguration direkt in der App einfügen
 * (Sync-Button oben rechts) — dann wird sie nur auf diesem Gerät gespeichert
 * und muss auf jedem weiteren Gerät erneut eingegeben werden.
 *
 * Diese Werte sind keine Geheimnisse: Der Schutz der Daten kommt aus den
 * Firestore-Regeln (firestore.rules), nicht aus dem apiKey.
 */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
