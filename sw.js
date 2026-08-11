const CACHE = "trainingsplan-v2";
const ASSETS = [
  "./", "./index.html", "./firebase-config.js", "./vendor/firebase.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-maskable.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
        hit || fetch(event.request).then((res) => {
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
  event.respondWith(
    fetch(event.request)
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
