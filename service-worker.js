const CACHE_NAME='healthops-v3-0-modular-1';
const ASSETS=['./','./index.html','./manifest.json','./css/styles.css','./js/app.js','./js/core/parser.js','./js/core/storage.js','./js/core/medication-engine.js','./js/core/operational-engine.js','./js/core/health-engine.js','./js/ui/dashboard.js','./js/ui/schedule.js','./js/ui/medications.js','./js/ui/debug.js','./data/medications.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS).catch(()=>null))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)).catch(()=>{}); return r;}).catch(()=>caches.match(e.request)));});
