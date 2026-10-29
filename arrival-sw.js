// Caches the tavern files actually requested by Cocos, scoped to this GitHub Pages project.
const VERSION = 'original-8-formal-20261027';
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
// Media normally asks for bytes=0-. Cache API cannot store a 206 response.
// Only a response covering the entire original file may become a reusable 200.
function completeMedia(response) {
  if (response.status === 200) return response.clone();
  const part = /^bytes 0-(\d+)\/(\d+)$/.exec(response.headers.get('Content-Range') || '');
  if (response.status !== 206 || !part || Number(part[1]) + 1 !== Number(part[2]) || response.headers.has('Content-Encoding')) return null;
  const headers = new Headers(response.headers);headers.delete('Content-Range');headers.set('Content-Length',part[2]);
  return new Response(response.clone().body,{status:200,headers});
}
async function mediaRange(request, saved) {
  if (!saved || saved.status !== 200) return null;
  const condition=request.headers.get('If-Range');
  if (condition && (condition.startsWith('W/') || (condition!==saved.headers.get('ETag') && condition!==saved.headers.get('Last-Modified')))) return null;
  const range=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range')||'');
  if(!range || (!range[1]&&!range[2]))return null; // Multiple/unsupported ranges go to the origin.
  const body=await saved.arrayBuffer(),size=body.byteLength;
  const start=range[1]?Number(range[1]):Math.max(0,size-Number(range[2]));
  const end=range[1]?(range[2]?Math.min(Number(range[2]),size-1):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  const headers=new Headers(saved.headers);headers.delete('Content-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(body.slice(start,end+1),{status:206,headers});
}
const changed=new Set(["","arrival-audio-study.js","arrival-audio.js","arrival-sw.js","assets/curtain_A_01.wav","assets/curtain_A_02.wav","assets/floor_transition_C_01.wav","assets/foot-v3-heels-wood.wav","assets/foot-v3-leather-wood.wav","assets/foot_heels_carpet_run_A_01.wav","assets/foot_heels_carpet_run_A_02.wav","assets/foot_heels_carpet_run_A_03.wav","assets/foot_heels_carpet_run_A_04.wav","assets/foot_heels_carpet_walk_A_01.wav","assets/foot_heels_carpet_walk_A_02.wav","assets/foot_heels_carpet_walk_A_03.wav","assets/foot_heels_carpet_walk_A_04.wav","assets/foot_heels_gravel_run_B_01.wav","assets/foot_heels_gravel_run_B_02.wav","assets/foot_heels_gravel_run_B_03.wav","assets/foot_heels_gravel_run_B_04.wav","assets/foot_heels_gravel_walk_B_01.wav","assets/foot_heels_gravel_walk_B_02.wav","assets/foot_heels_gravel_walk_B_03.wav","assets/foot_heels_gravel_walk_B_04.wav","assets/foot_heels_mat_run_A_01.wav","assets/foot_heels_mat_run_A_02.wav","assets/foot_heels_mat_run_A_03.wav","assets/foot_heels_mat_run_A_04.wav","assets/foot_heels_mat_walk_A_01.wav","assets/foot_heels_mat_walk_A_02.wav","assets/foot_heels_mat_walk_A_03.wav","assets/foot_heels_mat_walk_A_04.wav","assets/foot_heels_stairs_run_A_01.wav","assets/foot_heels_stairs_run_A_02.wav","assets/foot_heels_stairs_run_A_03.wav","assets/foot_heels_stairs_run_A_04.wav","assets/foot_heels_stairs_walk_A_01.wav","assets/foot_heels_stairs_walk_A_02.wav","assets/foot_heels_stairs_walk_A_03.wav","assets/foot_heels_stairs_walk_A_04.wav","assets/foot_heels_stone_run_B_01.wav","assets/foot_heels_stone_run_B_02.wav","assets/foot_heels_stone_run_B_03.wav","assets/foot_heels_stone_run_B_04.wav","assets/foot_heels_stone_walk_B_01.wav","assets/foot_heels_stone_walk_B_02.wav","assets/foot_heels_stone_walk_B_03.wav","assets/foot_heels_stone_walk_B_04.wav","assets/foot_heels_tile_run_B_01.wav","assets/foot_heels_tile_run_B_02.wav","assets/foot_heels_tile_run_B_03.wav","assets/foot_heels_tile_run_B_04.wav","assets/foot_heels_tile_walk_B_01.wav","assets/foot_heels_tile_walk_B_02.wav","assets/foot_heels_tile_walk_B_03.wav","assets/foot_heels_tile_walk_B_04.wav","assets/foot_heels_wet_run_B_01.wav","assets/foot_heels_wet_run_B_02.wav","assets/foot_heels_wet_run_B_03.wav","assets/foot_heels_wet_run_B_04.wav","assets/foot_heels_wet_walk_B_01.wav","assets/foot_heels_wet_walk_B_02.wav","assets/foot_heels_wet_walk_B_03.wav","assets/foot_heels_wet_walk_B_04.wav","assets/foot_leather_carpet_run_A_01.wav","assets/foot_leather_carpet_run_A_02.wav","assets/foot_leather_carpet_run_A_03.wav","assets/foot_leather_carpet_run_A_04.wav","assets/foot_leather_carpet_walk_A_01.wav","assets/foot_leather_carpet_walk_A_02.wav","assets/foot_leather_carpet_walk_A_03.wav","assets/foot_leather_carpet_walk_A_04.wav","assets/foot_leather_mat_run_A_01.wav","assets/foot_leather_mat_run_A_02.wav","assets/foot_leather_mat_run_A_03.wav","assets/foot_leather_mat_run_A_04.wav","assets/foot_leather_mat_walk_A_01.wav","assets/foot_leather_mat_walk_A_02.wav","assets/foot_leather_mat_walk_A_03.wav","assets/foot_leather_mat_walk_A_04.wav","assets/foot_leather_stone_run_B_01.wav","assets/foot_leather_stone_run_B_02.wav","assets/foot_leather_stone_run_B_03.wav","assets/foot_leather_stone_run_B_04.wav","assets/foot_leather_stone_walk_B_01.wav","assets/foot_leather_stone_walk_B_02.wav","assets/foot_leather_stone_walk_B_03.wav","assets/foot_leather_stone_walk_B_04.wav","assets/foot_leather_tile_run_B_01.wav","assets/foot_leather_tile_run_B_02.wav","assets/foot_leather_tile_run_B_03.wav","assets/foot_leather_tile_run_B_04.wav","assets/foot_leather_tile_walk_B_01.wav","assets/foot_leather_tile_walk_B_02.wav","assets/foot_leather_tile_walk_B_03.wav","assets/foot_leather_tile_walk_B_04.wav","assets/foot_sneaker_carpet_run_A_01.wav","assets/foot_sneaker_carpet_run_A_02.wav","assets/foot_sneaker_carpet_run_A_03.wav","assets/foot_sneaker_carpet_run_A_04.wav","assets/foot_sneaker_carpet_walk_A_01.wav","assets/foot_sneaker_carpet_walk_A_02.wav","assets/foot_sneaker_carpet_walk_A_03.wav","assets/foot_sneaker_carpet_walk_A_04.wav","assets/foot_sneaker_gravel_run_A_01.wav","assets/foot_sneaker_gravel_run_A_02.wav","assets/foot_sneaker_gravel_run_A_03.wav","assets/foot_sneaker_gravel_run_A_04.wav","assets/foot_sneaker_gravel_walk_A_01.wav","assets/foot_sneaker_gravel_walk_A_02.wav","assets/foot_sneaker_gravel_walk_A_03.wav","assets/foot_sneaker_gravel_walk_A_04.wav","assets/foot_sneaker_mat_run_A_01.wav","assets/foot_sneaker_mat_run_A_02.wav","assets/foot_sneaker_mat_run_A_03.wav","assets/foot_sneaker_mat_run_A_04.wav","assets/foot_sneaker_mat_walk_A_01.wav","assets/foot_sneaker_mat_walk_A_02.wav","assets/foot_sneaker_mat_walk_A_03.wav","assets/foot_sneaker_mat_walk_A_04.wav","assets/foot_sneaker_stairs_run_A_01.wav","assets/foot_sneaker_stairs_run_A_02.wav","assets/foot_sneaker_stairs_run_A_03.wav","assets/foot_sneaker_stairs_run_A_04.wav","assets/foot_sneaker_stairs_walk_A_01.wav","assets/foot_sneaker_stairs_walk_A_02.wav","assets/foot_sneaker_stairs_walk_A_03.wav","assets/foot_sneaker_stairs_walk_A_04.wav","assets/foot_sneaker_stone_run_A_01.wav","assets/foot_sneaker_stone_run_A_02.wav","assets/foot_sneaker_stone_run_A_03.wav","assets/foot_sneaker_stone_run_A_04.wav","assets/foot_sneaker_stone_walk_A_01.wav","assets/foot_sneaker_stone_walk_A_02.wav","assets/foot_sneaker_stone_walk_A_03.wav","assets/foot_sneaker_stone_walk_A_04.wav","assets/foot_sneaker_tile_run_A_01.wav","assets/foot_sneaker_tile_run_A_02.wav","assets/foot_sneaker_tile_run_A_03.wav","assets/foot_sneaker_tile_run_A_04.wav","assets/foot_sneaker_tile_walk_A_01.wav","assets/foot_sneaker_tile_walk_A_02.wav","assets/foot_sneaker_tile_walk_A_03.wav","assets/foot_sneaker_tile_walk_A_04.wav","assets/foot_sneaker_wet_run_A_01.wav","assets/foot_sneaker_wet_run_A_02.wav","assets/foot_sneaker_wet_run_A_03.wav","assets/foot_sneaker_wet_run_A_04.wav","assets/foot_sneaker_wet_walk_A_01.wav","assets/foot_sneaker_wet_walk_A_02.wav","assets/foot_sneaker_wet_walk_A_03.wav","assets/foot_sneaker_wet_walk_A_04.wav","assets/rain_inside_B_01.wav","assets/rain_leaf_A_01.wav","assets/rain_out_A_01.wav","assets/rain_roof_B_01.wav","assets/rain_stone_B_01.wav","assets/rain_window_A_01.wav","assets/room_transition_C_01.wav","assets/user-door_close.mp3","assets/user-door_open.mp3","assets/user-fireplace.mp3","assets/user-storage_close.mp3","assets/user-storage_open.mp3","assets/user-wood-sneaker.mp3","cache-check.html","character-catalog.json","character-select.js","cold-entry.html","entry-check.html","game-volume.js","index.html","indoor-rain.js","journey.js","painted-flora.js","painted-gate.js","preview-session.js","reentry-panel.js","reentry.js","room-state.js","sample-study.js","sample.js","selected-sounds.json","sound-surfaces.js","stage.html","tavern-transition.js","tavern/assets/curtain_A_01.wav","tavern/assets/curtain_A_02.wav","tavern/assets/floor_transition_C_01.wav","tavern/assets/foot-v3-heels-wood.wav","tavern/assets/foot-v3-leather-wood.wav","tavern/assets/foot_heels_carpet_run_A_01.wav","tavern/assets/foot_heels_carpet_run_A_02.wav","tavern/assets/foot_heels_carpet_run_A_03.wav","tavern/assets/foot_heels_carpet_run_A_04.wav","tavern/assets/foot_heels_carpet_walk_A_01.wav","tavern/assets/foot_heels_carpet_walk_A_02.wav","tavern/assets/foot_heels_carpet_walk_A_03.wav","tavern/assets/foot_heels_carpet_walk_A_04.wav","tavern/assets/foot_heels_gravel_run_B_01.wav","tavern/assets/foot_heels_gravel_run_B_02.wav","tavern/assets/foot_heels_gravel_run_B_03.wav","tavern/assets/foot_heels_gravel_run_B_04.wav","tavern/assets/foot_heels_gravel_walk_B_01.wav","tavern/assets/foot_heels_gravel_walk_B_02.wav","tavern/assets/foot_heels_gravel_walk_B_03.wav","tavern/assets/foot_heels_gravel_walk_B_04.wav","tavern/assets/foot_heels_mat_run_A_01.wav","tavern/assets/foot_heels_mat_run_A_02.wav","tavern/assets/foot_heels_mat_run_A_03.wav","tavern/assets/foot_heels_mat_run_A_04.wav","tavern/assets/foot_heels_mat_walk_A_01.wav","tavern/assets/foot_heels_mat_walk_A_02.wav","tavern/assets/foot_heels_mat_walk_A_03.wav","tavern/assets/foot_heels_mat_walk_A_04.wav","tavern/assets/foot_heels_stairs_run_A_01.wav","tavern/assets/foot_heels_stairs_run_A_02.wav","tavern/assets/foot_heels_stairs_run_A_03.wav","tavern/assets/foot_heels_stairs_run_A_04.wav","tavern/assets/foot_heels_stairs_walk_A_01.wav","tavern/assets/foot_heels_stairs_walk_A_02.wav","tavern/assets/foot_heels_stairs_walk_A_03.wav","tavern/assets/foot_heels_stairs_walk_A_04.wav","tavern/assets/foot_heels_stone_run_B_01.wav","tavern/assets/foot_heels_stone_run_B_02.wav","tavern/assets/foot_heels_stone_run_B_03.wav","tavern/assets/foot_heels_stone_run_B_04.wav","tavern/assets/foot_heels_stone_walk_B_01.wav","tavern/assets/foot_heels_stone_walk_B_02.wav","tavern/assets/foot_heels_stone_walk_B_03.wav","tavern/assets/foot_heels_stone_walk_B_04.wav","tavern/assets/foot_heels_tile_run_B_01.wav","tavern/assets/foot_heels_tile_run_B_02.wav","tavern/assets/foot_heels_tile_run_B_03.wav","tavern/assets/foot_heels_tile_run_B_04.wav","tavern/assets/foot_heels_tile_walk_B_01.wav","tavern/assets/foot_heels_tile_walk_B_02.wav","tavern/assets/foot_heels_tile_walk_B_03.wav","tavern/assets/foot_heels_tile_walk_B_04.wav","tavern/assets/foot_heels_wet_run_B_01.wav","tavern/assets/foot_heels_wet_run_B_02.wav","tavern/assets/foot_heels_wet_run_B_03.wav","tavern/assets/foot_heels_wet_run_B_04.wav","tavern/assets/foot_heels_wet_walk_B_01.wav","tavern/assets/foot_heels_wet_walk_B_02.wav","tavern/assets/foot_heels_wet_walk_B_03.wav","tavern/assets/foot_heels_wet_walk_B_04.wav","tavern/assets/foot_leather_carpet_run_A_01.wav","tavern/assets/foot_leather_carpet_run_A_02.wav","tavern/assets/foot_leather_carpet_run_A_03.wav","tavern/assets/foot_leather_carpet_run_A_04.wav","tavern/assets/foot_leather_carpet_walk_A_01.wav","tavern/assets/foot_leather_carpet_walk_A_02.wav","tavern/assets/foot_leather_carpet_walk_A_03.wav","tavern/assets/foot_leather_carpet_walk_A_04.wav","tavern/assets/foot_leather_mat_run_A_01.wav","tavern/assets/foot_leather_mat_run_A_02.wav","tavern/assets/foot_leather_mat_run_A_03.wav","tavern/assets/foot_leather_mat_run_A_04.wav","tavern/assets/foot_leather_mat_walk_A_01.wav","tavern/assets/foot_leather_mat_walk_A_02.wav","tavern/assets/foot_leather_mat_walk_A_03.wav","tavern/assets/foot_leather_mat_walk_A_04.wav","tavern/assets/foot_leather_stone_run_B_01.wav","tavern/assets/foot_leather_stone_run_B_02.wav","tavern/assets/foot_leather_stone_run_B_03.wav","tavern/assets/foot_leather_stone_run_B_04.wav","tavern/assets/foot_leather_stone_walk_B_01.wav","tavern/assets/foot_leather_stone_walk_B_02.wav","tavern/assets/foot_leather_stone_walk_B_03.wav","tavern/assets/foot_leather_stone_walk_B_04.wav","tavern/assets/foot_leather_tile_run_B_01.wav","tavern/assets/foot_leather_tile_run_B_02.wav","tavern/assets/foot_leather_tile_run_B_03.wav","tavern/assets/foot_leather_tile_run_B_04.wav","tavern/assets/foot_leather_tile_walk_B_01.wav","tavern/assets/foot_leather_tile_walk_B_02.wav","tavern/assets/foot_leather_tile_walk_B_03.wav","tavern/assets/foot_leather_tile_walk_B_04.wav","tavern/assets/foot_sneaker_carpet_run_A_01.wav","tavern/assets/foot_sneaker_carpet_run_A_02.wav","tavern/assets/foot_sneaker_carpet_run_A_03.wav","tavern/assets/foot_sneaker_carpet_run_A_04.wav","tavern/assets/foot_sneaker_carpet_walk_A_01.wav","tavern/assets/foot_sneaker_carpet_walk_A_02.wav","tavern/assets/foot_sneaker_carpet_walk_A_03.wav","tavern/assets/foot_sneaker_carpet_walk_A_04.wav","tavern/assets/foot_sneaker_gravel_run_A_01.wav","tavern/assets/foot_sneaker_gravel_run_A_02.wav","tavern/assets/foot_sneaker_gravel_run_A_03.wav","tavern/assets/foot_sneaker_gravel_run_A_04.wav","tavern/assets/foot_sneaker_gravel_walk_A_01.wav","tavern/assets/foot_sneaker_gravel_walk_A_02.wav","tavern/assets/foot_sneaker_gravel_walk_A_03.wav","tavern/assets/foot_sneaker_gravel_walk_A_04.wav","tavern/assets/foot_sneaker_mat_run_A_01.wav","tavern/assets/foot_sneaker_mat_run_A_02.wav","tavern/assets/foot_sneaker_mat_run_A_03.wav","tavern/assets/foot_sneaker_mat_run_A_04.wav","tavern/assets/foot_sneaker_mat_walk_A_01.wav","tavern/assets/foot_sneaker_mat_walk_A_02.wav","tavern/assets/foot_sneaker_mat_walk_A_03.wav","tavern/assets/foot_sneaker_mat_walk_A_04.wav","tavern/assets/foot_sneaker_stairs_run_A_01.wav","tavern/assets/foot_sneaker_stairs_run_A_02.wav","tavern/assets/foot_sneaker_stairs_run_A_03.wav","tavern/assets/foot_sneaker_stairs_run_A_04.wav","tavern/assets/foot_sneaker_stairs_walk_A_01.wav","tavern/assets/foot_sneaker_stairs_walk_A_02.wav","tavern/assets/foot_sneaker_stairs_walk_A_03.wav","tavern/assets/foot_sneaker_stairs_walk_A_04.wav","tavern/assets/foot_sneaker_stone_run_A_01.wav","tavern/assets/foot_sneaker_stone_run_A_02.wav","tavern/assets/foot_sneaker_stone_run_A_03.wav","tavern/assets/foot_sneaker_stone_run_A_04.wav","tavern/assets/foot_sneaker_stone_walk_A_01.wav","tavern/assets/foot_sneaker_stone_walk_A_02.wav","tavern/assets/foot_sneaker_stone_walk_A_03.wav","tavern/assets/foot_sneaker_stone_walk_A_04.wav","tavern/assets/foot_sneaker_tile_run_A_01.wav","tavern/assets/foot_sneaker_tile_run_A_02.wav","tavern/assets/foot_sneaker_tile_run_A_03.wav","tavern/assets/foot_sneaker_tile_run_A_04.wav","tavern/assets/foot_sneaker_tile_walk_A_01.wav","tavern/assets/foot_sneaker_tile_walk_A_02.wav","tavern/assets/foot_sneaker_tile_walk_A_03.wav","tavern/assets/foot_sneaker_tile_walk_A_04.wav","tavern/assets/foot_sneaker_wet_run_A_01.wav","tavern/assets/foot_sneaker_wet_run_A_02.wav","tavern/assets/foot_sneaker_wet_run_A_03.wav","tavern/assets/foot_sneaker_wet_run_A_04.wav","tavern/assets/foot_sneaker_wet_walk_A_01.wav","tavern/assets/foot_sneaker_wet_walk_A_02.wav","tavern/assets/foot_sneaker_wet_walk_A_03.wav","tavern/assets/foot_sneaker_wet_walk_A_04.wav","tavern/assets/main/index.js","tavern/assets/rain_inside_B_01.wav","tavern/assets/rain_leaf_A_01.wav","tavern/assets/rain_out_A_01.wav","tavern/assets/rain_roof_B_01.wav","tavern/assets/rain_stone_B_01.wav","tavern/assets/rain_window_A_01.wav","tavern/assets/resources/import/63/63c37b89-98bf-4203-bd00-abef6a91569e.json","tavern/assets/room_transition_C_01.wav","tavern/assets/user-door_close.mp3","tavern/assets/user-door_open.mp3","tavern/assets/user-fireplace.mp3","tavern/assets/user-storage_close.mp3","tavern/assets/user-storage_open.mp3","tavern/assets/user-wood-sneaker.mp3","tavern/character-catalog.json","tavern/character-select.css","tavern/character-select.js","tavern/game-volume.js","tavern/grimoire-room.js","tavern/index.html","tavern/indoor-rain.js","tavern/mesh-integrity.json","tavern/preview-session.js","tavern/reentry-panel.js","tavern/reentry.js","tavern/room-state.js","tavern/selected-sounds.js","tavern/selected-sounds.json","tavern/sound-surfaces.js","tavern/tavern-boot.js","weather-fx.js"]);
const networkRequest = request => changed.has(new URL(request.url).pathname.slice(rootPath.length)) ? new Request(request,{cache:'reload'}) : request;
let warned = false;
self.addEventListener('message', event => { if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting()); });
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
 // Entry guard and compatibility repair: entry-fix-20261027b

 for(const name of await caches.keys()){
  if(name.startsWith('belvedere-entry-')){await caches.delete(name);continue;}
  if(!name.startsWith(PREFIX)&&!name.startsWith(GATE_PREFIX))continue;
  const cache=await caches.open(name);
  for(const request of await cache.keys())if(changed.has(new URL(request.url).pathname.slice(rootPath.length)))await cache.delete(request);
 }
 await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'KEEP_WEEK') return;
  event.waitUntil((async () => {
    const current = await cacheName();
    const gateCurrent = await gateName();
    for (const key of await caches.keys()) if ((key.startsWith(PREFIX) && key !== current) || (key.startsWith(GATE_PREFIX) && key !== gateCurrent)) await caches.delete(key);
  })().catch(() => {}));
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
  })().catch(() => {}));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(rootPath)) return;
  // Explicit first-download test: isolated cache prevents old in-flight writes
  // from repopulating this run. Misses bypass the browser HTTP cache, not the CDN.
  const coldResponse=async()=>{
    const client=event.clientId?await self.clients.get(event.clientId):null;
    const token=url.searchParams.get('coldEntry')||(client&&new URL(client.url).searchParams.get('coldEntry'));
    if(!token||!/^[a-z0-9-]{6,80}$/.test(token))return null;
    const cache=await caches.open('belvedere-entry-cold-'+token),saved=await cache.match(request.url,{ignoreVary:true});
    if(request.headers.has('Range')){const part=await mediaRange(request,saved);if(part)return part;}
    else if(saved)return saved;
    const response=await fetch(new Request(request,{cache:'reload'}));
    const whole=request.headers.has('Range')?completeMedia(response):response.status===200?response.clone():null;
    if(whole)event.waitUntil(cache.put(request.url,whole).catch(()=>{}));
    return response;
  };
  // Resolve client identity before dispatching the ordinary cache policy.
  if(url.searchParams.has('coldEntry')){event.respondWith(coldResponse().then(r=>r||ordinaryResponse()));return;}
  // Subresources carry the test identity through their document URL.
  if(event.clientId){event.respondWith((async()=>{
    const cold=await coldResponse();if(cold)return cold;
    return ordinaryResponse();
  })());return;}
  event.respondWith(ordinaryResponse());
  function ordinaryResponse(){
    // Reuse the normal handler below without a second FetchEvent response.
    let response;const normalEvent={request,clientId:event.clientId,waitUntil:p=>event.waitUntil(p),respondWith:p=>{response=p;}};
    normalFetch(normalEvent);return response||fetch(request);
  }
});
function normalFetch(event){
  const request=event.request,url=new URL(request.url);
  // Recovery documents must never replace the cached game homepage.
  if (url.pathname === rootPath + 'recover.html') {event.respondWith(fetch(networkRequest(request)));return;}
  if (!url.pathname.startsWith(tavernPath) && /\.(mp3|wav)$/i.test(url.pathname) && request.headers.has('Range')) {
    event.respondWith((async()=>{
      const cache=await caches.open(await gateName());
      const saved=await cache.match(url.href,{ignoreVary:true});
      const hit=await mediaRange(request,saved);if(hit)return hit;
      const response=await fetch(networkRequest(request)),whole=completeMedia(response);
      if(whole)event.waitUntil(cache.put(url.href,whole).catch(()=>{}));
      return response;
    })().catch(()=>fetch(networkRequest(request))));
    return;
  }
  if (!url.pathname.startsWith(tavernPath)) {
    event.respondWith((async () => {
      const cache = await caches.open(await gateName());
      const key = request.mode === 'navigate' && url.pathname === rootPath ? self.registration.scope : request;
      if (request.mode !== 'navigate') {
        const saved = await cache.match(key, {ignoreVary: true});
        if (saved) return saved;
      }
      try {
        const response = await fetch(networkRequest(request));
        // Return the network stream now; keep the worker alive for disk storage.
        // First entry must not wait for the entire body to be saved to Cache API.
        if (response.ok) event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
        return response;
      } catch {
        const saved = await cache.match(key, {ignoreVary: true});
        if (saved) return saved;
        throw new Error('城门页面不在缓存中');
      }
    })().catch(() => fetch(networkRequest(request))));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(await cacheName());
    const client = event.clientId ? await self.clients.get(event.clientId) : null;
    const clientURL = client ? new URL(client.url) : null;
    const ownVersion = new URL(self.location.href).searchParams.get('v');
    const automatic = ownVersion && clientURL?.searchParams.get('automaticRepairFor') === ownVersion;
    // Old/unknown workers and explicit retries retain the full repair bypass.
    if (clientURL?.searchParams.get('repairCache') === '1' && !automatic) {
      const response = await fetch(new Request(request, {cache: 'reload'}));
      if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      return response;
    }
    // Refresh the small entry document while reusing unchanged model caches.
    // This prevents cached full-floor launch HTML from surviving an entry fix.
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(networkRequest(request));
        if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
        return response;
      } catch (error) {
        const saved = await cache.match(request, {ignoreVary: true});
        if (saved) return saved;
        throw error;
      }
    }
    const saved = await cache.match(request, {ignoreVary: true});
    if (saved) return saved;
    const response = await fetch(networkRequest(request));
    if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(async () => {
      if (warned) return;
      warned = true;
      for (const client of await self.clients.matchAll()) client.postMessage({type: 'CACHE_LIMITED'});
    }));
    return response;
  })().catch(() => fetch(networkRequest(request))));
}

// Prepared release: entry-load-857bb6304af1
