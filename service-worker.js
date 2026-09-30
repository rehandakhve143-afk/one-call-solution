const OCS_CACHE='ocs-shell-v24';
const OCS_SHELL=[
  './',
  './index.html',
  './property.html',
  './home-services.html',
  './service-provider.html',
  './app-version.json',
  './assets/ocs-home.css',
  './assets/ocs-logo-mark.svg',
  './assets/home-services-poster.jpg'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(OCS_CACHE)
      .then(cache=>Promise.allSettled(OCS_SHELL.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==OCS_CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(OCS_CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
          return res;
        })
        .catch(async()=>{
          return (await caches.match(req,{ignoreSearch:true})) || (await caches.match('./index.html',{ignoreSearch:true})) || Response.error();
        })
    );
    return;
  }

  if(url.origin===location.origin && url.pathname.endsWith('/app-version.json')){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(OCS_CACHE).then(cache=>cache.put('./app-version.json',copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match('./app-version.json',{ignoreSearch:true}))
    );
    return;
  }

  if(url.origin===location.origin){
    event.respondWith(
      caches.match(req,{ignoreSearch:true}).then(cached=>{
        const fresh=fetch(req).then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(OCS_CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
          }
          return res;
        }).catch(()=>cached);
        return cached||fresh;
      })
    );
  }
});
