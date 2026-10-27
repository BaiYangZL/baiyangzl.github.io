import {Spring} from './selection-core.js?v=wardrobe-20261026';

// Shared in-game shell for character selection, wardrobe and future feature panels.
// The scene remains mounted; callers suspend their engine's input until dispose().
export const PANEL_AREA = .85;
const SIDE = Math.sqrt(PANEL_AREA);
export function createFunctionPanel(root, {originElement, originRect, shade, onLayout=()=>{}}={}) {
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const source=originRect||originElement?.getBoundingClientRect();
 const opened=performance.now()/1000,wide=new Spring(0,17),tall=new Spring(0,19);
 wide.to(1,opened);tall.to(1,opened);
 let closing=false,closedAt=0,geometry,settled=false;
 const background=new Map();
 const remember=el=>{if(el instanceof HTMLElement&&el!==root&&el!==shade&&!background.has(el)){background.set(el,el.inert);el.inert=true;}};
 Array.from(document.body.children).forEach(remember);
 const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(remember)));
 observer.observe(document.body,{childList:true});
 root.dataset.functionPanel='';
 Object.assign(root.style,{position:'fixed',zIndex:'100020',boxSizing:'border-box',willChange:reduced?'opacity':'clip-path'});
 if(shade)Object.assign(shade.style,{position:'fixed',inset:'0',zIndex:'100019',background:'#171319',touchAction:'none'});
 const blocked=['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','touchstart','touchmove','touchend','wheel','keydown','keyup'];
 const guard=e=>{if(!root.contains(e.target)){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();}};
 const contain=e=>e.stopPropagation();
 blocked.forEach(type=>{window.addEventListener(type,guard,{capture:true,passive:false});root.addEventListener(type,contain);});
 const keepFocus=e=>{if(!root.contains(e.target))root.focus({preventScroll:true});};
 document.addEventListener('focusin',keepFocus);
 function viewport(){
  const screen=window.__belvedereScreen;
  if(screen?.kind==='gate')return {width:screen.width,height:screen.height,rotated:screen.rotated,rotateRoot:false};
  const frame=document.getElementById('GameDiv'),rotated=!!frame?.style.transform.includes('90deg');
  return {width:rotated?innerHeight:innerWidth,height:rotated?innerWidth:innerHeight,rotated,rotateRoot:rotated};
 }
 function point(x,y){return geometry.rotated?{x:y,y:innerWidth-x}:{x,y};}
 function resize(){
  geometry=viewport();const {width,height,rotateRoot}=geometry;
  const w=width*SIDE,h=height*SIDE,left=(width-w)/2,top=(height-h)/2;
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
