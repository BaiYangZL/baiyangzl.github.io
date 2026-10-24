// These exact-URL, same-origin public static files have identical bytes across Origin headers.
const siteRoots = new Set(["README.md","approach-road.js","arrival-sw.js","assets","dialog.js","gate-story.js","guard-review.js","index.html","invite.js","journey.js","map-art.js","mascot.js","painted-flora.js","painted-gate.js","pixel-guard.js","preview-api.js","sample.css","sample.js","tavern","tavern-transition.js","vendor","weather-fx.js"]);
// Caches the tavern files actually requested by Cocos, scoped to this GitHub Pages project.
const VERSION = 'walk-speed-20261024';
const PREFIX = 'belvedere-domain-tavern-';
const GATE_PREFIX = 'belvedere-domain-gate-';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const day = () => new Date().toLocaleDateString('sv-SE');
const versionPrefix = `${PREFIX}${VERSION}-`;
let activeName;
async function cacheName() {
  if (activeName) return activeName;
  const candidates = (await caches.keys()).filter(key => key.startsWith(versionPrefix)).map(key => ({
    key, at: Date.parse(key.slice(versionPrefix.length)) || Number(key.slice(versionPrefix.length))
  })).filter(item => Number.isFinite(item.at) && Date.now() - item.at >= 0 && Date.now() - item.at < WEEK_MS);
  candidates.sort((a, b) => b.at - a.at);
  activeName = candidates[0]?.key || `${versionPrefix}${day()}`;
  return activeName;
}
const tavernPath = new URL('tavern/', self.registration.scope).pathname;
const rootPath = new URL('./', self.registration.scope).pathname;
const isSitePath = pathname => pathname === rootPath || siteRoots.has(pathname.slice(rootPath.length).split('/')[0]);
const gateName = async () => (await cacheName()).replace(PREFIX, GATE_PREFIX);
let warned = false;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'KEEP_WEEK') return;
  event.waitUntil((async () => {
    const current = await cacheName();
    const gateCurrent = await gateName();
    for (const key of await caches.keys()) if ((key.startsWith(PREFIX) && key !== current) || (key.startsWith(GATE_PREFIX) && key !== gateCurrent)) await caches.delete(key);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_GATE') return;
  event.waitUntil((async () => {
    const cache = await caches.open(await gateName());
    const urls = [self.registration.scope, ...(event.data.urls || [])];
    await Promise.all(urls.map(async value => {
      const url = new URL(value, self.registration.scope);
      if (url.origin !== self.location.origin || (!url.pathname.startsWith(rootPath) || !isSitePath(url.pathname)) || url.pathname.startsWith(tavernPath)) return;
      const key = url.pathname === rootPath ? self.registration.scope : url.href;
      if (await cache.match(key, {ignoreVary: true})) return;
      try {
        const response = await fetch(url.href, {cache: 'force-cache'});
        if (response.ok) await cache.put(key, response);
      } catch { /* Gate remains available online if caching fails. */ }
    }));
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || (!url.pathname.startsWith(rootPath) || !isSitePath(url.pathname))) return;
  if (!url.pathname.startsWith(tavernPath)) {
    event.respondWith((async () => {
      const cache = await caches.open(await gateName());
      const key = request.mode === 'navigate' ? self.registration.scope : request;
      if (request.mode !== 'navigate') {
        const saved = await cache.match(key, {ignoreVary: true});
        if (saved) return saved;
      }
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(key, response.clone()).catch(() => {});
        return response;
      } catch {
        const saved = await cache.match(key, {ignoreVary: true});
        if (saved) return saved;
        throw new Error('城门页面不在缓存中');
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(await cacheName());
    const saved = await cache.match(request, {ignoreVary: true});
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone()).catch(async () => {
      if (warned) return;
      warned = true;
      for (const client of await self.clients.matchAll()) client.postMessage({type: 'CACHE_LIMITED'});
    });
    return response;
  })());
});


