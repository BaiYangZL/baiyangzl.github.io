import './preview-session.js';
import './room-state.js';
import {soundSurfaces,surfaceAt} from './sound-surfaces.js';
import {indoorRain} from './indoor-rain.js';
import {volume} from './game-volume.js';
const manifest=await fetch(new URL('./selected-sounds.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('音效清单读取失败');return r.json();});
const AC=window.AudioContext||window.webkitAudioContext,ctx=AC?new AC():null;
const buses=ctx?{effects:volume.gain(ctx,'effects'),ambience:volume.gain(ctx,'ambience')}:{};
const fileBuffers=new Map(),buffers=new Map(),pending=new Map(),failed=new Set(),loops=new Map(),lastVariant=new Map(),events=[];let previous=null,cc=null,regions=[],wallWindows=[],windows=new Map(),active=true;
function get(id){if(failed.has(id))return Promise.resolve([]);if(buffers.has(id))return Promise.resolve(buffers.get(id));if(pending.has(id))return pending.get(id);const choice=manifest.choices[id];if(!choice||!ctx)return Promise.resolve([]);const task=Promise.all(choice.files.map(async file=>{if(!fileBuffers.has(file)){const task=fetch(new URL('./assets/'+file,import.meta.url)).then(r=>{if(!r.ok)throw Error(file);return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b));fileBuffers.set(file,task);}return fileBuffers.get(file);})).then(b=>{buffers.set(id,b);pending.delete(id);return b;}).catch(e=>{pending.delete(id);failed.add(id);console.warn('Sound unavailable',id,e);return[];});pending.set(id,task);return task;}
let lastFootAt=-Infinity,footVoice=null,lastScan=0,doorTrip=null,cuesReady=false;
window.addEventListener('tavern-room-opening',e=>{doorTrip=e.detail;const stair=floorOf(doorTrip.from)!==floorOf(doorTrip.to);if(stair){doorTrip.close=null;const s=window.__tavern.state(),id=`foot_${manifest.characters[s.characterId]}_stairs_${s.movement.mode}`;void get(id).then(()=>{play(id);setTimeout(()=>{if(doorTrip&&stair)play(id)},420);});return;}const corridor=[doorTrip.from,doorTrip.to].includes('corridor-upper');const special=!corridor&&['upper','room-hall'].includes(doorTrip.to);doorTrip.close=special?null:([doorTrip.from,doorTrip.to].includes('room-storage')?'storage_close':'door_close');play(special?'room_transition':doorTrip.close==='storage_close'?'storage_open':'door_open');});
function play(id){if(!ctx||ctx.state!=='running'||!active||!manifest.choices[id])return;const b=buffers.get(id);if(!b){void get(id);return;}const foot=id.startsWith('foot_');if(foot&&ctx.currentTime-lastFootAt<.22)return;if(foot){lastFootAt=ctx.currentTime;if(footVoice){const t=ctx.currentTime;footVoice.g.gain.cancelScheduledValues(t);footVoice.g.gain.setValueAtTime(footVoice.g.gain.value,t);footVoice.g.gain.linearRampToValueAtTime(0,t+.008);try{footVoice.s.stop(t+.009);}catch{}}}let n=Math.floor(Math.random()*b.length);if(n===lastVariant.get(id))n=(n+1)%b.length;lastVariant.set(id,n);const s=ctx.createBufferSource();s.buffer=b[n];const g=ctx.createGain();g.gain.value=manifest.choices[id].gains?.[n]??1;s.connect(g);g.connect(buses.effects.node);s.start();if(foot)footVoice={s,g};s.onended=()=>{if(footVoice?.s===s)footVoice=null;s.disconnect();g.disconnect();};events.push(id);if(events.length>60)events.shift();}
async function loop(id,gain){
 if(!manifest.choices[id]||!ctx)return;let entry=loops.get(id);
 if(!entry&&gain<=0)return;
 if(entry){entry.gain=gain;if(entry.g)entry.g.gain.setTargetAtTime(active?gain*(manifest.choices[id].gains?.[0]??1):0,ctx.currentTime,.25);return;}
 entry={gain,loading:true};loops.set(id,entry);const b=await get(id);
 if(!b.length){loops.delete(id);return;}
 const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=b[0];source.loop=true;g.gain.value=0;source.connect(g);g.connect(buses.ambience.node);Object.assign(entry,{s:source,g,loading:false});source.start();
 // Use the latest position/weather target after decoding, not the old request.
 g.gain.setTargetAtTime(active?entry.gain*(manifest.choices[id].gains?.[0]??1):0,ctx.currentTime,.25);
}
const unlock=()=>{if(!window.__gamePreviewInactive&&ctx&&ctx.state!=='running')ctx.resume().catch(()=>{});};document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
window.addEventListener('game-preview-activity',e=>{if(e.detail.active)unlock();else {active=false;previous=null;ctx?.suspend();}});
document.addEventListener('visibilitychange',()=>{active=!document.hidden;previous=null;if(!active)ctx?.suspend();else unlock();});
const surfaceCache=new Map(),scanStats=[];
function scan(){if(!cc)return;const id=window.__tavern?.state().floor;if(!id)return;if(!surfaceCache.has(id)){const start=performance.now(),found=soundSurfaces(cc);surfaceCache.set(id,found.regions);scanStats.push({room:id,ms:performance.now()-start});}regions=surfaceCache.get(id);wallWindows=[];}
window.addEventListener('tavern-room-ready',()=>scan());
function surface(s){return surfaceAt(regions,s);}
function floorOf(id){const seen=new Set();while(manifest.floors[id]&&manifest.floors[id]!==id&&!seen.has(id)){seen.add(id);id=manifest.floors[id];}return id;}
function isNight(){const label=document.querySelector('#time-of-day')?.textContent;if(label?.includes('白天'))return false;if(label?.includes('夜晚'))return true;return (new URLSearchParams(location.search).get('time')||localStorage.getItem('belvedere-time-v1')||'night')==='night';}
function weather(){return new URLSearchParams(location.search).get('weather')||sessionStorage.getItem('belvedere-weather')||'rain';}
async function tick(){
 try{if(!cc&&window.System&&window.__tavern?.state().entered){cc=await System.import('cc');window.__gamePreviewSession?.bind(cc.game);}if(window.__gamePreviewInactive){active=false;ctx?.suspend();previous=null;return;}const api=window.__tavern,s=api?.state();if(!s?.entered||!ctx){previous=null;return;}
 if(!cuesReady){cuesReady=true;for(const id of ['door_open','door_close','storage_open','storage_close','room_transition'])void get(id);}
 const blocked=document.hidden||!!document.querySelector('[data-function-panel]')||s.contextLost;
 active=!blocked;
 if(!s.transitioning&&(!lastScan||previous?.floor!==s.floor||previous?.transitioning)){scan();lastScan=performance.now();}
 if(!previous||previous.floor!==s.floor||previous.characterId!==s.characterId){windows=new Map();const shoe=manifest.characters[s.characterId];for(const id of Object.keys(manifest.choices))if(id.startsWith('foot_'+shoe+'_wood')||id.startsWith('foot_'+shoe+'_carpet')||id.startsWith('foot_'+shoe+'_mat')||id==='curtain')void get(id);}
 if(previous&&!blocked){if(!s.transitioning&&doorTrip){if(!s.transitionError&&doorTrip.close)play(doorTrip.close);doorTrip=null;}
  const moved=Math.hypot(s.x-previous.x,s.z-previous.z);if(!s.transitioning&&s.floor===previous.floor&&s.characterId===previous.characterId&&s.gait.moving&&moved>.001&&moved<1&&Math.floor(s.gait.frame/4)!==Math.floor(previous.gait.frame/4)){play(`foot_${manifest.characters[s.characterId]}_${surface(s)}_${s.movement.mode}`);}}
 const roomObjects=api.objects();const objects=roomObjects.filter(o=>o.interactive==='window').map(o=>({...o,canClose:true}));
 for(const o of objects){if(previous?.floor===s.floor&&windows.has(o.id)&&windows.get(o.id)!==o.on&&o.parts?.some(p=>/CurtainSlide|BlindSlide/.test(p.name)))play('curtain');windows.set(o.id,o.on);}
 const mix=indoorRain({room:s.floor,x:s.x,z:s.z,raining:weather()==='rain',night:isNight(),windows:[...objects,...wallWindows],blocked:blocked||s.transitioning});for(const [id,gain]of Object.entries(mix))void loop(id,gain);
 const fire=roomObjects.filter(o=>/^hearth/.test(o.model));const fireGain=blocked||s.transitioning?0:Math.max(0,...fire.map(o=>Math.max(0,1-Math.hypot(s.x-o.x,s.z-o.z)/4)**2));void loop('fireplace',fireGain);
 previous=s;
 }catch(e){console.warn('Selected sounds update',e);}finally{setTimeout(tick,40);}}
if(ctx)void tick();
window.__selectedSounds={manifest,events,play,surface,isNight,scanStats,get regions(){return regions;},get windowSources(){return [...wallWindows,...(window.__tavern?.objects()||[]).filter(o=>o.interactive==='window').map(o=>({id:o.id,x:o.x,z:o.z,on:o.on}))];},get ambiencePlayback(){return {context:ctx?.state,loops:Object.fromEntries([...loops].map(([id,e])=>[id,{loading:e.loading,gain:e.g?.gain.value??0,target:e.gain}]))};},get ambience(){return Object.fromEntries([...loops].map(([id,e])=>[id,e.gain]));},get loaded(){return [...buffers.keys()]}};
