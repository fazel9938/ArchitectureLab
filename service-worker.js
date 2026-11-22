/* Versioned, atomic offline shell. Generated BUILD_ID changes with the package. */
'use strict';
const BUILD_ID='faddb7e552ae0166';
const ASSETS=['index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const ASSET_HASHES={"index.html": "sha256-rIRUwXLboJv3MIOXRhqXqaGhMs7hpKOOlg1ax28BIbI=", "manifest.webmanifest": "sha256-34c+Kd7TWA2OqWQ7U3BPJ5xEvhzwCqkLb5B6AY79EIk=", "icons/icon-192.png": "sha256-5cAN1sCb8je86cjUkMIZpBeaLNGzuM3VvBCu+Cekifs=", "icons/icon-512.png": "sha256-H9WqLbJHXSYzTaeAt7NDaHW/T3TiBUT9zJLGrEJKCsg=", "icons/apple-touch-icon.png": "sha256-ELzFcD9qJFx+fzNdURb9G0PmjyofBZwKFuORimUhwAI="};
const PREFIX='fieldnotes-offline:'+self.registration.scope+':';
const CACHE=PREFIX+BUILD_ID;
const absolute=path=>new URL(path,self.registration.scope).href;
const assetURLs=ASSETS.map(absolute);
const shell=absolute('index.html');
async function downloadShell(){
  const cache=await caches.open(CACHE);
  // Integrity prevents a partial deployment or an old worker caching a newer book.
  await cache.addAll(ASSETS.map(path=>new Request(absolute(path),{cache:'reload',integrity:ASSET_HASHES[path]})));
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    try {
      await downloadShell();
    } catch(error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE') {
    event.waitUntil(self.skipWaiting());
  } else if(event.data?.type==='CACHE_OFFLINE_COPY') {
    event.waitUntil((async()=>{
      try{await downloadShell();event.ports?.[0]?.postMessage({ready:true,build:BUILD_ID});}
      catch{event.ports?.[0]?.postMessage({ready:false,build:BUILD_ID});}
    })());
  } else if(event.data?.type==='GET_OFFLINE_STATUS') {
    event.waitUntil((async()=>{
      const cache=await caches.open(CACHE);
      const present=await Promise.all(assetURLs.map(url=>cache.match(url)));
      event.ports?.[0]?.postMessage({ready:present.every(Boolean),build:BUILD_ID});
    })());
  }
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const isNavigation=request.mode==='navigate';
  const clean=new URL(url);clean.search='';clean.hash='';
  if(!isNavigation&&!assetURLs.includes(clean.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(isNavigation?shell:clean.href);
    return cached||fetch(request);
  })());
});
