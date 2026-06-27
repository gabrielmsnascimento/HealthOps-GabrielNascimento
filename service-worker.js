const CACHE_NAME = 'healthops-v5-5-parser-real';
const ASSETS = ['./','./index.html','./manifest.json','./service-worker.js'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => { if (event.request.method === 'GET') cache.put(event.request, copy).catch(() => null); });
    return res;
  }).catch(() => caches.match(event.request)));
});
