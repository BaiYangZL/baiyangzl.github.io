import {Spring,chooseGreeting,readSaved,saveValue} from './selection-core.js';
const base=new URL('./',import.meta.url),url=p=>new URL(p,base).href;
const image=p=>new Promise((ok,no)=>{const i=new Image();i.fetchPriority='high';i.onload=()=>i.decode().then(()=>ok(i),no);i.onerror=()=>no(Error('人物图片未能载入，请重试。'));i.src=url(p);});
let pending;
export function prepareCharacters(){
 return pending??=fetch(url('character-catalog.json?v=character-selection-fix-20261026'),{priority:'high'}).then(r=>{if(!r.ok)throw Error('角色清单未能载入');return r.json();}).then(list=>Promise.all(list.map(async c=>{const [heroImage,portraitImage,atlasImage,atlasData]=await Promise.all([image(c.hero),image(c.dialogue),image(c.atlas),fetch(url(c.atlasData),{priority:'high'}).then(r=>{if(!r.ok)throw Error('人物动作未能载入');return r.json();})]);return {...c,heroImage,portraitImage,atlasImage,atlasData};}))).catch(e=>{pending=null;throw e;});
}
const arrow='<svg viewBox="0 0 32 32"><path d="M5 16h22M18 7l9 9-9 9"/></svg>';
const check='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 16 6 6L26 9"/></svg>';
export async function openCharacterSelection({onConfirm=async()=>{},initialId}={}){
 let storage;try{storage=localStorage;}catch{storage=null;}
 const saved=readSaved(storage,'belvedere-character-v1',{});
 if(!document.querySelector('link[data-character-style]')){const l=document.createElement('link');l.rel='stylesheet';l.href=url('character-select.css');l.dataset.characterStyle='';document.head.append(l);}
 const root=document.createElement('section');root.className='cs-root cs-loading';root.setAttribute('aria-label','选择本次进入的角色');root.innerHTML='<div class="cs-load-label" role="status">正在准备人物…</div>';document.body.append(root);
 let catalog;
 try{catalog=await prepareCharacters();}catch(e){root.querySelector('div').textContent=e.message;const retry=document.createElement('button');retry.textContent='重新准备';root.append(retry);await new Promise(r=>retry.onclick=r);root.remove();return openCharacterSelection({onConfirm,initialId});}
 root.classList.remove('cs-loading');
 root.innerHTML=`<div class="cs-stage"><div class="cs-ghost"></div><div class="cs-script">Belvedere</div><svg class="cs-crest" viewBox="0 0 30 36"><path d="m15 2 12 5-2 16-10 11L5 23 3 7Z M15 7v21M9 12h12M9 12v10l6 5 6-5V12"/></svg><i class="cs-crest-line"></i><div class="cs-brand">BELLVEDE</div><div class="cs-password"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h2v11H5V10Zm2 0h6V7a3 3 0 0 0-6 0Zm2 4v4h2v-4Z"/></svg>••••••</div><div class="cs-password-arrow">→</div><div class="cs-seal">${check}</div><svg class="cs-neck" viewBox="0 0 81 72"><path d="M40 0v22C40 53 20 66 0 72h81C60 66 41 53 41 22V0Z"/></svg><div class="cs-surface"></div><div class="cs-monogram">BEL<br>VED<small>CHARACTER<br>SELECTION</small></div><div class="cs-welcome">WELCOME<br>TO<br>BELLVEDE</div><div class="cs-hero-stack" tabindex="0" role="group" aria-label="人物立绘，可左右拖动换人"></div><div class="cs-portrait-box" aria-label="聊天立绘横向预览"></div><div class="cs-greeting" aria-live="polite"><span class="cs-ellipsis">「……</span></div><div class="cs-name"><label for="cs-visit-name"><svg viewBox="0 0 24 24"><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 21v-4c0-7 18-7 18 0v4Z"/></svg></label><input id="cs-visit-name" maxlength="16" autocomplete="nickname" aria-label="本次使用的名字" placeholder="本次使用的名字"><svg class="cs-pencil" viewBox="0 0 24 24"><path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/></svg></div><div class="cs-directions-title">角色朝向</div><div class="cs-directions"></div><button class="cs-confirm"><span class="cs-confirm-label">进入贝尔维德</span><span class="cs-arrow-circle">${arrow}</span></button><div class="cs-error" role="alert"></div><div class="cs-helper">选好模样，留下这次旅行的名字。</div><nav class="cs-chooser" aria-label="切换角色"></nav><div class="cs-footer">A PLACE<br>FOR THOSE<br>WHO REMEMBER.</div><i class="cs-rule"></i></div>`;
 const $=s=>root.querySelector(s),stage=$('.cs-stage'),hero=$('.cs-hero-stack'),portrait=$('.cs-portrait-box'),greeting=$('.cs-greeting'),name=$('input'),confirm=$('.cs-confirm'),error=$('.cs-error');
 name.value=saved.name||'';
 let selected=catalog.findIndex(c=>c.id===(initialId||saved.id));if(selected<0)selected=0;
 let direction='S',closed=false,busy=false,raf=0,drag=null,released=null;
 const clock=()=>performance.now()/1000,start=clock(),open=new Spring(0,10);open.to(1,start);
 const memo=new Map(),layers=[],colors=[0,1,2].map(()=>new Spring(0));
 const getGreeting=c=>{if(!memo.has(c.id))memo.set(c.id,chooseGreeting(readSaved(storage,'belvedere-greeting-v1-'+c.id),c.firstGreeting,c.greetings));return memo.get(c.id);};
 const dirs=[['S','前'],['N','后'],['W','左'],['E','右']];
 dirs.forEach(([d,label])=>{const b=document.createElement('button');b.className='cs-direction';b.setAttribute('aria-label',label+'视图');b.innerHTML='<div class="cs-sprite-frame"><canvas width="192" height="192"></canvas></div><span>'+label+'</span>';b.onclick=()=>{direction=d;drawDirections();};b.dataset.direction=d;$('.cs-directions').append(b);});
 function drawDirections(){for(const b of root.querySelectorAll('.cs-direction'))b.setAttribute('aria-pressed',String(b.dataset.direction===direction));}
 const choices=$('.cs-chooser');
 function choiceButton(text,fn,cls){const b=document.createElement('button');b.textContent=text;b.className=cls||'';b.onclick=fn;choices.append(b);return b;}
 choiceButton('‹',()=>select(selected-1),'cs-prev').ariaLabel='上一个角色';
 const chips=catalog.map((c,i)=>choiceButton(c.name,()=>select(i)));
 choiceButton('›',()=>select(selected+1),'cs-next').ariaLabel='下一个角色';
 function select(index,first=false){if(busy)return;index=(index+catalog.length)%catalog.length;if(!first&&index===selected)return;selected=index;const c=catalog[index],t=clock();
  for(const l of layers)l.opacity.to(0,t);
  const h=c.heroImage.cloneNode(),p=document.createElement('div'),q=document.createElement('div');h.className='cs-hero';h.alt=c.name+'展示立绘';p.className='cs-portrait-layer';const pi=c.portraitImage.cloneNode();pi.alt=c.name+'聊天图预览';pi.style.width=(c.portraitCrop.width*100)+'%';pi.style.top=(c.portraitCrop.top*100)+'%';pi.style.left=(c.portraitCrop.left*100)+'%';p.append(pi);q.className='cs-quote-layer';const quote=document.createElement('p');quote.textContent='「'+getGreeting(c)+'」';q.append(quote);hero.append(h);portrait.append(p);greeting.append(q);
  const opacity=new Spring(first?1:0,19);opacity.to(1,t);layers.push({h,p,q,c,opacity,created:t});
  const rgb=c.accent.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));rgb.forEach((v,i)=>{if(first)colors[i]=new Spring(v);else colors[i].to(v,t);});
  chips.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));$('.cs-ghost').replaceChildren(c.heroImage.cloneNode());drawDirections();error.textContent='';
 }
 select(selected,true);
 function resize(){const w=root.clientWidth,h=root.clientHeight,portraitMode=w<=650&&h>w;root.classList.toggle('cs-compact',portraitMode);stage.style.transform=portraitMode?'none':`translate(-50%,-50%) scale(${Math.min(root.clientWidth/1672,root.clientHeight/941)})`;}
 resize();window.addEventListener('resize',resize);const observer=new ResizeObserver(resize);observer.observe(root);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function render(t){const k=reduced?1:open.at(t),surface=$('.cs-surface');Object.assign(surface.style,{left:(1007-911*k)+'px',top:(40+116*k)+'px',width:(57+1423*k)+'px',height:(57+645*k)+'px',borderRadius:(28.5+21.5*k)+'px'});
  const content=reduced?1:Math.max(0,Math.min(1,(k-.3)/.7));
  for(const el of root.querySelectorAll('.cs-monogram,.cs-welcome,.cs-hero-stack,.cs-portrait-box,.cs-greeting,.cs-name,.cs-directions-title,.cs-directions,.cs-confirm,.cs-chooser,.cs-helper,.cs-neck'))el.style.opacity=content;
  root.style.setProperty('--accent',`rgb(${colors.map(c=>Math.round(c.at(t))).join(',')})`);
  const dx=drag?drag.dx:released?released.dx*(1+22*(t-released.t))*Math.exp(-22*(t-released.t)):0;
  for(let i=layers.length-1;i>=0;i--){const l=layers[i],a=reduced?l.opacity.goal:l.opacity.at(t);for(const el of [l.h,l.p,l.q]){el.style.opacity=a;el.style.filter=`blur(${(1-a)*5}px)`;el.style.transform=`translateX(${(1-a)*(l.opacity.goal?22:-18)+(el===l.h?dx:0)}px)`;}
   if(l.opacity.goal===0&&a<.001){l.h.remove();l.p.remove();l.q.remove();layers.splice(i,1);}
  }
  for(const b of root.querySelectorAll('.cs-direction')){const d=b.dataset.direction,ctx=b.querySelector('canvas').getContext('2d');ctx.clearRect(0,0,192,192);ctx.imageSmoothingEnabled=false;for(const l of layers){const f=l.c.atlasData.frames[l.c.atlasData.clips['idle-'+d][0]];ctx.globalAlpha=reduced?l.opacity.goal:l.opacity.at(t);ctx.drawImage(l.c.atlasImage,...f.frame,0,0,192,192);}ctx.globalAlpha=1;}
  if(!closed)raf=requestAnimationFrame(ms=>render(ms/1000));
 }
 raf=requestAnimationFrame(ms=>render(ms/1000));
 const pointerAxis=e=>window.__belvedereScreen?.rotated?e.clientY:e.clientX;
 hero.onpointerdown=e=>{if(busy)return;hero.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:pointerAxis(e),dx:0};released=null;};
 hero.onpointermove=e=>{if(drag?.id===e.pointerId){const scale=Math.min(root.clientWidth/1672,root.clientHeight/941);drag.dx=(pointerAxis(e)-drag.x)/(root.classList.contains('cs-compact')?1:scale);}};
 const endDrag=e=>{if(drag?.id!==e.pointerId)return;const dx=drag.dx;drag=null;released={dx,t:clock()};if(e.type!=='pointercancel'&&Math.abs(dx)>64)select(selected+(dx<0?1:-1));};hero.onpointerup=endDrag;hero.onpointercancel=endDrag;
 hero.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(selected+(e.key==='ArrowRight'?1:-1));}};
 return new Promise(resolve=>{confirm.onclick=async()=>{if(busy)return;if(!name.value.trim()){error.textContent='请先留下本次使用的名字。';name.focus();return;}
  busy=true;confirm.disabled=true;name.disabled=true;root.classList.add('cs-waiting');$('.cs-confirm-label').textContent='正在准备入城…';error.textContent='';const c=catalog[selected],selection={id:c.id,name:name.value.trim(),direction};
  try{await onConfirm(selection);saveValue(storage,'belvedere-character-v1',selection);saveValue(storage,'belvedere-greeting-v1-'+c.id,getGreeting(c));closed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);observer.disconnect();root.remove();resolve(selection);}
  catch(e){error.textContent='准备中断，请重试。'+(e?.message||'');busy=false;confirm.disabled=false;name.disabled=false;root.classList.remove('cs-waiting');$('.cs-confirm-label').textContent='重新进入贝尔维德';}
 };});
}
