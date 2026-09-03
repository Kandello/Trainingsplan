const CACHE = "trainingsplan-v3";
const ASSETS = [
  "./", "./index.html", "./firebase-config.js", "./vendor/firebase.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-maskable.svg"
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Firestore/Auth sprechen ihr eigenes Protokoll (Long-Polling, Token-Refresh)
  // und dürfen nicht abgefangen werden. Ebenso alles andere von fremden Hosts.
  if (url.origin !== self.location.origin) return;

  // Das gebündelte SDK ändert sich nur bei einem Update: cache-first.
  if (url.pathname.endsWith("/vendor/firebase.js")) {
    event.respondWith(
      caches.match(event.request).then((hit) =>
        hit || fetch(event.request.url, { cache: "reload" }).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          }
          return res;
        })
      )
    );
    return;
  }

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
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html")))
  );
});
