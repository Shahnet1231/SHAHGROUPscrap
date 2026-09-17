// SHAH Software Solutions — minimal PWA service worker.
//
// Maqsad sirf itna hai: agar net na ho to app ka "shell" (index.html,
// manifest, icons) khul jaye taake bilkul blank/safed screen na aaye.
// Ye Apps Script backend (Sale/Purchase/Sync ki asal API calls) ko
// BILKUL nahi chhedta — wo hamesha seedha network se jaati hain, taake
// kabhi bhi purana/stale data ghalti se "cached" hoke na dikh jaye.

const CACHE_NAME = 'shah-app-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sirf apni hi site ke GET requests handle karte hain — Apps Script
  // (script.google.com) jaisi doosri origin ki calls ko haath nahi
  // lagate, wo seedha network se hi jayengi jaisa pehle jaati thi.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
