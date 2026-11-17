/* Service worker AutoÉcole — cache de l'application et des illustrations. */
const VERSION = "autoecole-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

const CORE = ["/", "/entrainement/", "/examen/", "/revisions/", "/statistiques/", "/cours/", "/reglages/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(CORE.map((url) => new Request(url, { cache: "reload" }))))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isQuestionImage(url) {
  return url.pathname.startsWith("/questions/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord, cache en secours (puis accueil).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match("/");
          if (home) return home;
          return new Response(
            "<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><title>Hors ligne</title><body style=\"font-family:system-ui;padding:2rem;background:#f4f6fa;color:#0b1220\"><h1>Hors ligne</h1><p>Cette page n'a pas encore été enregistrée. Reconnectez-vous une fois pour la rendre disponible.</p></body></html>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }),
    );
    return;
  }

  // Illustrations et ressources statiques : cache d'abord, mise à jour en arrière-plan.
  if (isQuestionImage(url) || url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".webmanifest")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy)).catch(() => undefined);
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Le reste : réseau, avec repli sur le cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
