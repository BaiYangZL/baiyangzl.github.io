// User recordings. Gains compensate for the very quiet rain/insect source files.
const LEVELS = {loading: 0.12, rain: 10, insects: 1.8};
const FILES = {loading: 'arrival-loading.mp3', rain: 'arrival-rain.mp3', insects: 'arrival-insects.mp3'};

export function createArrivalAudio() {
 const AudioContext = window.AudioContext || window.webkitAudioContext;
 if (!AudioContext) return {setStage(){}, setPaused(){}, status:()=>({unsupported:true})};
 const context = new AudioContext(), master = context.createGain();
 master.connect(context.destination);
 let stage='map', paused=false, muted=false, disposed=false, pageHidden=false;
 try { muted=localStorage.getItem('belvedere-arrival-muted')==='1'; } catch {}
 master.gain.value=muted?0:1;
 const tracks={}, failures=[];
 const button=document.createElement('button');
 button.id='arrival-sound';
 document.querySelector('footer')?.append(button);
 function label() {
  button.textContent=muted?'声音：关':context.state==='running'?'声音：开':'点击开启声音';
  button.setAttribute('aria-pressed',String(!muted&&context.state==='running'));
 }
 function ramp(param,value,seconds) {
  const now=context.currentTime;
  param.cancelAndHoldAtTime(now);
  param.linearRampToValueAtTime(value,now+seconds);
 }
 function active() { return !disposed&&!paused&&!muted&&!document.hidden&&!pageHidden; }
 function apply() {
  if(disposed)return;
  for(const [name,track] of Object.entries(tracks)) {
   const wanted=name==='loading'?stage==='map':stage==='road';
   ramp(track.gain.gain,wanted?LEVELS[name]:0,stage==='map'?0.8:2);
   if(track.media) {
    clearTimeout(track.stopTimer);
    if(wanted&&active()&&context.state==='running')track.media.play().catch(()=>{});
    else if(!wanted)track.stopTimer=setTimeout(()=>track.media.pause(),2100);
   }
  }
  label();
 }
 function resume() {
  if(!active())return;
  // Invoke both APIs inside the gesture, before awaiting (Safari/WeChat).
  if(stage==='map')tracks.loading.media.play().catch(()=>{});
  context.resume().then(()=>{if(!disposed)apply();}).catch(()=>{});
 }
 function sync() {
  if(disposed)return;
  if(active())resume();
  else { tracks.loading.media.pause();context.suspend().catch(()=>{}); }
  label();
 }
 for(const name of Object.keys(FILES)) {
  const gain=context.createGain();gain.gain.value=0;gain.connect(master);
  tracks[name]={gain,source:null};
 }
 const loading=new Audio(new URL('./assets/'+FILES.loading,import.meta.url).href);
 loading.loop=true;loading.preload='auto';loading.setAttribute('playsinline','');
 tracks.loading.media=loading;
 tracks.loading.source=context.createMediaElementSource(loading);
 tracks.loading.source.connect(tracks.loading.gain);
 loading.addEventListener('error',()=>failures.push('loading'));

 // Short ambience loops overlap their tail with their head, avoiding a click/gap
 // every five seconds. The long loading track streams instead of decoding to RAM.
 for(const name of ['rain','insects']) {
  fetch(new URL('./assets/'+FILES[name],import.meta.url))
   .then(response=>{if(!response.ok)throw Error(response.status);return response.arrayBuffer();})
   .then(bytes=>context.decodeAudioData(bytes))
   .then(buffer=>{
    if(disposed)return;
    const overlap=Math.min(Math.round(buffer.sampleRate*0.25),Math.floor(buffer.length/4));
    const length=buffer.length-overlap,loop=context.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
    for(let channel=0;channel<buffer.numberOfChannels;channel++) {
     const input=buffer.getChannelData(channel),output=loop.getChannelData(channel);
     output.set(input.subarray(overlap));
     for(let i=0;i<overlap;i++) {
      const t=i/(overlap-1),fade=t*t*(3-2*t),index=length-overlap+i;
      output[index]=output[index]*(1-fade)+input[i]*fade;
     }
    }
    const source=context.createBufferSource();source.buffer=loop;source.loop=true;
    source.connect(tracks[name].gain);source.start();tracks[name].source=source;
    apply();
   }).catch(()=>{if(!disposed)failures.push(name);});
 }
 const gestures=['pointerdown','touchend','keydown'];
 const unlock=event=>{if(event.target!==button)resume();};
 for(const type of gestures)document.addEventListener(type,unlock,{capture:true,passive:true});
 document.addEventListener('WeixinJSBridgeReady',resume);
 document.addEventListener('visibilitychange',sync);
 const hide=()=>{pageHidden=true;sync();},show=()=>{pageHidden=false;sync();};
 window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 context.addEventListener('statechange',label);
 button.onclick=()=>{
  muted=context.state!=='running'&&!muted?false:!muted;
  try{localStorage.setItem('belvedere-arrival-muted',muted?'1':'0');}catch{}
  ramp(master.gain,muted?0:1,0.15);sync();
 };
 function stop() {
  if(disposed)return;
  disposed=true;stage='off';ramp(master.gain,0,0.6);button.remove();
  for(const type of gestures)document.removeEventListener(type,unlock,true);
  document.removeEventListener('WeixinJSBridgeReady',resume);
  document.removeEventListener('visibilitychange',sync);
  window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);
  window.removeEventListener('belvedere:tavern-enter',stop);
  setTimeout(()=>{
   loading.pause();loading.removeAttribute('src');loading.load();
   for(const track of Object.values(tracks)){clearTimeout(track.stopTimer);track.source?.stop?.();track.source?.disconnect();track.gain.disconnect();}
   context.close().catch(()=>{});
  },650);
 }
 window.addEventListener('belvedere:tavern-enter',stop);
 apply();resume();
 return {
  setStage(next){next=next==='map'?'map':'road';if(disposed||stage===next)return;stage=next;if(next==='map')loading.currentTime=0;apply();},
  setPaused(value){paused=value;sync();},
  status:()=>({stage,muted,paused,context:context.state,failures:[...failures],tracks:Object.fromEntries(Object.entries(tracks).map(([name,t])=>[name,{ready:!!t.source,gain:t.gain.gain.value,playing:t.media?!t.media.paused:!disposed&&context.state==='running',duration:t.media?.duration||t.source?.buffer?.duration||0}]))})
 };
}
