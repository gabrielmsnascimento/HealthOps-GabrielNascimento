const CACHE_NAME='healthops-v2-2-operational-health';
const ASSETS=['./','./index.html','./manifest.json','./README.md'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request).then(r=>{const c=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,c)).catch(()=>null);return r}).catch(()=>caches.match(event.request)));});
