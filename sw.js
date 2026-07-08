// Service worker minimal — satisfait les critères d'installation (Add to Home Screen)
// sans mettre en cache les données Firebase (toujours en direct depuis le réseau).
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  // Simple passthrough réseau — pas de cache offline pour l'instant.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
