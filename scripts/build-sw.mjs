/**
 * Génère le service worker après `next build` à partir du contenu réel de `out/`.
 *
 * Le worker précache toutes les pages, tous les fichiers statiques et toutes
 * les illustrations. La version du cache est un condensé du contenu : chaque
 * nouvelle compilation crée un cache neuf et supprime l'ancien.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "out");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function toUrl(relative) {
  return `/${relative.split(path.sep).join("/")}`;
}

const files = (await walk(out)).filter((file) => path.basename(file) !== "sw.js");
if (files.length === 0) {
  console.error("[pwa] Le dossier out/ est vide : lancez `next build` d'abord.");
  process.exit(1);
}

const urls = new Set();
const digest = createHash("sha1");

for (const file of files.sort()) {
  const relative = path.relative(out, file);
  const buffer = await readFile(file);
  digest.update(relative);
  digest.update(buffer);

  if (path.basename(file) === "index.html") {
    const directory = path.dirname(relative);
    urls.add(directory === "." ? "/" : `${toUrl(directory)}/`);
  } else {
    urls.add(toUrl(relative));
  }
}

const version = digest.digest("hex").slice(0, 12);
const precache = [...urls].sort();

const worker = `/* Service worker AutoÉcole — généré automatiquement, ne pas modifier. */
const VERSION = "autoecole-${version}";
const CACHE = VERSION;

// Toutes les pages, ressources et illustrations de l'application.
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const queue = PRECACHE.slice();
      async function fill() {
        while (queue.length > 0) {
          const url = queue.shift();
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response && response.ok) await cache.put(url, response);
          } catch (error) {
            // Une ressource manquante ne doit pas empêcher l'installation.
          }
        }
      }
      await Promise.all(Array.from({ length: 6 }, fill));
      // Première installation : on prend la main tout de suite.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("autoecole-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "SKIP_WAITING" || (data && data.type === "SKIP_WAITING")) {
    self.skipWaiting();
  }
});

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors ligne</title><body style="font-family:system-ui;padding:2rem;background:#f4f6fa;color:#0b1220"><h1>Hors ligne</h1><p>Cette page n\\'a pas encore été enregistrée. Reconnectez-vous une fois pour la rendre disponible.</p></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function respond(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const url = new URL(request.url);

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        const copy = response.clone();
        // Les pages statiques ne dépendent pas de la requête : on range la
        // réponse sous l'URL sans paramètres pour éviter les doublons.
        const key = new Request(url.origin + url.pathname);
        caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => undefined);
      }
      return response;
    });

  if (cached) {
    // Cache d'abord, mise à jour silencieuse en arrière-plan.
    network.catch(() => undefined);
    return cached;
  }

  try {
    return await network;
  } catch (error) {
    if (request.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
      return offlinePage();
    }
    return new Response("", { status: 504, statusText: "Hors ligne" });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  event.respondWith(respond(request));
});
`;

await writeFile(path.join(out, "sw.js"), worker, "utf8");

const total = files.reduce(async (sum, file) => (await sum) + (await stat(file)).size, Promise.resolve(0));
const megabytes = ((await total) / 1024 / 1024).toFixed(1);
console.log(`[pwa] Service worker ${version} — ${precache.length} ressources précachées (${megabytes} Mo).`);
