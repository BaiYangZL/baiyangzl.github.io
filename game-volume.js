import {createFunctionPanel} from './function-panel.js';
const key='belvedere-volume-v1',defaults={master:1,music:1,effects:1,ambience:1,voice:1},listeners=new Set();
let values={...defaults};
function read(){try{const v=JSON.parse(localStorage.getItem(key)||'{}');for(const k of Object.keys(defaults))values[k]=Number.isFinite(v[k])?Math.max(0,Math.min(1,v[k])):1;}catch{}}
read();
export const volume={get:()=>({...values}),set(k,v){if(!(k in defaults)||!Number.isFinite(v))return;values[k]=Math.max(0,Math.min(1,v));try{localStorage.setItem(key,JSON.stringify(values));}catch{}listeners.forEach(f=>f());},subscribe(f){listeners.add(f);f();return()=>listeners.delete(f);},gain(ctx,channel,destination=ctx.destination){const g=ctx.createGain();g.connect(destination);const off=this.subscribe(()=>g.gain.setTargetAtTime(values.master*values[channel],ctx.currentTime,.025));return {node:g,dispose(){off();g.disconnect();}};},media(el,channel){return this.subscribe(()=>{el.volume=values.master*values[channel];});}};
window.addEventListener('storage',e=>{if(e.key===key){read();listeners.forEach(f=>f());}});
let opening=false;
export async function openVolume(button){
 if(opening||document.querySelector('[data-function-panel]'))return;opening=true;let engine,wasPaused=true,panel,frame;
 try{
  if(window.__tavern&&window.System){engine=await System.import('cc');wasPaused=engine.game.isPaused();window.dispatchEvent(new Event('blur'));engine.game.pause();}
  const root=document.createElement('section'),shade=document.createElement('div');root.tabIndex=-1;root.role='dialog';root.setAttribute('aria-modal','true');root.setAttribute('aria-label','声音设置');
  root.style.cssText='background:#252524;color:#f5f0e7;padding:clamp(20px,5vw,60px);overflow:auto;font:16px/1.6 system-ui;';
  root.innerHTML='<h2>声音设置</h2><p>拖动立即生效，自动记住。人声控制其他玩家的收听音量。</p><button id="volume-close" style="position:absolute;right:20px;top:20px;border:1px solid #776a55;border-radius:8px;background:#39352e;color:#f5f0e7;padding:7px 16px">关闭</button>'+Object.entries({master:'总音量',music:'游戏音乐',effects:'动作与界面音效',ambience:'雨声与环境',voice:'人说话声音'}).map(([k,label])=>`<label style="display:block;margin:18px 0">${label} <output data-value="${k}"></output><input aria-label="${label}" data-volume="${k}" type="range" min="0" max="100" step="1" style="display:block;width:100%;accent-color:#d5b17c;touch-action:pan-y"></label>`).join('');
  if(window.__gameFrameLimit){const label=document.createElement('label');label.textContent='画面帧率上限 ';const select=document.createElement('select');select.setAttribute('aria-label','画面帧率');select.innerHTML='<option value="30">30 帧 · 减轻渲染负担</option><option value="60">60 帧 · 流畅</option><option value="120">120 帧 · 高刷新率</option>';select.value=String(window.__gameFrameLimit.get());select.onchange=()=>window.__gameFrameLimit.set(select.value);label.append(select);root.append(label,document.createElement('br'));}
  if(window.__selectedSounds?.manifest.revision){const note=document.createElement('small');note.textContent='当前试听：单预览运行 · 30 / 60 / 120 帧（第八版）';root.append(note);}
  document.body.append(shade,root);panel=createFunctionPanel(root,{originElement:button,shade});const off=volume.subscribe(()=>{for(const input of root.querySelectorAll('[data-volume]')){const n=Math.round(values[input.dataset.volume]*100);input.value=n;root.querySelector(`[data-value="${input.dataset.volume}"]`).textContent=n+'%';}});
  root.addEventListener('input',e=>{if(e.target.dataset.volume)volume.set(e.target.dataset.volume,Number(e.target.value)/100);});let closing=false;
  const close=()=>{if(closing)return;closing=true;panel.close(performance.now()/1000);};root.querySelector('#volume-close').onclick=close;root.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  await new Promise(resolve=>{const draw=t=>{if(panel.draw(t/1000).closed){off();panel.dispose();root.remove();shade.remove();resolve();return;}frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);root.focus();});
 }finally{cancelAnimationFrame(frame);if(engine&&!wasPaused&&!window.__gamePreviewInactive)engine.game.resume();opening=false;button?.focus();}
}
function install(){const host=document.querySelector('#tavern-ui .views')||document.querySelector('footer');if(host&&!document.getElementById('game-volume-button')){const b=document.createElement('button');b.id='game-volume-button';b.textContent='声音设置';b.type='button';b.onclick=()=>openVolume(b);host.append(b);}}
const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});install();
window.__gameVolume=volume;
