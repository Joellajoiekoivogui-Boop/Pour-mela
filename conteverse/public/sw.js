// Service worker CONTEVERSE : mise en cache pour connexions limitées.
// - Pages : réseau d'abord, repli sur le cache puis sur /hors-ligne.
// - Fichiers statiques (_next/static, icônes, données) : cache d'abord.
// - Articles enregistrés par l'enfant : cache « conteverse-lectures ».
const VERSION = "v1";
const STATIC = `conteverse-static-${VERSION}`;
const PAGES = `conteverse-pages-${VERSION}`;
const SAVED = "conteverse-lectures";
const PRECACHE = ["/", "/hors-ligne", "/explorer", "/guinee", "/bibliotheque", "/histoires", "/data/africa.geojson", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES, SAVED].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/data/");
  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(STATIC).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/hors-ligne")) || Response.error()),
    );
  }
});
