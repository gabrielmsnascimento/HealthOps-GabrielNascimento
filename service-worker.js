const CACHE_NAME = 'healthops-v1-0-beta-7-full';
const ASSETS = [
  './', './index.html', './manifest.json', './README.md',
  './css/styles.css', './js/app.js',
  './js/engines/parser-ifn.js', './js/engines/operational-engine.js',
  './js/engines/regulatory-engine.js', './js/engines/perdiem-engine.js',
  './js/engines/health-engine.js', './js/engines/medication-engine.js',
  './js/engines/storage-engine.js', './js/data/activity-catalog.js',
  './js/data/medication-catalog.js', './js/ui/components.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
