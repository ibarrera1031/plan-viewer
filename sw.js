// Keeps the Plan Viewer page on the device so it opens with no signal. The plans themselves are in IndexedDB
// (index.html); this only caches the page files. Answers from the cache right away and refreshes it in the background,
// so a new version of the page shows on the next open. Change VERSION to force a clean refresh.
// GitHub lets browsers reuse a file for 10 minutes, so these fetches skip the browser's own cache (otherwise an
// update can save the old copy of a file, as happened with logo.png).
const VERSION = 'pv-20';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './logo.png', './bg-light.jpg', './bg-dark.jpg', './bg-blueprint.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // script calls go straight out
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req.url, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(key, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    return (await fresh) || new Response('Offline and this page is not saved yet.', { status: 503 });
  }));
});
