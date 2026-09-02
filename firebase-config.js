/* Konfiguration des Firebase-Projekts für den Geräte-Sync.
 *
 * Firebase Console → Einstellungen → Projekteinstellungen → „Meine Apps“ →
 * bei der Web-App unter „SDK-Einrichtung und -Konfiguration“ auf
 * „Konfiguration“ umschalten. Das dort gezeigte Objekt steht hier.
 *
 * Alternativ lässt sich die Konfiguration direkt in der App einfügen
 * (Sync-Button oben rechts) — dann gilt sie nur auf dem jeweiligen Gerät.
 *
 * Diese Werte sind keine Geheimnisse: Ein Firebase-Web-apiKey identifiziert
 * das Projekt, er berechtigt zu nichts. Der Schutz der Daten kommt aus den
 * Firestore-Regeln (firestore.rules) und der Liste der autorisierten Domains.
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJiHRnz7ummzSOCA8zb3D1EE_47eT8gOk",
  authDomain: "minmax-workouttracker.firebaseapp.com",
  projectId: "minmax-workouttracker",
  storageBucket: "minmax-workouttracker.firebasestorage.app",
  messagingSenderId: "833112401239",
  appId: "1:833112401239:web:21d4d4593a339d2bf7ca12"
};
