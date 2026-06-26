const CACHE='healthops-v0.5.5';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys(); await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))); await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;
 e.respondWith((async()=>{
  try{
   const fresh=await fetch(e.request);
   const cache=await caches.open(CACHE);
   if(new URL(e.request.url).origin===location.origin) cache.put(e.request,fresh.clone());
   return fresh;
  }catch(err){
   return (await caches.match(e.request)) || Response.error();
  }
 })());
});
self.addEventListener('message',e=>{const d=e.data||{}; if(d.type==='notify') self.registration.showNotification(d.title||'HealthOps',{body:d.body||'',tag:d.tag||'healthops'});});
