import {Spring} from './selection-core.js?v=wardrobe-20261026';

// Shared in-game shell for character selection, wardrobe and future feature panels.
// The scene remains mounted; callers suspend their engine's input until dispose().
export const PANEL_AREA = .85;
const SIDE = Math.sqrt(PANEL_AREA);
// Anchored menus share the panel spring motion while retaining their CSS geometry.
export function attachFunctionMenu(root, origin) {
 const motionPreference=matchMedia('(prefers-reduced-motion:reduce)');
 const wide=new Spring(0,17),tall=new Spring(0,19);
 let frame=0,lastHidden=root.hidden,restoreFocus=false;
 function draw(){
  const now=performance.now()/1000,open=!root.hidden,reduced=motionPreference.matches;
  const x=reduced?(open?1:0):Math.max(0,Math.min(1,wide.at(now)));
  const y=reduced?x:Math.max(0,Math.min(1,tall.at(now)));
  const rect=root.getBoundingClientRect(),source=origin.getBoundingClientRect();
  const sw=Math.min(rect.width,source.width),sh=Math.min(rect.height,source.height);
  const cx=Math.max(sw/2,Math.min(rect.width-sw/2,source.x+source.width/2-rect.x));
  const cy=Math.max(sh/2,Math.min(rect.height-sh/2,source.y+source.height/2-rect.y));
  root.style.clipPath=reduced?'none':`inset(${(cy-sh/2)*(1-y)}px ${(rect.width-cx-sw/2)*(1-x)}px ${(rect.height-cy-sh/2)*(1-y)}px ${(cx-sw/2)*(1-x)}px round ${14+14*(1-Math.min(x,y))}px)`;
  root.style.opacity=String(Math.min(1,Math.min(x,y)*4));
  if(open?x>.999&&y>.999:x<.003&&y<.003){
   root.style.removeProperty('clip-path');root.style.removeProperty('opacity');root.style.removeProperty('will-change');delete root.dataset.menuClosing;root.inert=false;frame=0;
   if(!open&&restoreFocus&&document.activeElement===document.body)origin.focus({preventScroll:true});
  }else frame=requestAnimationFrame(draw);
 }
 function sync(){
  if(root.hidden===lastHidden)return;lastHidden=root.hidden;
  restoreFocus=root.contains(document.activeElement);
  root.inert=root.hidden;if(root.hidden)root.dataset.menuClosing='';else delete root.dataset.menuClosing;
  origin.setAttribute('aria-expanded',String(!root.hidden));root.style.willChange=motionPreference.matches?'auto':'clip-path,opacity';
  const now=performance.now()/1000;wide.to(root.hidden?0:1,now);tall.to(root.hidden?0:1,now);
  cancelAnimationFrame(frame);draw();
 }
 const observer=new MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['hidden']});
 return {dispose(){observer.disconnect();cancelAnimationFrame(frame);delete root.dataset.menuClosing;root.inert=false;root.style.removeProperty('clip-path');root.style.removeProperty('opacity');root.style.removeProperty('will-change');}};
}
export function createFunctionPanel(root, {originElement, originRect, shade, area=PANEL_AREA, onLayout=()=>{}, modal=true, bounds}={}) {
 const side=Math.sqrt(Math.max(.1,Math.min(1,area)));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const source=originRect||originElement?.getBoundingClientRect();
 const opened=performance.now()/1000,wide=new Spring(0,17),tall=new Spring(0,19);
 wide.to(1,opened);tall.to(1,opened);
 let closing=false,closedAt=0,geometry,settled=false;
 const background=new Map();
 const remember=el=>{if(modal&&el instanceof HTMLElement&&el!==root&&el!==shade&&!background.has(el)){background.set(el,el.inert);el.inert=true;}};
 Array.from(document.body.children).forEach(remember);
 const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(remember)));
 if(modal)observer.observe(document.body,{childList:true});
 root.dataset.functionPanel='';
 Object.assign(root.style,{position:'fixed',zIndex:'100020',boxSizing:'border-box',willChange:reduced?'opacity':'clip-path'});
 if(shade)Object.assign(shade.style,{position:'fixed',inset:'0',zIndex:'100019',background:'#171319',touchAction:'none'});
 const blocked=['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','touchstart','touchmove','touchend','wheel','keydown','keyup'];
 const guard=e=>{if(!root.contains(e.target)){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();}};
 const contain=e=>e.stopPropagation();
 blocked.forEach(type=>{if(modal)window.addEventListener(type,guard,{capture:true,passive:false});root.addEventListener(type,contain);});
 const keepFocus=e=>{if(!root.contains(e.target))root.focus({preventScroll:true});};
 if(modal)document.addEventListener('focusin',keepFocus);
 function viewport(){
  const screen=window.__belvedereScreen;
  if(screen?.kind==='gate')return {width:screen.width,height:screen.height,rotated:screen.rotated,rotateRoot:false};
  const frame=document.getElementById('GameDiv'),rotated=!!frame?.style.transform.includes('90deg');
  return {width:rotated?innerHeight:innerWidth,height:rotated?innerWidth:innerHeight,rotated,rotateRoot:rotated};
 }
 function point(x,y){return geometry.rotated?{x:y,y:innerWidth-x}:{x,y};}
 function resize(){
  geometry=viewport();const {width,height,rotateRoot}=geometry;
  const rect=bounds?.({width,height});
  const w=rect?.width??width*side,h=rect?.height??height*side,left=rect?.left??(width-w)/2,top=rect?.top??(height-h)/2;
  Object.assign(root.style,{inset:'auto',left:(rotateRoot?innerWidth-top:left)+'px',top:(rotateRoot?left:top)+'px',width:w+'px',height:h+'px',transform:rotateRoot?'rotate(90deg)':'none',transformOrigin:'0 0',borderRadius:'28px'});
  Object.assign(geometry,{w,h,left,top});onLayout(w,h);
 }
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(document.documentElement);
 window.addEventListener('resize',resize);window.addEventListener('belvedere-screen-change',resize);resize();
 function draw(time){
  if(settled&&!closing)return {progress:1,closed:false};
  const clamp=v=>Math.max(0,Math.min(1,v));
  const x=reduced?(closing?1-clamp((time-closedAt)/.14):clamp((time-opened)/.14)):clamp(wide.at(time));
  const y=reduced?x:clamp(tall.at(time)),progress=Math.min(x,y);
  const {w,h,left,top,width,height}=geometry;
  const center=source?point(source.x+source.width/2,source.y+source.height/2):{x:width*.5,y:height*.54};
  const sw=Math.min(w,source?(geometry.rotated?source.height:source.width):56),sh=Math.min(h,source?(geometry.rotated?source.width:source.height):56);
  const cx=Math.max(sw/2,Math.min(w-sw/2,center.x-left)),cy=Math.max(sh/2,Math.min(h-sh/2,center.y-top));
  const radius=28+(Math.min(w,h)*.5-28)*Math.pow(1-progress,2);
  root.style.clipPath=reduced?'none':`inset(${(cy-sh/2)*(1-y)}px ${(w-cx-sw/2)*(1-x)}px ${(h-cy-sh/2)*(1-y)}px ${(cx-sw/2)*(1-x)}px round ${radius}px)`;
  root.style.opacity=String(reduced?progress:closing?Math.min(1,progress*6):1);
  if(shade)shade.style.opacity=String(progress*.16);
  if(!closing&&progress>.999&&!settled){settled=true;root.style.willChange='auto';root.style.clipPath='none';}
  else if(!closing&&settled)root.style.clipPath='none';
  return {progress,closed:closing&&(reduced?time-closedAt>=.14:progress<.003)};
 }
 function close(time){if(closing)return;closing=true;closedAt=time;wide.to(0,time);tall.to(0,time);root.style.willChange=reduced?'opacity':'clip-path';}
 function dispose(){
  observer.disconnect();resizeObserver.disconnect();
  window.removeEventListener('resize',resize);window.removeEventListener('belvedere-screen-change',resize);
  document.removeEventListener('focusin',keepFocus);
  blocked.forEach(type=>{window.removeEventListener(type,guard,true);root.removeEventListener(type,contain);});
  background.forEach((inert,el)=>{el.inert=inert;});root.style.willChange='auto';
 }
 return {draw,close,dispose,resize,point,reduced};
}
