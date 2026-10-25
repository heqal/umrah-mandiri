/* Service worker: membuat aplikasi bisa dibuka offline.
   Strategi: ambil dari jaringan dulu (agar hasil edit langsung tampil), cadangkan ke cache,
   dan pakai cache bila tidak ada sinyal. Ubah VERSION bila ingin memaksa cache baru. */
var VERSION = "umrah-v1";
var ASSETS = ["./", "index.html", "css/theme.css", "css/style.css", "js/app.js", "data/content.js", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone();
    caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match("index.html"); }); }));
});
