import {createFunctionPanel} from './function-panel.js?v=wardrobe-20261026';
let pending;
export function openReentryPanel(options={}) {
 if(pending)return pending;
 pending=new Promise(resolve=>{
  if(!document.getElementById('reentry-style')){
   const style=document.createElement('link');style.id='reentry-style';style.rel='stylesheet';style.href=new URL('./reentry.css?v=reentry-20261026',import.meta.url).href;document.head.append(style);
  }
  const focus=document.activeElement,shade=document.createElement('div'),root=document.createElement('section');
  root.className='reentry-panel';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','reentry-title');
  root.innerHTML=`<button class="reentry-close" aria-label="关闭重新入场，继续游玩">×</button>
   <div class="reentry-content" data-allow-scroll><p class="reentry-eyebrow">BELVEDERE · 旅途</p><h1 id="reentry-title">再走一遍来时的路</h1>
   <p class="reentry-intro">从古地图重新出发，在城门前向白羊出示密令。</p>
   <ol class="reentry-steps"><li><span>01</span><div><h2>重新加载地图</h2><p>展开古地图，沿小路抵达城门。</p></div></li><li><span>02</span><div><h2>重新输入密令</h2><p>接过邀请函，填写通行密令。</p></div></li><li><span>03</span><div><h2>再次进入酒馆</h2><p>确认角色，等待白羊为你推门。</p></div></li></ol>
   <p class="reentry-keep">角色、名字和房间位置会保留。</p>
   <div class="reentry-actions"><button data-action="cancel">继续游玩</button><button data-action="restart">返回地图，重新验证 <span aria-hidden="true">↗</span></button></div></div>`;
  document.body.append(shade,root);
  const panel=createFunctionPanel(root,{...options,shade});let closing=false,answer=false,raf;
  const close=value=>{if(closing)return;closing=true;answer=value;root.querySelectorAll('button').forEach(b=>b.disabled=true);panel.close(performance.now()/1000);};
  root.querySelector('.reentry-close').onclick=()=>close(false);
  root.querySelector('[data-action="cancel"]').onclick=()=>close(false);
  root.querySelector('[data-action="restart"]').onclick=()=>close(true);
  root.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close(false);}
   if(e.key==='Tab'){
    const buttons=[...root.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  });
  function draw(time){
   if(panel.draw(time/1000).closed){cancelAnimationFrame(raf);panel.dispose();root.remove();shade.remove();focus?.isConnected&&focus.focus({preventScroll:true});resolve(answer);return;}
   raf=requestAnimationFrame(draw);
  }
  root.focus({preventScroll:true});raf=requestAnimationFrame(draw);
 }).finally(()=>{pending=null;});
 return pending;
}
