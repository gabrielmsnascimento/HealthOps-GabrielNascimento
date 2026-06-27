const CACHE_NAME = 'healthops-v2-0-alpha-6-clean';
const ASSETS = ['./','./index.html?v=2.0-alpha.6-clean','./manifest.json'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>null));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith((async()=>{
    try {
      const fresh = await fetch(event.request, {cache:'no-store'});
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(()=>{});
      return fresh;
    } catch(e) {
      return (await caches.match(event.request)) || (await caches.match('./index.html?v=2.0-alpha.6-clean'));
    }
  })());
});
