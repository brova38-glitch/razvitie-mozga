// v3 — network-first for pages and the SW itself, cache-first only for hashed assets
const VERSION = "rm-v5";
const BASE = self.registration.scope;
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll([BASE, BASE + "manifest.webmanifest", BASE + "icon-192.png"]).catch(() => {})));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const netFirst = (req, key) => fetch(req, { cache: "no-store" }).then((res) => {
  if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(key || req, cp)); }
  return res;
}).catch(() => caches.match(key || req).then((hit) => hit || caches.match(BASE)));
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || !r.url.startsWith(BASE)) return;
  const u = new URL(r.url);
  if (r.mode === "navigate" || u.pathname.endsWith("/index.html") || u.pathname.endsWith("/")) { e.respondWith(netFirst(r, BASE)); return; }
  if (u.pathname.includes("/assets/")) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(r, cp)); } return res; })));
    return;
  }
  e.respondWith(netFirst(r));
});
