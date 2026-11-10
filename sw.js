// CORY-X — service worker (v4.3, A1, A4) : ouverture hors ligne. Aucune donnée personnelle ici :
// il ne met en cache que les fichiers de l'app, jamais les réponses du pont ou d'Ollama.
const VERSION = "d564bf766489";
const CACHE = "coryx-" + VERSION;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  // pas de skipWaiting automatique : la page propose « Recharger » (cas limite 16)
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("coryx-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "skip") self.skipWaiting();
  if (e.data && e.data.type === "version") e.source && e.source.postMessage({ type: "version", version: VERSION });
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // pont Google, Ollama : jamais en cache
  if (url.pathname.endsWith("/CORY-X.html")) return; // version fichier : toujours depuis le réseau
  const key = req.mode === "navigate" ? "./index.html" : req;
  e.respondWith(caches.open(CACHE).then((c) => c.match(key).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "/")) || a === "./")) c.put(req, res.clone());
    return res;
  }))));
});
