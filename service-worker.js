const CACHE_NAME='healthops-v6-2-2-cache-reset';
const ASSETS=['./','./index.html','./manifest.json','./app.js','./css/styles.css','./data/medications.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  event.respondWith(fetch(req).then(res=>{
    const copy=res.clone();
    caches.open(CACHE_NAME).then(c=>c.put(req, copy)).catch(()=>{});
    return res;
  }).catch(()=>caches.match(req).then(cached=>cached || caches.match('./index.html'))));
});
