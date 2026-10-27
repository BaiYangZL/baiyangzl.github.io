// Optional DOM UI; the existing game scene and position stay mounted underneath.
import {openCharacterSelection} from './character-select.js?v=wardrobe-studio-20261026';
let opening=false;
async function openWardrobe(button){
 if(opening)return;
 const api=window.__tavern,state=api?.state();
 if(!state?.entered||state.transitioning||state.contextLost)return;
 opening=true;button.disabled=true;
 let engine,wasPaused=false,selectionHost=window,gameRoot=document.getElementById('GameDiv'),oldInert=gameRoot?.inert;
 try{
  engine=await window.System.import('cc');wasPaused=engine.game.isPaused();
  window.dispatchEvent(new Event('blur'));
  const current=api.state();api.place(current.x,current.z);
  engine.game.pause();if(gameRoot)gameRoot.inert=true;
  try{if(parent!==window&&parent.__tavernEntry?.selectWardrobe)selectionHost=parent;}catch{}
  const b=button.getBoundingClientRect();
  const options={mode:'wardrobe',originRect:{x:b.x,y:b.y,width:b.width,height:b.height},initialId:current.characterId,initialName:current.visitorName,initialDirection:current.facing,
   onConfirm:s=>api.setCharacter(s.id,s.name,s.direction)};
  if(selectionHost===parent&&parent!==window)await parent.__tavernEntry.selectWardrobe(options);
  else await openCharacterSelection({...options,originElement:button});
 }catch(e){const note=document.querySelector('#tavern-ui .note');if(note)note.textContent='衣橱暂时未能打开，请重试。';console.warn('Wardrobe unavailable',e);}
 finally{
  if(gameRoot)gameRoot.inert=oldInert;window.dispatchEvent(new Event('blur'));
  const current=api.state();api.place(current.x,current.z);
  if(engine&&!wasPaused&&!current.contextLost)engine.game.resume();
  opening=false;button.disabled=false;window.focus();button.focus({preventScroll:true});
 }
}
function install(){
 const views=document.querySelector('#tavern-ui .views');
 if(!views||!window.__tavern?.state().firstFrameReady){requestAnimationFrame(install);return;}
 if(views.querySelector('#wardrobe'))return;
 const button=document.createElement('button');button.id='wardrobe';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;vertical-align:-3px;margin-right:5px;fill:none;stroke:currentColor;stroke-width:1.6"><path d="M5 3h14v17H5zM12 3v17M9 10v3M15 10v3M7 20v2M17 20v2"/></svg>衣橱';button.title='更换角色与名字';button.onclick=()=>openWardrobe(button);views.append(button);
 // The rotated Cocos touch path can suppress compatibility clicks.
 let start=null,last=-1000;
 button.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){e.preventDefault();start={id:e.pointerId,x:e.clientX,y:e.clientY};}});
 button.addEventListener('pointerup',e=>{const s=start;start=null;if(!s||s.id!==e.pointerId||Math.hypot(e.clientX-s.x,e.clientY-s.y)>12)return;e.preventDefault();last=performance.now();button.click();});
 button.addEventListener('pointercancel',()=>{start=null;});button.addEventListener('click',e=>{if(e.isTrusted&&performance.now()-last<500){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
}
install();
