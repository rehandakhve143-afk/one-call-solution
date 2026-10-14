const OCS_CACHE='ocs-shell-v48';
const OCS_SHELL=[
  './',
  './index.html',
  './property.html',
  './home-services.html',
  './service-provider.html',
  './transport.html',
  './transport-driver.html',
  './driver-service.html',
  './driver-provider.html',
  './payout-details.html',
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
    const isServicePage=/\/(home-services|customer-services)\.html$/i.test(url.pathname);
    event.respondWith(
      fetch(req,{cache:isServicePage?'reload':'default'})
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
    // The app is updated frequently. Always request current HTML/JS/CSS online;
    // stale-while-revalidate made phones repeatedly display old posting forms.
    const isAppCode=/\.(?:html|js|mjs|css)$/i.test(url.pathname);
    if(isAppCode){
      event.respondWith(
        fetch(req,{cache:'no-cache'})
          .then(res=>{
            if(res&&res.ok){
              const copy=res.clone();
              caches.open(OCS_CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
            }
            return res;
          })
          .catch(async()=> (await caches.match(req)) ||
                             (await caches.match(req,{ignoreSearch:true})) ||
                             Response.error())
      );
      return;
    }
    // Images and other media can load quickly from cache while refreshing.
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


// Browser-delivered push messages: private contents never appear on the lock screen.
// No automatic permission prompts; registration is initiated by an explicit user tap.
self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?event.data.json():{}}catch(e){}
 const booking=typeof payload.booking_id==='string'&&/^[0-9a-f-]{36}$/i.test(payload.booking_id)?payload.booking_id:null;
 const kind=String(payload.type||'');
 const target=kind.startsWith('quote')&&booking
  ?'my-discussions.html?booking='+encodeURIComponent(booking)
  :'index.html';
 const url=new URL(target,self.registration.scope).href;
 event.waitUntil(self.registration.showNotification('One Call Solution',{
  body:'Your OCS account has a new update. Open the app to view details.',
  icon:new URL('assets/ocs-logo-mark.svg',self.registration.scope).href,
  badge:new URL('assets/ocs-logo-mark.svg',self.registration.scope).href,
  tag:'ocs-update-'+String(payload.notification_id||'general').slice(0,40),
  data:{url},
  renotify:false
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const u=event.notification.data?.url||new URL('index.html',self.registration.scope).href;
 if(!u.startsWith(self.registration.scope))return;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const match=clients.find(c=>c.url.startsWith(self.registration.scope));
  if(match){await match.focus();if('navigate' in match)await match.navigate(u);return}
  return self.clients.openWindow(u);
 }));
});
