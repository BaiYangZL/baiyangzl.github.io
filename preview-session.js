// Some embedded browsers report every retained tab as visible and focused.
// Explicit ownership prevents several game canvases and ambience buses running together.
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('belvedere-playing-tab-v1'):null;
const id=crypto.randomUUID();let owner={time:0,id:''},engine=null,overlay=null;
function apply(active){
 const changed=window.__gamePreviewInactive===active;window.__gamePreviewInactive=!active;
 if(active){overlay?.remove();overlay=null;if(engine&&!document.hidden&&!document.querySelector('[data-function-panel]'))engine.resume();}
 else {engine?.pause();if(!overlay){overlay=document.createElement('button');overlay.id='resume-game-preview';overlay.textContent='此预览已暂停 · 点击继续';overlay.style.cssText='position:fixed;inset:40% 20%;z-index:99999;background:#241c18ee;color:#f4dfb2;border:1px solid #aa8955;border-radius:12px;font:18px system-ui;cursor:pointer';overlay.onclick=claim;document.body.append(overlay);}}
 if(changed)window.dispatchEvent(new CustomEvent('game-preview-activity',{detail:{active}}));
}
function claim(){if(!window.__gamePreviewInactive&&owner.id===id)return;owner={time:Date.now(),id};apply(true);channel?.postMessage(owner);}
channel?.addEventListener('message',({data})=>{if(!data||typeof data.time!=='number'||typeof data.id!=='string')return;if(data.time>owner.time||(data.time===owner.time&&data.id>owner.id)){owner=data;apply(data.id===id);}});
const supportedRates=[30,60,120];
let limit=60;try{const saved=Number(localStorage.getItem('belvedere-frame-limit-v1'));if(supportedRates.includes(saved))limit=saved;}catch{}
window.__gameFrameLimit={get:()=>limit,set(value){limit=supportedRates.includes(Number(value))?Number(value):60;try{localStorage.setItem('belvedere-frame-limit-v1',String(limit));}catch{}if(engine)engine.frameRate=limit;}};
window.__gamePreviewSession={bind(game){engine=game;
 if(!game.__previewFrameCap){let proto=game,descriptor;while(proto&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(proto,'frameRate');proto=Object.getPrototypeOf(proto);}if(descriptor?.get&&descriptor?.set){Object.defineProperty(game,'frameRate',{configurable:true,get:()=>descriptor.get.call(game),set:value=>{const next=value>=60?limit:Math.min(value,limit);if(descriptor.get.call(game)!==next)descriptor.set.call(game,next);}});game.__previewFrameCap=true;}}
 game.frameRate=limit;apply(!window.__gamePreviewInactive);},claim};
window.addEventListener('pointerdown',e=>{if(!e.target.closest?.('#resume-game-preview'))claim();},{capture:true});window.addEventListener('keydown',claim,{capture:true});
claim();
