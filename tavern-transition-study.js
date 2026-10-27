// Real tavern transition candidates for the local audition endpoint.
export function createTavernTransition({pauseGate}={}){
 let frame,curtain,ready=false,failed=false,entered=false,waiting=false,poll,preparedAt=0,variant='amber',busy=false,covered=false,selection=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const emit=(type,extra={})=>parent.postMessage({channel:'belvedere-sound-study',type,...extra},location.origin);
 async function animate(el,keys,duration){const a=el.animate(keys,{duration:reduced?140:duration,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});await a.finished;Object.assign(el.style,keys.at(-1));a.cancel();}
 function makeUI(){
  frame=document.createElement('iframe');frame.id='sound-study-tavern';frame.title='贝尔维德酒馆二楼';frame.allow='autoplay; fullscreen';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:100010;background:#120e14';document.body.append(frame);
  curtain=document.createElement('div');curtain.id='sound-study-cinema';curtain.style.cssText='position:fixed;inset:0;z-index:200100;pointer-events:none;display:none;background:#100d14;opacity:0';document.body.append(curtain);
 }
 function prepare(){if(frame)return;makeUI();preparedAt=Date.now();frame.src='/tavern/?rooms=1&repairCache=1&v=audio-cinema';poll=setInterval(()=>{const state=frame.contentWindow.__tavern?.state();if(state?.ready&&state.firstFrameReady){ready=true;failed=false;clearInterval(poll);emit('tavern-ready');}else if(Date.now()-preparedAt>180000){failed=true;clearInterval(poll);emit('error',{message:'酒馆准备超时，可重新开始试听。'});}},100);}
 async function whenReady(){prepare();if(failed)throw Error('酒馆准备超时，请重新开始试听');const start=Date.now();while(!ready){if(failed||Date.now()-start>180000)throw Error('酒馆尚未准备好，请重试');await new Promise(r=>setTimeout(r,100));}}
 async function cover(){
  curtain.style.display='block';curtain.style.opacity='0';curtain.style.clipPath='none';curtain.style.background=variant==='amber'?'radial-gradient(ellipse at 64% 40%,#7c5634,#322131 60%,#140f1b)':'#100d14';
  if(variant==='curtain')await animate(curtain,[{opacity:'1',clipPath:'inset(50% 0 50% 0)'},{opacity:'1',clipPath:'inset(0% 0 0% 0)'}],650);
  else await animate(curtain,[{opacity:'0'},{opacity:'1'}],variant==='amber'?800:550);
  covered=true;
 }
 async function uncover(){
  if(variant==='curtain')await animate(curtain,[{opacity:'1',clipPath:'inset(0% 0 0% 0)'},{opacity:'1',clipPath:'inset(50% 0 50% 0)'}],950);
  else await animate(curtain,[{opacity:'1'},{opacity:'0'}],variant==='amber'?1250:1000);
  curtain.style.display='none';curtain.style.clipPath='none';covered=false;
 }
 async function setCharacter(s){
  waiting=true;emit('preparing-entry');
  try{await whenReady();await frame.contentWindow.__tavern.setCharacter(s.id,s.name,s.direction);selection=s;window.__gateSoundStudy?.selectionConfirmed();await cover();}
  catch(e){waiting=false;curtain.style.display='none';window.__gateSoundStudy?.selectionFailed();throw e;}
 }
 async function enter(){
  if(entered||busy)return;busy=true;waiting=true;
  try{await whenReady();if(!covered){window.__gateSoundStudy?.selectionConfirmed();await cover();}
   frame.style.opacity='1';frame.style.pointerEvents='none';frame.inert=false;frame.contentWindow.__tavern.activate();
   window.__belvedereScreen?.hideControls();window.dispatchEvent(new Event('belvedere:tavern-enter'));pauseGate?.();
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await uncover();entered=true;waiting=false;frame.style.pointerEvents='auto';frame.contentWindow.focus();emit('entered',{variant,selection});
  }catch(e){emit('error',{message:'转场未完成：'+e.message});}finally{busy=false;}
 }
 async function preview(){if(!entered||busy){emit('error',{message:'先确认人物进入酒馆，再使用“重看转场”。'});return;}busy=true;frame.style.pointerEvents='none';try{await cover();await uncover();emit('cinema-preview',{variant});}finally{busy=false;frame.style.pointerEvents='auto';}}
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.channel!=='belvedere-sound-control')return;if(e.data.action==='cinema'&&['fade','amber','curtain'].includes(e.data.value)&&!busy&&!waiting)variant=e.data.value;if(e.data.action==='cinema-preview')void preview();});
 window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
 return {prepare,cacheGate:async()=>{},whenReady,setCharacter,enter,preview,retry:()=>location.reload(),status:()=>({ready,failed,entered,waiting,returning:false,variant,busy,selection})};
}
