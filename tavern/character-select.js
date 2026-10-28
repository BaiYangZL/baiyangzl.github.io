import {Spring,chooseGreeting,readSaved,saveValue} from './selection-core.js?v=wardrobe-20261026';
import {createFunctionPanel} from './function-panel.js?v=wardrobe-20261026';
import {createHeroGreeting} from './hero-greeting.js?v=hero-greeting-20261026';
const base=new URL('./',import.meta.url),url=p=>new URL(p,base).href;
const image=p=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>i.decode().then(()=>ok(i),no);i.onerror=()=>no(Error('人物图片未能载入，请重试。'));i.src=url(p);});
let catalogTask,activeSelection;
const readyCharacters=new Map();
const catalog=()=>catalogTask??=fetch(url('character-catalog.json?v=portrait-fit-20261026')).then(r=>{if(!r.ok)throw Error('角色清单未能载入');return r.json();}).catch(e=>{catalogTask=null;throw e;});
function prepareCharacter(c){if(!readyCharacters.has(c.id))readyCharacters.set(c.id,Promise.all([image(c.hero),image(c.dialogue),image(c.atlas),fetch(url(c.atlasData)).then(r=>{if(!r.ok)throw Error('人物动作未能载入');return r.json();})]).then(([heroImage,portraitImage,atlasImage,atlasData])=>({...c,heroImage,portraitImage,atlasImage,atlasData})).catch(e=>{readyCharacters.delete(c.id);throw e;}));return readyCharacters.get(c.id);}
export async function prepareCharacters(){return Promise.all((await catalog()).map(prepareCharacter));}
const arrow='<svg viewBox="0 0 32 32"><path d="M5 16h22M18 7l9 9-9 9"/></svg>';
const check='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 16 6 6L26 9"/></svg>';
export function openCharacterSelection(options={}){
 if(activeSelection)return activeSelection;
 activeSelection=showSelection(options).finally(()=>{activeSelection=null;});return activeSelection;
}
async function showSelection({onConfirm=async()=>{},initialId,initialName,initialDirection,mode='entry',originElement,originRect,morphFrom,onAttached=()=>{}}={}){
 let storage;try{storage=localStorage;}catch{}
 const saved=readSaved(storage,'belvedere-character-v1',{}),wardrobe=mode==='wardrobe',reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(!document.querySelector('link[data-character-style]')){const l=document.createElement('link');l.rel='stylesheet';l.href=url('character-select.css?v=entry-wardrobe-clean-20261029');l.dataset.characterStyle='';document.head.append(l);await new Promise(resolve=>{l.onload=resolve;l.onerror=resolve;});}
 const focusBefore=document.activeElement,origin=originRect||(originElement||morphFrom)?.getBoundingClientRect();
 const original=morphFrom?{parent:morphFrom.parentNode,next:morphFrom.nextSibling,attrs:Array.from(morphFrom.attributes,a=>[a.name,a.value]),children:Array.from(morphFrom.childNodes)}:null;
 const root=morphFrom||document.createElement('section'),shade=document.createElement('div');shade.className='cs-shield';shade.setAttribute('aria-hidden','true');
 if(original)root.replaceChildren();root.className='cs-root cs-loading cs-wardrobe'+(wardrobe?'':' cs-entry');root.removeAttribute('style');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',wardrobe?'衣橱 · 更换角色':'选择本次进入的角色');root.tabIndex=-1;
 root.innerHTML='<div class="cs-load-label" role="status">'+(wardrobe?'正在打开衣橱…':'密语验证完成 · 正在准备人物…')+'</div>';
 document.body.append(shade,root);onAttached();
 const now=()=>performance.now()/1000;
 const contentElements=[];let stopped=false,closing=false,busy=false,phase='loading',raf=0,list=[],selected=0,direction=initialDirection||saved.direction||'S',layers=[],requested=0,drag=null;
 let stage,hero,portrait,greeting,name,confirm,error,choices,resolveDone,portraitObserver;
 const done=new Promise(r=>resolveDone=r),memo=new Map(),prepared=new Map(),colors=[new Spring(180),new Spring(62),new Spring(91)],dragMotion=new Spring(0,22),directionMark=new Spring(['S','N','W','E'].indexOf(direction),22);
 const content=new Spring(0,24),heroGreeting=createHeroGreeting({reduced});let lastDirectionKey='',switchDirection=1,lastSelectedAt=0,arrivalAt=0,stageScale=1;
 const $=s=>root.querySelector(s),dirs=[['S','前'],['N','后'],['W','左'],['E','右']];
 function cleanup(result){if(stopped)return;stopped=true;cancelAnimationFrame(raf);heroGreeting.dispose();portraitObserver?.disconnect();panel.dispose();shade.remove();root.remove();if(original){root.replaceChildren(...original.children);for(const a of Array.from(root.attributes))root.removeAttribute(a.name);for(const [n,v]of original.attrs)root.setAttribute(n,v);original.parent.insertBefore(root,original.next?.isConnected?original.next:null);}focusBefore?.isConnected&&focusBefore.focus({preventScroll:true});resolveDone(result);}
 let closeResult=null,closeStarted=0;
 function close(result=null){if(busy||closing)return;closing=true;closeResult=result;closeStarted=now();phase='closing';root.dataset.phase=phase;content.to(0,closeStarted);panel.close(closeStarted);root.style.pointerEvents='none';}
 function attachClose(){if(!wardrobe)return;const b=document.createElement('button');b.className='cs-close';b.type='button';b.setAttribute('aria-label','关闭衣橱，返回游戏');b.innerHTML='<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>';b.onclick=()=>close();root.append(b);}
 attachClose();root.focus({preventScroll:true});
 root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'&&wardrobe){e.preventDefault();close();}if(e.key==='Tab'){const controls=[...root.querySelectorAll('button,input,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length),first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 const panel=createFunctionPanel(root,{originRect:origin,shade,onLayout:(w,h)=>{
  const compact=w<=650&&h>w,landscape=w<=1050&&w>h&&h<=650;root.classList.toggle('cs-compact',compact);root.classList.toggle('cs-landscape',landscape);if(stage){stageScale=compact||landscape?1:Math.min(w/1672,h/941);stage.style.transform=compact||landscape?'none':`translate(-50%,-50%) scale(${stageScale})`;}
 }});
 const logicalPoint=(x,y)=>panel.point(x,y),resize=()=>panel.resize();
 panel.draw(now());
 function getGreeting(c){if(!memo.has(c.id))memo.set(c.id,chooseGreeting(readSaved(storage,'belvedere-greeting-v1-'+c.id),c.firstGreeting,c.greetings));return memo.get(c.id);}
 // Fit a source-image head/shoulder region, not offsets relative to a changing viewport.
 function fitPortrait(c,img){
  const crop=c.portraitCrop?.height?c.portraitCrop:{x:0,y:0,width:1,height:.42};
  const iw=c.portraitImage.naturalWidth,ih=c.portraitImage.naturalHeight,w=portrait.clientWidth,h=portrait.clientHeight;
  const rw=iw*crop.width,rh=ih*crop.height,scale=Math.min(w/rw,h/rh);
  Object.assign(img.style,{width:iw*scale+'px',height:ih*scale+'px',left:((w-rw*scale)/2-iw*crop.x*scale)+'px',top:((h-rh*scale)/2-ih*crop.y*scale)+'px'});
 }
 function makeLayer(c){const h=document.createElement('div'),still=c.heroImage.cloneNode();h.className='cs-hero';h.dataset.character=c.id;still.className='cs-hero-still';still.alt=c.name+'展示立绘';h.append(still);hero.append(h);let p,q,g;
  {p=document.createElement('div');q=document.createElement('div');p.className='cs-portrait-layer';const pi=c.portraitImage.cloneNode();pi.alt=c.name+'聊天图预览';p.append(pi);q.className='cs-quote-layer';const text=document.createElement('p');text.textContent='「'+getGreeting(c)+'」';q.append(text);g=c.heroImage.cloneNode();g.alt='';g.setAttribute('aria-hidden','true');$('.cs-ghost').append(g);portrait.append(p);greeting.append(q);fitPortrait(c,pi);}
  const l={c,h,p,q,g,alpha:new Spring(0,30),portrait:new Spring(0,32),quote:new Spring(0,34),sprites:new Spring(0,30),x:new Spring(switchDirection*20,24),activeAt:0,greetingRequest:0};layers.push(l);return l;}
 function drawDirections(){for(const b of root.querySelectorAll('.cs-direction'))b.setAttribute('aria-pressed',String(b.dataset.direction===direction));directionMark.to(dirs.findIndex(([d])=>d===direction),now());}
 async function select(index,first=false){if(busy||closing)return;index=(index+list.length)%list.length;if(!first&&index===selected&&!root.classList.contains('cs-preparing'))return;switchDirection=index===selected?switchDirection:(index>selected?1:-1);selected=index;lastSelectedAt=now();const request=++requested;const c=list[index];root.dataset.selected=c.id;choices.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===c.id)));error.textContent='';
  if(!prepared.has(c.id)){root.classList.add('cs-preparing');$('.cs-helper').textContent='正在准备'+c.name+'… 当前画面会保留。';confirm.disabled=true;try{prepared.set(c.id,await prepareCharacter(c));}catch(e){if(request===requested){error.textContent=e.message;$('.cs-helper').textContent='点击角色名称可重新准备。';}return;}if(request!==requested||closing||stopped)return;}
  root.classList.remove('cs-preparing');confirm.disabled=false;$('.cs-helper').textContent=wardrobe?'确认才会更换；关闭可回到原来的旅人。':'选好模样，留下这次旅行的名字。';
  if(!layers.some(l=>l.c.id===c.id))makeLayer(prepared.get(c.id));layers.find(l=>l.c.id===c.id).greetingRequest=request;
  const t=now();for(const l of layers)if(l.c.id!==c.id){l.alpha.to(0,t);l.portrait.to(0,t);l.quote.to(0,t);l.sprites.to(0,t);l.x.to(-switchDirection*16,t);l.activeAt=0;}
  if(first){const l=layers.find(l=>l.c.id===c.id);l.activeAt=t;l.alpha.to(1,t);l.x.to(0,t);}
  const rgb=c.accent.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));rgb.forEach((v,i)=>colors[i].to(v,t));drawDirections();
 }
 function render(t){const envelope=panel.draw(t);if(envelope.closed){cleanup(closeResult);return;}
  if(stage){const k=reduced?(closing?0:1):Math.min(content.at(t),Math.max(0,(envelope.progress-.25)/.75));contentElements.forEach(el=>el.style.opacity=String(k));root.style.setProperty('--accent',`rgb(${colors.map(c=>Math.round(c.at(t))).join(',')})`);
   const target=layers.find(l=>l.c.id===list[selected]?.id);if(target&&!root.classList.contains('cs-preparing')&&!closing){const others=layers.filter(l=>l!==target);if(others.every(l=>l.alpha.at(t)<.09)){if(!target.activeAt){target.activeAt=t;arrivalAt=t;}target.alpha.to(1,t);target.x.to(0,t);}if(target.activeAt){if(t-target.activeAt>.04&&others.every(l=>l.portrait.at(t)<.06))target.portrait.to(1,t);if(t-target.activeAt>.08&&others.every(l=>l.quote.at(t)<.025))target.quote.to(1,t);if(t-target.activeAt>.12&&others.every(l=>l.sprites.at(t)<.06))target.sprites.to(1,t);}}
   heroGreeting.update(target,t,{enabled:!!target&&target.alpha.at(t)>.99&&k>.98&&!closing&&!root.classList.contains('cs-preparing')&&!document.hidden});
   let repaint=false;const dx=drag?drag.dx:dragMotion.at(t);
   for(const l of layers){for(const [el,s]of [[l.h,l.alpha],[l.p,l.portrait],[l.q,l.quote],[l.g,l.alpha]]){const a=Math.max(0,Math.min(1,s.at(t))),move=reduced?0:l.x.at(t)+(el===l.h?dx:0);el.style.opacity=a;el.style.transform=`translateX(${move}px)`;el.style.filter=reduced||a>.99||a<.02?'none':`blur(${(1-a)*1.6}px)`;el.style.visibility=a<.001?'hidden':'visible';}if(Math.abs(l.sprites.at(t)-l.sprites.goal)>.001)repaint=true;}
   const directionKey=list[selected]?.id+':'+direction+':'+layers.map(l=>l.sprites.at(t).toFixed(3)).join(':');if(repaint||directionKey!==lastDirectionKey){lastDirectionKey=directionKey;for(const b of root.querySelectorAll('.cs-direction')){const ctx=b.querySelector('canvas').getContext('2d');ctx.clearRect(0,0,192,192);ctx.imageSmoothingEnabled=false;for(const l of layers){const f=l.c.atlasData.frames[l.c.atlasData.clips['idle-'+b.dataset.direction][0]];ctx.globalAlpha=l.sprites.at(t);ctx.drawImage(l.c.atlasImage,...f.frame,0,0,192,192);}ctx.globalAlpha=1;}}
   const mark=$('.cs-direction-mark'),buttons=root.querySelectorAll('.cs-direction');if(mark&&buttons.length){const a=buttons[0],b=buttons[1],x=directionMark.at(t);mark.style.width=a.offsetWidth+'px';mark.style.height=a.querySelector('.cs-sprite-frame').offsetHeight+'px';mark.style.transform=`translateX(${x*(b.offsetLeft-a.offsetLeft)}px)`;}
  }
  if(!stopped)raf=requestAnimationFrame(ms=>render(ms/1000));
 }
 raf=requestAnimationFrame(ms=>render(ms/1000));
 async function initialize(){try{list=await catalog();selected=Math.max(0,list.findIndex(c=>c.id===(initialId||saved.id)));const first=await prepareCharacter(list[selected]);if(stopped||closing)return;prepared.set(first.id,first);root.classList.remove('cs-loading');
 root.innerHTML=`<div class="cs-stage"><div class="cs-ghost"></div><div class="cs-script">Belvedere</div><svg class="cs-crest" viewBox="0 0 30 36"><path d="m15 2 12 5-2 16-10 11L5 23 3 7Z M15 7v21M9 12h12M9 12v10l6 5 6-5V12"/></svg><i class="cs-crest-line"></i><div class="cs-brand">BELVEDERE</div><div class="cs-password"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h2v11H5V10Zm2 0h6V7a3 3 0 0 0-6 0Zm2 4v4h2v-4Z"/></svg>••••••</div><div class="cs-password-arrow">→</div><div class="cs-seal">${check}</div><svg class="cs-neck" viewBox="0 0 81 72"><path d="M40 0v22C40 53 20 66 0 72h81C60 66 41 53 41 22V0Z"/></svg><div class="cs-surface"></div><div class="cs-monogram">BEL<br>VED<small>CHARACTER<br>SELECTION</small></div><div class="cs-welcome">WELCOME<br>TO<br>BELVEDERE</div><div class="cs-hero-stack" tabindex="0" role="group" aria-label="人物立绘，可左右拖动换人"></div><div class="cs-greeting" aria-live="polite"><span class="cs-ellipsis">「……</span></div><div class="cs-name"><label for="cs-visit-name"><svg viewBox="0 0 24 24"><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 21v-4c0-7 18-7 18 0v4Z"/></svg></label><input id="cs-visit-name" maxlength="16" autocomplete="nickname" aria-label="本次使用的名字" placeholder="本次使用的名字"><svg class="cs-pencil" viewBox="0 0 24 24"><path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/></svg></div><div class="cs-directions-title">角色朝向</div><div class="cs-directions"></div><button class="cs-confirm"><span class="cs-confirm-label">进入贝尔维德</span><span class="cs-arrow-circle">${arrow}</span></button><div class="cs-error" role="alert"></div><div class="cs-helper">选好模样，留下这次旅行的名字。</div><nav class="cs-chooser" aria-label="切换角色"></nav><div class="cs-footer">A PLACE<br>FOR THOSE<br>WHO REMEMBER.</div><i class="cs-rule"></i></div>`;
 attachClose();stage=$('.cs-stage');hero=$('.cs-hero-stack');portrait=document.createElement('div');greeting=$('.cs-greeting');name=$('input');confirm=$('.cs-confirm');error=$('.cs-error');choices=$('.cs-chooser');
 name.value=initialName??saved.name??'';if(wardrobe){$('.cs-confirm-label').textContent='确认更换';$('.cs-password').textContent='WARDROBE';$('.cs-helper').textContent='确认才会更换；关闭可回到原来的旅人。';}
 // The reference layout is stable. Only the enclosing panel grows and contracts.
 Object.assign($('.cs-surface').style,{left:'96px',top:'156px',width:'1480px',height:'702px',borderRadius:'50px'});
 contentElements.push(...root.querySelectorAll('.cs-monogram,.cs-welcome,.cs-hero-stack,.cs-portrait-box,.cs-greeting,.cs-name,.cs-directions-title,.cs-directions,.cs-confirm,.cs-chooser,.cs-helper,.cs-neck'));
 dirs.forEach(([d,label])=>{const b=document.createElement('button');b.className='cs-direction';b.setAttribute('aria-label',label+'视图');b.innerHTML='<div class="cs-sprite-frame"><canvas width="192" height="192"></canvas></div><span>'+label+'</span>';b.dataset.direction=d;b.onclick=()=>{direction=d;drawDirections();};$('.cs-directions').append(b);});const mark=document.createElement('i');mark.className='cs-direction-mark';$('.cs-directions').append(mark);
 const button=(text,fn,cls)=>{const b=document.createElement('button');b.textContent=text;b.className=cls||'';b.onclick=fn;choices.append(b);return b;};button('‹',()=>select(selected-1),'cs-prev').ariaLabel='上一个角色';list.forEach((c,i)=>{button(c.name,()=>select(i)).dataset.character=c.id;});button('›',()=>select(selected+1),'cs-next').ariaLabel='下一个角色';
 resize();portraitObserver?.disconnect();portraitObserver=new ResizeObserver(()=>layers.forEach(l=>fitPortrait(l.c,l.p.querySelector('img'))));portraitObserver.observe(portrait);await select(selected,true);phase='selecting';root.dataset.phase=phase;content.to(1,now());
 // Neighbours decode without hiding the selected character or blocking controls.
 list.forEach(c=>{if(!prepared.has(c.id))prepareCharacter(c).then(c=>prepared.set(c.id,c)).catch(()=>{});});
 hero.onpointerdown=e=>{if(busy||closing||e.button>0)return;hero.setPointerCapture(e.pointerId);const x=logicalPoint(e.clientX,e.clientY).x;drag={id:e.pointerId,start:x,last:x,time:now(),dx:dragMotion.at(now()),base:dragMotion.at(now()),velocity:dragMotion.sample(now()).velocity};};
 hero.onpointermove=e=>{if(drag?.id!==e.pointerId)return;const x=logicalPoint(e.clientX,e.clientY).x,t=now(),dt=t-drag.time;drag.velocity=dt>0?(x-drag.last)/stageScale/dt:drag.velocity;drag.dx=drag.base+(x-drag.start)/stageScale;drag.last=x;drag.time=t;};
 const end=e=>{if(drag?.id!==e.pointerId)return;const d=drag,t=now(),speed=t-d.time<.09?d.velocity:0;drag=null;dragMotion.release(d.dx,speed,t);if(e.type!=='pointercancel'&&(Math.abs(d.dx)>64||Math.abs(speed)>450))select(selected+((Math.abs(speed)>450?speed:d.dx)<0?1:-1));};hero.onpointerup=end;hero.onpointercancel=end;
 hero.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(selected+(e.key==='ArrowRight'?1:-1));}};
 confirm.onclick=async()=>{if(busy||closing||root.classList.contains('cs-preparing'))return;if(!name.value.trim()){error.textContent='请先留下本次使用的名字。';name.focus();return;}busy=true;confirm.disabled=true;name.disabled=true;root.classList.add('cs-waiting');root.querySelector('.cs-close')?.setAttribute('disabled','');$('.cs-confirm-label').textContent=wardrobe?'正在换好…':'正在准备入城…';const c=list[selected],selection={id:c.id,name:name.value.trim(),direction};try{await onConfirm(selection);saveValue(storage,'belvedere-character-v1',selection);saveValue(storage,'belvedere-greeting-v1-'+c.id,getGreeting(c));busy=false;close(selection);}catch(e){error.textContent='准备中断，请重试。'+(e?.message||'');busy=false;confirm.disabled=false;name.disabled=false;root.querySelector('.cs-close')?.removeAttribute('disabled');root.classList.remove('cs-waiting');$('.cs-confirm-label').textContent=wardrobe?'确认更换':'重新进入贝尔维德';}};
 }catch(e){if(stopped||closing)return;$('.cs-load-label').textContent=e.message;const retry=document.createElement('button');retry.className='cs-load-retry';retry.textContent='重新准备';retry.onclick=()=>{retry.remove();initialize();};root.append(retry);}}
 void initialize();return done;
}
