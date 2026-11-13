const C = 'ringflip-v3';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.json', 'icon.svg'])).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const path = url.pathname;
  const isDoc =
    e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    path.endsWith('/') ||
    path.endsWith('/index.html') ||
    /\/index\.html$/.test(path);
  if (isDoc) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('index.html') || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      });
    })
  );
});
