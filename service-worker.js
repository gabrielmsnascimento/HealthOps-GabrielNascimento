const CACHE='healthops-v3-2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('message',e=>{
  const data=e.data||{};
  if(data.type==='notify'){
    self.registration.showNotification(data.title||'HealthOps',{body:data.body||'',badge:'./manifest.json'});
  }
});
