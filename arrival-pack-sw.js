// Caches the tavern files actually requested by Cocos, scoped to this GitHub Pages project.
const VERSION = 'room-network-packs-20261025';
const PREFIX = 'belvedere-tavern-';
const GATE_PREFIX = 'belvedere-gate-';
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
const gateName = async () => (await cacheName()).replace(PREFIX, GATE_PREFIX);
const packPath = new URL('tavern/packs/', self.registration.scope).pathname;
const contentType = url => ({js:'application/javascript',json:'application/json',png:'image/png',webp:'image/webp',wasm:'application/wasm',css:'text/css',html:'text/html'})[url.split('.').pop()] || 'application/octet-stream';
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
async function unpackIntoCache(info, cache) {
  const marker = new URL(`tavern/packs/ready-${info.sha256}`, self.registration.scope);
  if (await cache.match(marker)) return 0;
  const source = new URL(`tavern/packs/${info.filename}`, self.registration.scope);
  const response = await fetch(source, {cache:'force-cache'});
  if (!response.ok) throw Error(`Pack HTTP ${response.status}: ${info.filename}`);
  const archive = await response.arrayBuffer();
  if (hex(await crypto.subtle.digest('SHA-256', archive)) !== info.sha256) throw Error('Pack checksum mismatch: '+info.filename);
  const view = new DataView(archive);
  const headerLength = view.getUint32(0, true);
  const dataStart = 4 + headerLength;
  if (dataStart > archive.byteLength) throw Error('Invalid pack header');
  const entries = JSON.parse(new TextDecoder().decode(new Uint8Array(archive, 4, headerLength)));
  for (let i = 0; i < entries.length; i += 12) {
    await Promise.all(entries.slice(i, i + 12).map(async entry => {
      const url = new URL(entry.url, self.registration.scope);
      const from = dataStart + entry.offset;
      const to = from + entry.length;
      if (url.origin !== self.location.origin || !url.pathname.startsWith(tavernPath) || to > archive.byteLength || from < dataStart) throw Error('Invalid pack entry');
      const saved = new Response(archive.slice(from, to), {headers:{'Content-Type':contentType(entry.url)}});
      await cache.put(url, saved);
    }));
  }
  await cache.put(marker, new Response('ok'));
  return entries.length;
}
async function prepareRoomPack(room) {
  const response = await fetch(new URL('tavern/packs/index.json', self.registration.scope), {cache:'force-cache'});
  if (!response.ok) throw Error('Pack index unavailable');
  const index = await response.json();
  if (index.version !== VERSION || !index.rooms?.[room]) throw Error('Unknown room pack: '+room);
  const cache = await caches.open(await cacheName());
  const common = await unpackIntoCache(index.common, cache);
  const specific = await unpackIntoCache(index.rooms[room], cache);
  return common + specific;
}
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
  if (event.data?.type !== 'CACHE_ROOM_PACK') return;
  const port = event.ports[0];
  event.waitUntil(prepareRoomPack(event.data.room).then(files => port?.postMessage({ok:true,files}), error => port?.postMessage({ok:false,error:String(error)})));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_GATE') return;
  event.waitUntil((async () => {
    const cache = await caches.open(await gateName());
    const urls = [self.registration.scope, ...(event.data.urls || [])];
    await Promise.all(urls.map(async value => {
      const url = new URL(value, self.registration.scope);
      if (url.origin !== self.location.origin || !url.pathname.startsWith(rootPath) || url.pathname.startsWith(tavernPath)) return;
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
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(rootPath)) return;
  if (url.pathname.startsWith(packPath)) return;
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
        // Return the network stream now; keep the worker alive for disk storage.
        // First entry must not wait for the entire body to be saved to Cache API.
        if (response.ok) event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
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
    if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(async () => {
      if (warned) return;
      warned = true;
      for (const client of await self.clients.matchAll()) client.postMessage({type: 'CACHE_LIMITED'});
    }));
    return response;
  })());
});
