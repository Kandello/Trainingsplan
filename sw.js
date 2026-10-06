const CACHE = "trainingsplan-v23";
const ASSETS = [
  "./", "./index.html", "./firebase-config.js?v=08e680b643dd", "./vendor/firebase.js?v=b82c7e203593",
  "./manifest.webmanifest", "./icon.svg", "./icon-maskable.svg",
  "./studio-data.js",
  "./assets/carbon.jpg",
  "./assets/studio/abs.webp",
  "./assets/studio/band.webp",
  "./assets/studio/barbell.webp",
  "./assets/studio/bodyweight.webp",
  "./assets/studio/cable.webp",
  "./assets/studio/calf.webp",
  "./assets/studio/chest.webp",
  "./assets/studio/curl.webp",
  "./assets/studio/dumbbell.webp",
  "./assets/studio/equipment.webp",
  "./assets/studio/extension.webp",
  "./assets/studio/hip.webp",
  "./assets/studio/kettlebell.webp",
  "./assets/studio/legpress.webp",
  "./assets/studio/pecdeck.webp",
  "./assets/studio/pulldown.webp",
  "./assets/studio/row.webp",
  "./assets/studio/shoulder.webp"
];

self.addEventListener("install", (event) => {
  // c.addAll() fuehrt intern fetch() mit Standard-Cache-Modus aus und kann so
  // selbst beim Erstbefuellen bereits veraltete, aus dem HTTP-Cache bediente
  // Antworten einlagern. cache:"reload" erzwingt fuer jede Anfrage einen
  // echten Netzwerk-Roundtrip.
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: "reload" })
          .then((res) => (res.ok ? c.put(url, res) : null))
          .catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("trainingsplan-v") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Firestore/Auth sprechen ihr eigenes Protokoll (Long-Polling, Token-Refresh)
  // und dürfen nicht abgefangen werden. Ebenso alles andere von fremden Hosts.
  if (url.origin !== self.location.origin) return;

  // Eigene Dateien: network-first, damit ein Deploy ankommt — Cache als Rückfall.
  // fetch(event.request) allein bleibt "network-first" nur dem Namen nach: der
  // Cache-Modus einer normalen Anfrage ist "default" und darf vom gewoehnlichen
  // HTTP-Cache des Browsers bedient werden, ganz ohne Roundtrip zum Server —
  // GitHub Pages' Cache-Control-Header reichen dafuer aus. cache:"no-store"
  // erzwingt echtes Netzwerk. Ueber die URL (statt event.request) neu
  // angefragt, weil sich aus einer Navigations-Request (mode:"navigate") kein
  // neues Request-Objekt mit geaendertem init konstruieren laesst.
  event.respondWith(
    fetch(event.request.url, { cache: "no-store" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(event.request);
        if (hit) return hit;
        // Never serve HTML in place of a missing JavaScript module.
        if (event.request.mode === "navigate") {
          return (await caches.match("./index.html")) || Response.error();
        }
        return Response.error();
      })
  );
});
