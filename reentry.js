import {openReentryPanel} from './reentry-panel.js?v=reentry-20261026';
let opening=false;
async function open(button){
 const api=window.__tavern,state=api?.state();
 if(opening||!state?.entered||state.transitioning||state.contextLost)return;
 opening=true;button.disabled=true;
 let engine,wasPaused=true,navigating=false;
 const gameRoot=document.getElementById('GameDiv'),oldInert=gameRoot?.inert;
 try{
  engine=await window.System.import('cc');wasPaused=engine.game.isPaused();
  window.dispatchEvent(new Event('blur'));api.place(state.x,state.z);engine.game.pause();
  if(gameRoot)gameRoot.inert=true;
  let host;try{if(parent!==window&&parent.__tavernEntry?.restart)host=parent.__tavernEntry;}catch{}
  const b=button.getBoundingClientRect(),originRect={x:b.x,y:b.y,width:b.width,height:b.height};
  const confirmed=await (host?host.showReentry({originRect}):openReentryPanel({originElement:button}));
  if(confirmed){
   // Save through the game's own pagehide handler before leaving the document.
   window.dispatchEvent(new Event('pagehide'));
   if(host)host.restart();
   else{
    const url=new URL('../cold-entry.html',import.meta.url);
    if(location.port==='4195'&&['localhost','127.0.0.1'].includes(location.hostname)){url.port='4198';url.pathname='/cold-entry.html';}
    url.searchParams.set('rooms',new URLSearchParams(location.search).get('rooms')==='0'?'0':'1');
    for(const key of ['quality','q','weather','time']){const value=new URL(location.href).searchParams.get(key);if(value!==null)url.searchParams.set(key,value);}
    url.searchParams.set('reenter','1');url.searchParams.set('v','reentry-20261026');
    for(const key of ['belvedere-tavern-return','belvedere-tavern-ready-day'])try{localStorage.removeItem(key);}catch{}
    location.assign(url.href);
   }
   navigating=true;
  }
 }catch(error){console.warn('重新入场面板暂未打开',error);const note=document.querySelector('#tavern-ui .note');if(note)note.textContent='重新入场暂时未能打开，请重试。';}
 finally{
  if(!navigating){if(gameRoot)gameRoot.inert=oldInert;window.dispatchEvent(new Event('blur'));const current=api.state();api.place(current.x,current.z);if(engine&&!wasPaused&&!current.contextLost)engine.game.resume();window.focus();button.focus({preventScroll:true});}
  opening=false;button.disabled=false;
 }
}
function install(){
 const views=document.querySelector('#tavern-ui .views');
 if(!views||!window.__tavern?.state().firstFrameReady){requestAnimationFrame(install);return;}
 if(document.getElementById('reentry'))return;
 const button=document.createElement('button');button.id='reentry';button.type='button';button.textContent='↻ 清空缓存并重新进入';button.title='清除游戏缓存和存档，重新命名、选角并从初始位置开始';button.onclick=()=>open(button);
 button.style.cssText='background:linear-gradient(145deg,#f4f0e8e6,#ded6d3cc);color:#393034;border-color:#ffffffa6;min-height:44px';views.append(button);
 let start,last=-1000;
 button.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){e.preventDefault();start={id:e.pointerId,x:e.clientX,y:e.clientY};}});
 button.addEventListener('pointerup',e=>{const s=start;start=null;if(!s||s.id!==e.pointerId||Math.hypot(e.clientX-s.x,e.clientY-s.y)>12)return;e.preventDefault();last=performance.now();button.click();});
 button.addEventListener('pointercancel',()=>{start=null;});button.addEventListener('click',e=>{if(e.isTrusted&&performance.now()-last<500){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
}
install();
