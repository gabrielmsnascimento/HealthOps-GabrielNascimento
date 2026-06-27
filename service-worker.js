const CACHE_NAME = 'healthops-v3-3-2-parser-hotfix';
const ASSETS = ['./','./index.html','./manifest.json','./README.md'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>null)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
    return resp;
  }).catch(() => caches.match(event.request)));
});
