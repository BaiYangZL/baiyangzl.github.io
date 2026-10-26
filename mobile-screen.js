/* Runs before either engine. Browser/system navigation always remains user-controlled. */
(() => {
  if (window.__belvedereScreen) return;
  const kind=document.currentScript?.dataset.kind||'tavern',key='belvedere-landscape';
  let parentScreen;try{if(parent!==window)parentScreen=parent.__belvedereScreen;}catch{}
  let landscape=false,engine,controls,toast,rotated=false,width=innerWidth,height=innerHeight;
  try{landscape=localStorage.getItem(key)==='1';}catch{}
  const style=document.createElement('style');style.id='mobile-screen-style';style.textContent=`
  html,body{margin:0!important;overscroll-behavior:none!important;background:#171019;overflow:hidden!important}html{height:100%;touch-action:manipulation}body{min-height:0!important}
  #game,canvas,#move-stick{touch-action:none}input,textarea,select{touch-action:manipulation}#dialog-box,.card,.reading,.cs-root{overscroll-behavior:contain;touch-action:pan-y}
  .screen-controls{position:fixed;z-index:45000;right:12px;top:max(12px,env(safe-area-inset-top));display:flex;gap:7px;pointer-events:auto;font:13px system-ui;letter-spacing:0}
  .screen-controls[hidden]{display:none!important}.screen-controls button{min-height:42px;padding:8px 13px;border:1px solid #b99b67;border-radius:8px;color:#f8e6bf;background:#29251df2;box-shadow:0 3px 12px #0003;font:13px system-ui;touch-action:none}
  #entry-diagnostic{top:70px!important;max-height:calc(var(--screen-height,100dvh) - 90px);max-width:calc(100% - 24px)!important;overflow:auto;overscroll-behavior:contain;touch-action:pan-y}
  .screen-message{position:fixed;z-index:45001;left:50%;bottom:18px;transform:translateX(-50%);width:max-content;max-width:85%;padding:10px 14px;border:1px solid #ac925f;border-radius:8px;background:#27221af5;color:#f0dfbf;font:13px/1.6 system-ui;pointer-events:none}
  body.screen-gate{position:fixed;left:0;top:0;transform-origin:0 0;max-width:none!important;max-height:none!important}
  body.screen-gate #game canvas{width:100%!important;height:100%!important;margin:0!important;position:absolute;left:0;top:0}
  body.screen-gate.screen-wide #letter{place-items:center}body.screen-gate.screen-wide #letter .card{width:min(430px,85%);max-height:calc(var(--screen-height) - 76px);overflow:auto;padding:12px 18px}
  body.screen-gate.screen-wide #letter .body{font-size:13px;line-height:1.45;margin-bottom:6px}body.screen-gate.screen-wide #letter h2{font-size:19px;margin:3px 0 5px}
  body.screen-gate.screen-wide #letter input{padding:7px 10px}body.screen-gate.screen-wide #letter-status{margin:3px 0}
  body.screen-gate.screen-wide #dialog{--sw:150px;bottom:10px}body.screen-gate.screen-wide #dialog-box{min-height:92px;padding-top:12px;padding-bottom:10px}
  `;document.head.append(style);
  function announce(text){if(!toast){toast=document.createElement('div');toast.className='screen-message';toast.setAttribute('role','status');document.body.append(toast);}toast.textContent=text;clearTimeout(announce.timer);announce.timer=setTimeout(()=>{toast?.remove();toast=null;},5000);}
  function fullDocument(){try{return parentScreen?parent.document:document;}catch{return document;}}
  const fullscreen=()=>!!(fullDocument().fullscreenElement||fullDocument().webkitFullscreenElement);
  function updateButtons(){document.querySelectorAll('[data-screen=landscape]').forEach(b=>{b.textContent=api.landscape?'自动方向':'横屏';b.setAttribute('aria-pressed',String(api.landscape));});document.querySelectorAll('[data-screen=fullscreen]').forEach(b=>{b.textContent=fullscreen()?'退出全屏':'全屏';b.setAttribute('aria-pressed',String(fullscreen()));});}
  function layout(){
    if(parentScreen){landscape=parentScreen.landscape;width=innerWidth;height=innerHeight;rotated=false;}
    else{width=innerWidth;height=innerHeight;rotated=kind==='gate'&&landscape&&width<height;if(rotated)[width,height]=[height,width];}
    if(kind==='gate'){
      const body=document.body;body.classList.add('screen-gate');body.classList.toggle('screen-wide',width>height);body.style.width=width+'px';body.style.height=height+'px';body.style.transform=rotated?`translateX(${innerWidth}px) rotate(90deg)`:'none';
      document.documentElement.style.setProperty('--screen-vw',width/100+'px');document.documentElement.style.setProperty('--screen-vh',height/100+'px');document.documentElement.style.setProperty('--screen-height',height+'px');
    }
    if(kind==='tavern'&&!engine&&controls){controls.style.transform=landscape&&!parentScreen&&innerWidth<innerHeight?'rotate(90deg) translateX(100%)':'none';controls.style.transformOrigin='right top';}
    updateButtons();window.dispatchEvent(new CustomEvent('belvedere-screen-change'));
  }
  function setLandscape(value){if(parentScreen){parentScreen.setLandscape(value);layout();return;}landscape=!!value;try{localStorage.setItem(key,landscape?'1':'0');}catch{}engine?.(landscape);layout();if(fullscreen()&&screen.orientation){if(landscape)screen.orientation.lock?.('landscape').catch(()=>{});else screen.orientation.unlock?.();}}
  async function toggleFullscreen(){
    if(parentScreen)return parentScreen.toggleFullscreen();
    const doc=document,element=doc.documentElement;
    try{
      if(fullscreen()){await (doc.exitFullscreen?.()||doc.webkitExitFullscreen?.());screen.orientation?.unlock?.();}
      else {const request=element.requestFullscreen||element.webkitRequestFullscreen;if(!request){announce('当前浏览器不提供网页全屏。横屏仍可用；工具栏由浏览器控制。');return false;}await request.call(element,{navigationUI:'hide'});if(landscape)try{await screen.orientation?.lock?.('landscape');}catch{}}
      updateButtons();return fullscreen();
    }catch{announce('当前浏览器未允许全屏。横屏仍可用，无法强制隐藏微信或浏览器工具栏。');return false;}
  }
  const api=window.__belvedereScreen={kind,get landscape(){return parentScreen?parentScreen.landscape:landscape;},get width(){return width;},get height(){return height;},get rotated(){return rotated;},get embedded(){return !!parentScreen;},setLandscape,toggleFullscreen,fullscreen,bindEngine(callback){engine=callback;if(controls)controls.hidden=true;callback(api.landscape);layout();},hideControls(){if(controls)controls.hidden=true;},status:()=>({kind,landscape:api.landscape,width,height,rotated,embedded:!!parentScreen,fullscreen:fullscreen()})};
  function init(){
    controls=document.createElement('div');controls.className='screen-controls';controls.setAttribute('aria-label','画面方向与全屏');controls.innerHTML='<button type="button" data-screen="landscape" aria-pressed="false">横屏</button><button type="button" data-screen="fullscreen" aria-pressed="false">全屏</button>';document.body.append(controls);
    if(parentScreen)controls.hidden=true;
    controls.querySelector('[data-screen=landscape]').onclick=()=>setLandscape(!api.landscape);controls.querySelector('[data-screen=fullscreen]').onclick=()=>void toggleFullscreen();layout();
  }
  // Stop page scrolling/pull-to-refresh inside play areas, while keeping forms/readers usable.
  document.addEventListener('touchmove',event=>{if(event.target instanceof Element&&event.target.closest('input,textarea,select,.reading,#dialog-box,.card,.cs-root,#entry-diagnostic,[data-allow-scroll]'))return;if(event.cancelable)event.preventDefault();},{passive:false,capture:true});
  window.addEventListener('resize',layout);document.addEventListener('fullscreenchange',layout);document.addEventListener('webkitfullscreenchange',layout);
  if(parentScreen)parent.addEventListener('belvedere-screen-change',layout);
  document.addEventListener('fullscreenchange',()=>{if(!fullscreen())screen.orientation?.unlock?.();});
  if(document.body)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
