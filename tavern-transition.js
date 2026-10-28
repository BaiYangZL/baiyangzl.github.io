import {openCharacterSelection} from './character-select.js?v=wardrobe-studio-20261026';
import {openReentryPanel} from './reentry-panel.js?v=reentry-20261026';
const VERSION = 'entry-hour-trace-20261028';
const ROOT = new URL('./', import.meta.url);
const TAVERN = new URL(`tavern/?v=${VERSION}`, ROOT);
// Normal entry always prepares the saved room (or upper for a new visitor).
// The archived full-floor mode is only selected explicitly with rooms=0.
TAVERN.searchParams.set('rooms', new URLSearchParams(location.search).get('rooms') === '0' ? '0' : '1');
const RETURN_KEY = 'belvedere-tavern-return';
// A recent visit resumes; an absence of at least one hour replays the rain entry.
export function reentryState(marker,now=Date.now()) {
  const seen=marker&&typeof marker==='object'?('lastSeenAt' in marker?marker.lastSeenAt:marker.at):undefined;
  const valid=Number.isFinite(seen)&&Number.isFinite(now)&&now-seen>=0;
  return {returning:valid&&now-seen<3600000,expired:valid&&now-seen>=3600000};
}

export function createTavernTransition({pauseGate} = {}) {
  let frame, badge, curtain, entered = false, waiting = false, ready = false, failed = false;
  let startedAt = 0, poll, cacheLimited = false, returning = false, cacheTask;
  let documentRetries=0,documentRetryTimer,failureMessage='';
  let lastActiveAt=0,leftAt=0,presenceTimer,navigating=false;
  function readReturnState() {
    if(new URLSearchParams(location.search).get('reenter')==='1')return {returning:false,expired:false};
    try{return reentryState(JSON.parse(localStorage.getItem(RETURN_KEY)));}
    catch{return {returning:false,expired:false};}
  }
  function rememberSeen(at) {
    lastActiveAt=at;
    try{localStorage.setItem(RETURN_KEY,JSON.stringify({at,lastSeenAt:at,version:VERSION}));}catch{}
  }
  function rememberActive() {
    if(entered&&!navigating&&!document.hidden&&!leftAt)rememberSeen(Date.now());
  }
  function leave() {
    if(!entered||navigating||leftAt)return;
    leftAt=Date.now();rememberSeen(leftAt);
  }
  function restartRain() {
    if(navigating)return;navigating=true;clearInterval(presenceTimer);
    // Save through the room's existing handler; never clear its character/position.
    try{frame?.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));}catch{}
    const url=new URL(ROOT),currentURL=new URL(location.href);url.searchParams.set('rooms',TAVERN.searchParams.get('rooms'));
    for(const key of ['entryTrace1','entryTrace','entryCheck','entryRun','q','quality','time','diagnose'])if(currentURL.searchParams.has(key))url.searchParams.set(key,currentURL.searchParams.get(key));
    url.searchParams.set('reenter','1');url.searchParams.set('weather','rain');url.searchParams.set('v',VERSION);
    location.replace(url.href);
  }
  function resume() {
    if(!entered||navigating||document.hidden)return;
    const own=leftAt||lastActiveAt;
    // Another foreground tab may have kept this same visitor active.
    const recent=own&&reentryState({lastSeenAt:own}).returning;
    if(!recent&&!readReturnState().returning){restartRain();return;}
    leftAt=0;rememberActive();
  }
  document.addEventListener('visibilitychange',()=>document.hidden?leave():resume());
  window.addEventListener('pagehide',leave);window.addEventListener('pageshow',resume);

  function say(message) {
    if (!badge) return;
    badge.textContent = message;
    badge.hidden = true;
    if (waiting) curtain.querySelector('p').textContent = ''; 
  }
  function makeUI() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.title = '贝尔维德酒馆二楼';
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.allowFullscreen = true;
    frame.addEventListener('load',()=>{
      if(entered)return;
      let doc;
      try{if(frame.contentWindow.location.href==='about:blank')return;doc=frame.contentDocument;}catch{}
      if(doc?.getElementById('GameDiv'))return;
      // A missing entry (e.g. while a local build replaces files) is a finished
      // navigation, not a scene still loading. Retry twice, then expose recovery.
      if(documentRetries<2){
        const delay=[1000,2500][documentRetries++];
        clearTimeout(documentRetryTimer);
        documentRetryTimer=setTimeout(()=>{
          const url=new URL(TAVERN);url.searchParams.set('retry',String(Date.now()));
          url.searchParams.set('repairCache','1');frame.src=url.href;
        },delay);
      }else{
        failed=true;failureMessage='酒馆入口暂时未能打开，请点击重新准备。';
        clearInterval(poll);
        curtain.querySelector('p').textContent=failureMessage;
        curtain.querySelector('button').hidden=false;
      }
    });
    frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:10001;background:#171019';
    badge = document.createElement('div');
    badge.id = 'tavern-preload';
    badge.setAttribute('role', 'status');
    badge.style.cssText = 'position:fixed;right:12px;top:calc(env(safe-area-inset-top,0px) + 35px);z-index:8;max-width:min(52vw,300px);padding:7px 11px;border:1px solid #b28b56a3;border-radius:8px;color:#f7dfac;background:#171724db;font:12px/1.4 system-ui;text-align:right;pointer-events:none';
    curtain = document.createElement('div');
    curtain.id = 'tavern-curtain';
    curtain.hidden = true;
    curtain.style.cssText = 'position:fixed;inset:0;z-index:10002;display:none;place-content:center;gap:12px;padding:30px;text-align:center;background:#110e16 url("'+new URL('tavern/start-preview.png',ROOT).href+'") center/cover no-repeat;color:#f2ddba;font:16px/1.6 system-ui;text-shadow:0 2px 8px #110e16';
    curtain.innerHTML = '<p style="margin:0"></p><button type="button" style="justify-self:center;min-width:140px" hidden>重新准备酒馆</button>';
    curtain.querySelector('button').onclick = retry;
    document.body.append(frame, badge, curtain);
    say('正在准备旅店，请稍候…');
  }
  function registerCache() {
    if (cacheTask) return cacheTask;
    cacheTask = (async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.register(new URL(`arrival-sw.js?v=${VERSION}`, ROOT), {scope: ROOT.pathname});
        await navigator.serviceWorker.ready;
        registration.active?.postMessage({type: 'KEEP_WEEK'});
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type !== 'CACHE_LIMITED') return;
          cacheLimited = true;
          if (waiting) curtain.querySelector('p').textContent = '手机存储空间不足，已继续在线载入酒馆。';
        });
        return registration;
      } catch (error) { console.warn('酒馆缓存不可用，继续在线载入', error); }
    })();
    return cacheTask;
  }
  async function cacheGate() {
    const registration = await registerCache();
    if (!registration?.active) return;
    const urls = performance.getEntriesByType('resource').map(entry => entry.name);
    registration.active.postMessage({type: 'CACHE_GATE', urls});
  }
  function check() {
    if (!frame || entered) return;
    let tavern;
    try { tavern = frame.contentWindow.__tavern; } catch { /* iframe has not reached the same-origin scene yet */ }
    const sceneState = tavern?.state();
    if (sceneState?.ready && sceneState.firstFrameReady === true) {
      ready = true; failed = false; clearInterval(poll);
      failureMessage='';clearTimeout(documentRetryTimer);
      badge.hidden = true;
      if (waiting) reveal();
      return;
    }
    if (frame.contentDocument?.readyState === 'complete') {
      const status = frame.contentDocument.querySelector('#tavern-ui .status')?.textContent;
      if (status?.includes('载入家具')) say('酒馆布置中 · ' + status.replace('正在载入家具', '家具'));
      else if (status) say('酒馆布置中 · ' + status);
      if (frame.contentDocument.querySelector('#tavern-ui .note')?.textContent?.includes('场景载入失败')) failed = true;
    }
    if (Date.now() - startedAt > 180000) failed = true;
    if (waiting && failed) {
      curtain.querySelector('p').textContent = cacheLimited ? '存储空间不足或网络中断，请重新准备。' : '酒馆暂未载入，请检查网络后重试。';
      curtain.querySelector('button').hidden = false;
    }
  }
  async function prepare() {
    if (frame||navigating) return;
    const previous=readReturnState();
    if(previous.expired){restartRain();return;}
    returning=previous.returning;
    makeUI(); startedAt = Date.now();
    if (returning) {
      say('正在恢复上次的旅店位置…');
      // Returning players resume their confirmed character without opening selection.
      void restoreReturning();
    }
    // A prior release's cache can contain the old character and scene scripts.
    // Wait briefly for this release, then bypass the old cache if it still owns us.
    const workerURL = new URL(`arrival-sw.js?v=${VERSION}`, ROOT).href;
    const currentWorker = () => navigator.serviceWorker?.controller?.scriptURL === workerURL;
    registerCache();
    if (!currentWorker() && navigator.serviceWorker) await new Promise(resolve => {
      const done = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); resolve(); };
      const changed = () => { if (currentWorker()) done(); };
      const timer = setTimeout(done, 800);
      navigator.serviceWorker.addEventListener('controllerchange', changed);
      changed();
    });
    const sceneURL = new URL(TAVERN);
    if (navigator.serviceWorker?.controller && !currentWorker()) sceneURL.searchParams.set('repairCache', '1');
    if (currentWorker()) navigator.serviceWorker.controller.postMessage({type: 'KEEP_WEEK'});
    frame.src = sceneURL.href;
    poll = setInterval(check, 80);
  }
  function reveal() {
    if (!ready || entered) return;
    entered = true; waiting = false; clearInterval(poll);
    window.dispatchEvent(new Event('belvedere:tavern-enter'));
    const entryURL=new URL(location.href);
    if(entryURL.searchParams.has('reenter')){entryURL.searchParams.delete('reenter');history.replaceState(history.state,'',entryURL.href);}
    window.__belvedereScreen?.hideControls();
    leftAt=0;rememberActive();
    presenceTimer=setInterval(rememberActive,30000);
    curtain.querySelector('p').textContent = '';
    requestAnimationFrame(() => {
      frame.contentWindow.__tavern?.activate();
      frame.style.opacity = '1'; frame.style.pointerEvents = 'auto';
      pauseGate?.();
      setTimeout(() => { curtain.style.display = 'none'; curtain.hidden = true; frame.contentWindow.focus(); }, 400);
    });
  }
  function enter() {
    waiting = true;
    if (!frame) prepare();
    if(navigating)return;
    curtain.hidden = false;
    curtain.style.display = 'grid';
    badge.hidden = true;
    if (ready) reveal();
    else if (!failed) curtain.querySelector('p').textContent = '';
  }
  function retry() {
    if (!frame) return prepare();
    clearTimeout(documentRetryTimer);documentRetries=0;failureMessage='';
    clearInterval(poll); ready = failed = false; startedAt = Date.now();
    curtain.querySelector('button').hidden = true;
    curtain.querySelector('p').textContent = '';
    const retryURL = new URL(TAVERN); retryURL.searchParams.set('retry', String(Date.now()));retryURL.searchParams.set('repairCache','1'); frame.src = retryURL.href;
    poll = setInterval(check, 80);
    if(returning){waiting=false;void restoreReturning();}
  }
  async function whenReady() {
    if (!frame) await prepare();
    if (failed) retry();
    if (ready) return;
    return new Promise((resolve, reject) => {
      const watcher = setInterval(() => {
        if (!ready && !failed) return;
        clearInterval(watcher);
        if (ready) resolve(); else reject(new Error('酒馆场景未能载入'));
      }, 80);
    });
  }
  async function restoreReturning(){
    try{
      await whenReady();
      let saved;try{saved=JSON.parse(localStorage.getItem('belvedere-character-v1')||'null');}catch{}
      const state=frame.contentWindow.__tavern.state();
      const id=['blue-a','gold-a'].includes(saved?.id)?saved.id:'blue-a';
      await setCharacter({id,name:saved?.name||'旅人',direction:state.facing});
      if(!saved)try{localStorage.setItem('belvedere-character-v1',JSON.stringify({id,name:'旅人',direction:state.facing}));}catch{}
      enter();
    }catch(error){failed=true;waiting=true;curtain.hidden=false;curtain.style.display='grid';curtain.querySelector('p').textContent=failureMessage||'角色暂未准备好，请重试。';curtain.querySelector('button').hidden=false;}
  }
  function panelOptions(options){
    const r=frame.getBoundingClientRect(),b=options.originRect,rotated=!!window.__belvedereScreen?.rotated;
    const fw=frame.contentWindow.innerWidth,fh=frame.contentWindow.innerHeight;
    const originRect=b?(rotated?{x:r.right-(b.y+b.height)*r.width/fh,y:r.top+b.x*r.height/fw,width:b.height*r.width/fh,height:b.width*r.height/fw}:{x:r.left+b.x*r.width/fw,y:r.top+b.y*r.height/fh,width:b.width*r.width/fw,height:b.height*r.height/fh}):undefined;
    return {...options,originRect};
  }
  function selectWardrobe(options){return openCharacterSelection({...panelOptions(options),mode:'wardrobe'});}
  function showReentry(options){return openReentryPanel(panelOptions(options));}
  function restart(){
    navigating=true;clearInterval(presenceTimer);
    const url=new URL(ROOT);url.searchParams.set('rooms',TAVERN.searchParams.get('rooms'));
    url.searchParams.set('reenter','1');url.searchParams.set('v','reentry-20261026');
    for(const key of [RETURN_KEY,'belvedere-tavern-ready-day'])try{localStorage.removeItem(key);}catch{}
    location.assign(url.href);
  }
  async function setCharacter(selection) { await whenReady();const api=frame.contentWindow.__tavern;if(!api?.setCharacter)throw new Error('请刷新以载入新版角色');await api.setCharacter(selection.id,selection.name,selection.direction); }
  let cinema,cinemaCovered=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  async function animateCinema(keys,duration){const animation=cinema.animate(keys,{duration:reduced?140:duration,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});await animation.finished;Object.assign(cinema.style,keys[keys.length-1]);animation.cancel();}
  async function coverCinema(){await whenReady();if(!cinema){cinema=document.createElement('div');cinema.id='tavern-amber-cinema';cinema.style.cssText='position:fixed;inset:0;z-index:100030;pointer-events:none;display:none;opacity:0;background:radial-gradient(ellipse at 64% 40%,#7c5634,#322131 60%,#140f1b)';document.body.append(cinema);}if(cinemaCovered)return;cinema.style.display='block';await animateCinema([{opacity:'0'},{opacity:'1'}],800);cinemaCovered=true;}
  async function enterCinema(){if(!cinemaCovered)await coverCinema();enter();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await animateCinema([{opacity:'1'},{opacity:'0'}],1250);cinema.style.display='none';cinemaCovered=false;}
  return {prepare, cacheGate, whenReady, setCharacter, selectWardrobe, showReentry, restart, enter, coverCinema, enterCinema, retry, status: () => ({ready, entered, waiting, returning, failed, failureMessage, documentRetries, cacheLimited, frame: !!frame, startedAt})};
}
