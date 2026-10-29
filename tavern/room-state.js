const KEY='belvedere-room-switches-v1';
function save(engine){try{localStorage.setItem(KEY,JSON.stringify([...engine.states]));}catch{}}
function sync(engine){
 for(const t of engine.things||[]){if(!t.data.decorWindow)continue;
  const f=engine.decorLights.find(f=>Math.hypot(f.source.x-t.data.x,f.source.z-t.data.z)<.8&&f.kind===3);
  if(f){f.window.open=t.on;f.window.curtained=true;}
 }
}
window.__tavernRoomState=(engine,phase)=>{
 window.__tavernRoomController=engine;
 if(!engine.__savedSwitches){engine.__savedSwitches=true;try{for(const [id,on]of JSON.parse(localStorage.getItem(KEY)||'[]'))if(typeof id==='string'&&typeof on==='boolean')engine.states.set(id,on);}catch{}
  const backgroundSlot=engine.backgroundSlot;engine.backgroundSlot=async function(){if(window.__gamePreviewInactive)await new Promise(resolve=>{const resume=e=>{if(e.detail.active){window.removeEventListener('game-preview-activity',resume);resolve();}};window.addEventListener('game-preview-activity',resume);});return backgroundSlot.apply(this,arguments);};
  const interact=engine.interact;engine.interact=function(){const result=interact.apply(this,arguments);sync(this);save(this);return result;};
  const atmosphere=engine.applyAtmosphere;engine.applyAtmosphere=function(){sync(this);return atmosphere.apply(this,arguments);};
 }
 if(phase!=='ready')return;
 for(const root of engine.stage.children.filter(n=>n.name==='Wall window')){
  const p=root.position,id=`${engine.room.id}:wall-window:${p.x.toFixed(3)}:${p.z.toFixed(3)}`;
  const parts=root.children.filter(n=>n.name==='Curtain').map(node=>{node.name='CurtainSlide_'+(node.position.x<0?'-1':'1');return {node,position:node.position.clone(),scale:node.scale.clone(),rotation:node.eulerAngles.clone(),bounds:[]};});
  const t={data:{id,model:'decor-window',interactive:'window',decorWindow:true,label:'窗户',x:p.x,y:1,z:p.z,rot:root.eulerAngles.y,scale:1},node:root,on:engine.states.get(id)??true,angle:0,pivots:[],home:root.position.clone(),bulbs:[],glass:[],parts};
  t.progress=t.on?1:0;engine.poseFurniture(t);engine.things.push(t);
 }
 sync(engine);engine.applyAtmosphere();
 window.dispatchEvent(new CustomEvent('tavern-room-ready',{detail:{room:engine.room.id}}));
};
if(window.__tavernRoomController)window.__tavernRoomState(window.__tavernRoomController,'ready');
