// Small gait-synchronous translation: head and shoulders travel together.
// No head scaling/rotation; feet remain registered on the floor.
window.createWhiteSideRunMotion=function(){
 let x=0,y=0;
 return {
  reset(){x=0;y=0;},
  update(dt,active,phase,clock,flip,frameMs=120){
   const t=(phase+clock/frameMs)*Math.PI/4;
   const targetX=active?(flip?1:-1)*(.002+.003*Math.sin(t)):0;
   const targetY=active?.004*(Math.cos(2*t)-1):0;
   const k=1-Math.exp(-Math.min(.05,Math.max(0,dt||0))/.055);
   x+=(targetX-x)*k;y+=(targetY-y)*k;
   return {x,y,offset(row){const k=Math.max(0,Math.min(1,(row-.25)/.35)),w=k*k*(3-2*k);return [x*w,y*w];}};
  }
 };
};

// Continuous, low-amplitude idle displacement. Feet fixed; rigid head translation, never scaling.
window.createGentleIdle=function(){
 let weight=0,phase=0;
 return function(dt,idle){
  dt=Math.min(.05,Math.max(0,dt||0));phase+=dt;weight+=(Number(idle)-weight)*(1-Math.exp(-dt/0.22));
  const breath=Math.sin(phase*Math.PI*2/3.8)*weight*.009;
  const sway=Math.sin(phase*Math.PI*2/7.8)*weight*.0035;
  return {weight,breath,sway,offset(t){const k=Math.max(0,Math.min(1,(t-.25)/.35));const w=k*k*(3-2*k);return [sway*w,breath*w]}};
 };
};


function materialRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL 不可用');
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v;uniform sampler2D tex;uniform vec3 stockingGain;uniform vec4 rect;uniform float flip;uniform float calibrated;uniform float goldTone;uniform vec3 hairSourceLuma;uniform vec3 hairDark;uniform vec3 hairMid;uniform vec3 hairLight;
 void main(){vec2 uv=v;if(flip>.5)uv.x=1.-uv.x;vec4 c=texture2D(tex,rect.xy+uv*rect.zw);vec3 raw=c.rgb;
 if(calibrated>.5){float lum=dot(raw,vec3(.2126,.7152,.0722));float mask=smoothstep(.015,.04,raw.b-max(raw.r,raw.g))*(1.-smoothstep(.70,.73,v.y))*smoothstep(.035,.065,lum);vec3 mapped;
 if(lum<hairSourceLuma.x)mapped=hairDark*lum/max(.001,hairSourceLuma.x);
 else if(lum<hairSourceLuma.y)mapped=mix(hairDark,hairMid,(lum-hairSourceLuma.x)/max(.001,hairSourceLuma.y-hairSourceLuma.x));
 else if(lum<hairSourceLuma.z)mapped=mix(hairMid,hairLight,(lum-hairSourceLuma.y)/max(.001,hairSourceLuma.z-hairSourceLuma.y));
 else mapped=mix(hairLight,vec3(1.),clamp((lum-hairSourceLuma.z)/max(.001,1.-hairSourceLuma.z),0.,1.));
 c.rgb=mix(raw,mapped,mask);}
float stockMask=smoothstep(.53,.57,v.y)*(1.-smoothstep(.82,.88,v.y))*smoothstep(.025,.06,raw.r-raw.b)*(1.-smoothstep(.19,.27,raw.r-raw.g))*(1.-smoothstep(.46,.60,max(raw.r,max(raw.g,raw.b))))*smoothstep(.16,.24,min(raw.r,min(raw.g,raw.b)));
c.rgb=mix(c.rgb,c.rgb*stockingGain,stockMask);if(goldTone>.5){
 float l=dot(c.rgb,vec3(.2126,.7152,.0722));
 vec3 saturated=mix(vec3(l),c.rgb,1.10);
 float high=smoothstep(.48,1.,max(c.r,max(c.g,c.b)));
 c.rgb=clamp(saturated*(.96-.13*high),0.,1.);
 }gl_FragColor=c;}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
 const loc=Object.fromEntries(['goldTone','stockingGain','rect','flip','calibrated','hairSourceLuma','hairDark','hairMid','hairLight'].map(k=>[k,gl.getUniformLocation(program,k)]));let source;
 return(img,f,material={},flip=false)=>{gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);if(source!==img){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);source=img}const[x,y,w,h]=f;gl.uniform3fv(loc.stockingGain,material.stockingGain||[1,1,1]);gl.uniform4f(loc.rect,x/img.width,y/img.height,w/img.width,h/img.height);gl.uniform1f(loc.flip,flip?1:0);gl.uniform1f(loc.goldTone,material.goldTone?1:0);gl.uniform1f(loc.calibrated,material.hairPalette?1:0);gl.uniform3fv(loc.hairSourceLuma,material.hairSourceLuma||[.1,.3,.7]);const colors=material.hairPalette||[[0,0,0],[.3,.3,.3],[.7,.7,.7]];for(const [i,key]of ['hairDark','hairMid','hairLight'].entries())gl.uniform3fv(loc[key],colors[i]);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6)}
}


// Shared budget: two room slots and one character slot, then three room slots.
window.__installCharacterQueue=async function(actor){
 const cc=await System.import('cc'),raw=new Map(),tasks=new Map();let urgent=0,started=false,roomTasks=new Set(),controllers=new Set();
 const ids=['blue-a','silver-a','red-a','gold-a','white-a'],sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const blocked=()=>document.hidden||actor.transitioning||urgent||actor.backgroundStopped;
 const suspension=setInterval(()=>{if(actor.backgroundStopped){clearInterval(suspension);controllers.forEach(c=>c.abort());return;}if(document.hidden||actor.transitioning)controllers.forEach(c=>c.abort())},80);
 async function bytes(id,signal){
  if(raw.has(id))return raw.get(id);
  const base=new URL('characters/'+id+'/',document.baseURI);
  const [atlas,image]=await Promise.all([fetch(new URL('atlas.json',base),{signal}).then(r=>{if(!r.ok)throw Error('角色数据未能下载');return r.json()}),fetch(new URL('atlas.webp',base),{signal}).then(r=>{if(!r.ok)throw Error('角色图片未能下载');return r.blob()})]);
  const value={atlas,image};raw.set(id,value);return value;
 }
 actor.characterDownloads={raw,async get(id){return bytes(id)},async priority(fn){urgent++;window.__priorityCharacterLoading=true;controllers.forEach(c=>c.abort());await Promise.allSettled([...roomTasks,...tasks.values()]);try{return await fn()}finally{urgent--;window.__priorityCharacterLoading=urgent>0}},state:()=>({urgent,loaded:[...raw.keys()],activeRooms:roomTasks.size,activeCharacters:tasks.size})};
 const active=new Set();
 actor.preloadInBackground=async function(){
  if(started)return;started=true;this.backgroundOrigin=this.room.id;
  const visited=new Set([this.room.id]),order=[this.room.id];for(let i=0;i<order.length;i++)for(const item of this.rooms.find(r=>r.id===order[i])?.items||[])if(item.to&&!visited.has(item.to)&&this.rooms.some(r=>r.id===item.to)){visited.add(item.to);order.push(item.to)}
  for(const room of this.rooms)if(!visited.has(room.id))order.push(room.id);this.backgroundRoomOrder=order;
  const names=[...new Set(order.flatMap(id=>this.rooms.find(r=>r.id===id).items.map(i=>i.model)))];this.backgroundTotal=names.length;this.models.forEach((_,id)=>this.backgroundLoaded.add(id));let next=0;
  const roomWorker=async()=>{while(!this.backgroundStopped){await sleep(120);if(blocked())continue;let id;while(next<names.length){const n=names[next++];if(!this.models.has(n)&&!this.backgroundLoaded.has(n)&&!this.backgroundFailed.has(n)){id=n;break}}if(!id)return;
   active.add(id);this.backgroundActive=[...active].join(',');const job=new Promise((ok,no)=>cc.resources.preload('models/'+id+'/'+id,cc.Prefab,e=>e?no(e):ok()));roomTasks.add(job);try{await job;this.backgroundLoaded.add(id)}catch{this.backgroundFailed.add(id)}finally{roomTasks.delete(job);active.delete(id);this.backgroundActive=[...active].join(',')}
  }};
  const characterWorker=async()=>{for(const id of ids){if(this.actorCache.has(id)||raw.has(id))continue;let done=false;while(!done&&!this.backgroundStopped){if(blocked()){await sleep(200);continue}const controller=new AbortController();controllers.add(controller);const job=bytes(id,controller.signal);tasks.set(id,job);try{await job;done=true}catch(e){if(e.name!=='AbortError'){done=true;console.warn('角色后台下载失败，选择时可重试',id)}}finally{controllers.delete(controller);tasks.delete(id)}}}await roomWorker()};
  await Promise.all([roomWorker(),roomWorker(),characterWorker()]);
 };
 window.__characterDownloads=actor.characterDownloads;
};
// Approved full-pose character playback. No review UI, forced character or spawn override.
window.__installApprovedMotion=async function(actor){
 if(actor.approvedMotionInstalled)return;actor.approvedMotionInstalled=true;
 const originalDraw=actor.drawFrame.bind(actor),originalAnimate=actor.animateFigure.bind(actor),originalSet=actor.setCharacter.bind(actor),originalClip=actor.movementClip.bind(actor);
 const {Texture2D:Texture,ImageAsset}=await System.import('cc');await window.__installCharacterQueue(actor);
 const prepared=new Map(),pending=new Map(),owns=()=>['blue-a','silver-a','red-a','gold-a','white-a'].includes(actor.characterId);
 const idleBreath=window.createGentleIdle(),sideRunMotion=window.createWhiteSideRunMotion();
 let phase=2,clock=0,last=performance.now(),lastDistance=actor.distance,wasMoving=false,settling=false,lastMotionRunning=false,playbackRunOverride=null,selectRequest=0;
 async function prepare(id){
  if(prepared.has(id))return prepared.get(id);if(pending.has(id))return pending.get(id);
  const task=(async()=>{const base=new URL('characters/'+id+'/atlas',document.baseURI),cached=actor.actorCache.get(id);const [atlas,img]=cached?[cached.atlas,cached.texture.image.data]:await (async()=>{const data=await actor.characterDownloads.get(id),url=URL.createObjectURL(data.image);try{const img=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=url});return [data.atlas,img]}finally{URL.revokeObjectURL(url)}})();
   if(!['S','N','W','E'].every(d=>atlas.clips['walk-'+d]?.length===8&&atlas.clips['run-'+d]?.length===8&&atlas.clips['idle-'+d]?.length===1))throw Error('确认动作缺失');
   let source=img;if(id==='blue-a'||id==='gold-a'){const out=document.createElement('canvas');out.width=img.width;out.height=img.height;const ctx=out.getContext('2d');ctx.drawImage(img,0,0);const cell=document.createElement('canvas'),draw=materialRenderer(cell);for(const f of Object.values(atlas.frames)){if(id!=='gold-a'&&!f.previewMaterial?.hairPalette&&!f.previewMaterial?.stockingGain)continue;const[x,y,w,h]=f.frame;cell.width=w;cell.height=h;draw(img,f.frame,id==='gold-a'?{goldTone:true}:f.previewMaterial);ctx.clearRect(x,y,w,h);ctx.drawImage(cell,x,y,w,h);if(f.safeTop)ctx.clearRect(x,y,w,f.safeTop);for(const r of f.excludedRects||[])ctx.clearRect(x+r[0],y+r[1],r[2],r[3])}source=out}
   const texture=new Texture();texture.image=new ImageAsset(source);texture.setFilters(1,1);const entry={texture,atlas};prepared.set(id,entry);return entry})();pending.set(id,task);try{return await task}finally{pending.delete(id)}
 }
 actor.setCharacter=async function(id,name='',direction='S',request){
  if(request!==selectRequest)return;if(!this.atlas)await this.loadActor(id);if(['blue-a','silver-a','red-a','gold-a','white-a'].includes(id)){const entry=await prepare(id);if(request!==selectRequest)return;this.actorCache.set(id,entry)}
  if(request!==selectRequest)return;phase=2;clock=0;settling=false;wasMoving=false;sideRunMotion.reset();last=performance.now();lastDistance=this.distance;return originalSet(id,name,direction);
 };
 const change=actor.setCharacter.bind(actor);
 actor.setCharacter=async function(id,name,direction){
  const request=++selectRequest;
  if(!['blue-a','silver-a','red-a','gold-a','white-a'].includes(id))throw Error('此角色尚未发布');
  if(this.actorCache.has(id))return change(id,name,direction,request);
  const wasEntered=this.entered;let overlay=null;
  if(wasEntered){let doc=document;try{if(parent!==window)doc=parent.document}catch{}overlay=doc.createElement('div');overlay.id='character-amber-loading';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','正在准备角色');overlay.style.cssText='position:fixed;inset:0;z-index:100040;background:radial-gradient(ellipse at 64% 40%,#7c5634,#322131 60%,#140f1b)';doc.body.append(overlay);}
  try{return await this.characterDownloads.priority(()=>change(id,name,direction,request))}finally{overlay?.remove()}
 };
 actor.movementClip=function(){return owns()?((playbackRunOverride??this.running)?'run-':'walk-'):originalClip()};
 actor.drawFrame=function(frame,moving){
  if(!this.atlas)return;if(!owns())return originalDraw(frame,moving);
  const now=performance.now(),delta=Math.min(100,Math.max(0,now-last));last=now;const travelled=Math.max(0,this.distance-lastDistance),actual=moving&&travelled>0;lastDistance=this.distance;
  const hasMoveIntent=Math.hypot(this.pad.x,this.pad.z)>.01||['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>this.keys.has(k));
  if(actual&&hasMoveIntent)lastMotionRunning=this.running;
  const playbackRunning=(!hasMoveIntent&&(actual||wasMoving||settling)&&['gold-a','red-a','white-a'].includes(this.characterId))?lastMotionRunning:this.running;
  const whiteSideRun=this.characterId==='white-a'&&playbackRunning&&/^[WE]$/.test(this.facing);
  const stopPhases=whiteSideRun?(this.atlas.sideRunStopAtFrames??[2,6]):[2,6];
  const interval=playbackRunning?(whiteSideRun?(this.atlas.sideRunFrameMs??120):120):(['silver-a','gold-a','white-a'].includes(this.characterId)&&this.facing==='N'?180:140);
  if(actual){if(!wasMoving){clock=0;if(whiteSideRun&&!settling)phase=stopPhases[0];}settling=false;clock+=delta}else if(wasMoving){settling=!stopPhases.includes(phase%8);clock=0}else if(settling)clock+=delta;
  while(clock>=interval){clock-=interval;phase=(phase+1)%8;if(!actual&&stopPhases.includes(phase%8)){settling=false;clock=0;break}}
  wasMoving=actual;playbackRunOverride=playbackRunning;let result;try{result=originalDraw(phase%8,actual||settling)}finally{playbackRunOverride=null;}if(this.characterId==='gold-a'&&this.facing==='N'&&(actual||settling))this.frameName='N/'+(playbackRunning?'run':'walk')+'/'+phase;const f=this.atlas.frames[this.frameName];if(!f)return result;
  for(const name of ['hairGain','skinGain','clothGain']){const v=this.actorMat.getProperty(name);this.actorMat.setProperty(name,new v.constructor(1,1,1,1))}
  const[x,y,w,h]=f.frame,[sw,sh]=this.atlas.size,v=this.actorMat.getProperty('tilingOffset');this.actorMat.setProperty('tilingOffset',new v.constructor((f.flipX?-w:w)/sw,-h/sh,(f.flipX?x+w:x)/sw,(y+h)/sh));return result;
 };
  // Whole-pose floor registration only. No changes to authored limb or body shapes.
 const footShadow=actor.player.getChildByName('Foot contact');
 const originalShadow=footShadow?{position:{...footShadow.position},scale:{...footShadow.scale}}:null;

 // beret-floor-v9: two radial meshes on the floor; no new texture or download.
 const {Node,MeshRenderer,Material,Color,gfx,utils}=await System.import('cc');
 const groundMaterial=new Material();
 groundMaterial.initialize({effectAsset:actor.unlitEffect,technique:1,
  defines:{USE_TEXTURE:false,USE_ALPHA_TEST:false,USE_VERTEX_COLOR:true},
  states:{rasterizerState:{cullMode:gfx.CullMode.NONE},depthStencilState:{depthTest:true,depthWrite:false}}});
 groundMaterial.setProperty('mainColor',Color.WHITE);
 function groundPatch(name,opacity){
  const node=new Node(name);actor.player.addChild(node);
  const positions=[],colors=[],indices=[],segments=32;
  const rings=[[0,opacity],[.35,opacity*.75],[.7,opacity*.25],[1,0]];
  rings.forEach(([radius,alpha])=>{for(let i=0;i<segments;i++){
   const angle=i/segments*Math.PI*2;positions.push(Math.cos(angle)*radius,0,Math.sin(angle)*radius);
   colors.push(.10,.065,.045,alpha);
  }});
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<segments;i++){
   const a=r*segments+i,b=r*segments+(i+1)%segments;
   indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
  const renderer=node.addComponent(MeshRenderer);renderer.mesh=utils.createMesh({positions,colors,indices});
  renderer.setMaterial(groundMaterial,0);renderer.shadowCastingMode=0;node.active=false;
  return node;
 }
 const floorAmbient=groundPatch('Beret soft floor occlusion',.23);
 const soleContact=groundPatch('Beret sole contact',.32);
 let contactY=0,contactX=0,contactLast=performance.now();
 function updateSideContact(){
  const now=performance.now(),dt=Math.min(.1,(now-contactLast)/1000);contactLast=now;
  const adult=actor.characterId==='silver-a';
  const f=actor.atlas?.frames[actor.frameName],g=adult&&actor.gaitMoving?f?.groundContact:null;
  const easing=1-Math.exp(-dt/0.055);
  // Preserve authored low flight; planted poses align the actual shoe sole with the floor.
  const target=g?1.12*((g.soleY+g.liftPx)/g.sourceSize-176/192):0;
  contactY=adult?contactY+(target-contactY)*easing:0;
  const targetX=g?(f.flipX?-1:1)*(g.soleX/g.sourceSize-.5)*1.24*1.12:0;
  contactX+= (targetX-contactX)*easing;
  if(footShadow){
   footShadow.active=actor.characterId!=='gold-a';
   if(g){
    footShadow.setPosition(0,.009,.015); // User: indicator stays centered, independent of planted shoe.
    const flight=g.liftPx>0;
    footShadow.setScale(flight?.23:.205,.005,flight?.12:.095);
   }else{
    const p=originalShadow.position,s=originalShadow.scale;
    footShadow.setPosition(p.x,actor.characterId==='gold-a'?-.012:p.y,p.z);footShadow.setScale(s.x,actor.characterId==='gold-a'?.002:s.y,s.z);
   }
  }
  floorAmbient.active=soleContact.active=actor.characterId==='gold-a';
  return contactY;
 }

 actor.animateFigure=function(dt){
  if(!this.atlas)return;if(!owns()){updateSideContact();const result=originalAnimate(dt);if(this.characterId==='gold-a'){
   const f=this.atlas.frames[this.frameName];if(f?.material)for(const name of ['hairGain','skinGain','clothGain'])if(f.material[name]){const v=this.actorMat.getProperty(name);this.actorMat.setProperty(name,new v.constructor(...f.material[name]))}
   if(f?.flipX){const[x,y,w,h]=f.frame,[sw,sh]=this.atlas.size,v=this.actorMat.getProperty('tilingOffset');this.actorMat.setProperty('tilingOffset',new v.constructor(-w/sw,-h/sh,(x+w)/sw,(y+h)/sh))}
   const scale=f?.presentation?.headScale??1,drop=f?.presentation?.headDrop??0;
   for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const t=r/16,x=c/8-.5,y=t-.5,i=(r*9+c)*3,k=Math.max(0,Math.min(1,(t-.50)/.125)),w=k*k*(3-2*k);this.lifeVertices[i]=x+(x*scale-x)*w;this.lifeVertices[i+1]=y+(.0625+(y-.0625)*scale-drop-y)*w;this.lifeVertices[i+2]=0}this.bodyMesh.updateSubMesh(0,this.lifeGeometry)
  }return result}
  const breathing=idleBreath(dt,this.frameName.includes('/idle/')&&!wasMoving&&!settling);window.__idleBreathState={character:this.characterId,weight:breathing.weight,breath:breathing.breath,sway:breathing.sway};
  if(this.characterId==='white-a'){
   const f=this.atlas.frames[this.frameName],scale=window.characterDisplaySizes?.getScale('white-a',1.12)??1.12,width=window.characterDisplaySizes?.getWidthScale('white-a',scale)??scale;
   const rootY=.5-176/192,off=f.presentation?.bodyOffsetX??0,sole=f.sole??{x:0,y:176/192,rootY:176/192},run=this.frameName.includes('/run/');
   const sideMotion=sideRunMotion.update(dt,/^[WE]\/run\//.test(this.frameName)&&(wasMoving||settling),phase,clock,!!f.flipX,this.atlas.sideRunFrameMs??120);
   const base=sole.registrationY??(run?sole.rootY:sole.y),lift=(base-176/192)*scale-.012/this.figure.scale.y;
   updateSideContact();
   if(footShadow)footShadow.active=false;floorAmbient.active=true;soleContact.active=!run||base-sole.y<.025;
   floorAmbient.setPosition(0,-.015,.025);floorAmbient.setScale(.22,.001,.12);
   soleContact.setPosition(sole.x*width*this.figure.scale.x,-.014,.006);soleContact.setScale(.085,.001,.055);
   for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const i=(r*9+c)*3,b=breathing.offset(r/16),follow=sideMotion.offset(r/16);this.lifeVertices[i]=(c/8-.5+off)*width+b[0]+follow[0];this.lifeVertices[i+1]=rootY+(r/16-.5-rootY)*scale+b[1]+follow[1]+lift;this.lifeVertices[i+2]=0;}
   this.bodyMesh.updateSubMesh(0,this.lifeGeometry);window.__whiteMotion={character:this.characterId,frame:this.frameName,scale,width,phase};return;
  }
  const scale=window.characterDisplaySizes?.getScale(this.characterId,this.characterId==='silver-a'?1.12:(this.characterId==='gold-a'?1.0929769069563948:1))??(this.characterId==='silver-a'?1.12:(this.characterId==='gold-a'?(window.characterDisplaySizes?.getScale(this.characterId,this.atlas.frames[this.frameName]?.presentation?.worldScale??1)??(this.atlas.frames[this.frameName]?.presentation?.worldScale??1)):(this.atlas.frames[this.frameName]?.presentation?.worldScale??1))),rootY=.5-176/192,y=updateSideContact();
  // beret-side-run-fit-v1: approved v8 sizes retained; v9 registers actual soles.
  const beret=this.characterId==='gold-a',sideRunFit=beret&&/^[WE]\/run\//.test(this.frameName);
  const redSideRun=this.characterId==='red-a'&&/^[WE]\/run\//.test(this.frameName);
  const actionFit=beret?(this.atlas.frames[this.frameName]?.presentation?.poseScale??1):(redSideRun?.90:1);
  const soleFrames={"W/idle/0": [0.923828125, -0.0361328125], "W/walk/0": [0.9140625, -0.142578125], "W/walk/1": [0.916015625, -0.083984375], "W/walk/2": [0.9140625, 0.013671875], "W/walk/3": [0.9140625, 0.130859375], "W/walk/4": [0.91796875, 0.140625], "W/walk/5": [0.923828125, -0.07421875], "W/walk/6": [0.91796875, 0.0146484375], "W/walk/7": [0.923828125, -0.1357421875], "S/idle/0": [0.91796875, 0.134765625], "S/walk/0": [0.919921875, -0.021484375], "S/walk/1": [0.919921875, -0.0234375], "S/walk/2": [0.919921875, -0.01953125], "S/walk/3": [0.921875, 0.064453125], "S/walk/4": [0.92578125, 0.056640625], "S/walk/5": [0.92578125, 0.052734375], "S/walk/6": [0.92578125, 0.052734375], "S/walk/7": [0.92578125, -0.0263671875], "N/idle/0": [0.9140625, -0.056640625], "N/walk/0": [0.9140625, -0.0361328125], "N/walk/1": [0.9140625, -0.0244140625], "N/walk/2": [0.9140625, -0.029296875], "N/walk/3": [0.912109375, -0.017578125], "N/walk/4": [0.9140625, 0.046875], "N/walk/5": [0.9140625, 0.04296875], "N/walk/6": [0.9140625, 0.044921875], "N/walk/7": [0.9140625, 0.048828125], "N/walk/8": [0.916015625, -0.041015625], "N/walk/9": [0.916015625, -0.033203125], "N/walk/10": [0.916015625, -0.015625], "N/walk/11": [0.916015625, -0.015625], "N/walk/12": [0.916015625, 0.044921875], "N/walk/13": [0.916015625, 0.033203125], "N/walk/14": [0.916015625, 0.0244140625], "N/walk/15": [0.916015625, -0.05078125], "S/run/0": [0.9140625, -0.005859375], "S/run/1": [0.9140625, -0.0302734375], "S/run/2": [0.9140625, 0.013671875], "S/run/3": [0.9140625, -0.0166015625], "S/run/4": [0.912109375, 0.0390625], "S/run/5": [0.9140625, 0.0146484375], "S/run/6": [0.9140625, 0.037109375], "S/run/7": [0.9140625, 0.0126953125], "N/run/0": [0.9140625, -0.0068359375], "N/run/1": [0.9140625, 0.0078125], "N/run/2": [0.9140625, 0.0078125], "N/run/3": [0.916015625, 0.04296875], "N/run/4": [0.9140625, 0.0390625], "N/run/5": [0.9140625, 0.033203125], "N/run/6": [0.912109375, 0.056640625], "N/run/7": [0.9140625, 0.0185546875], "W/run/0": [0.935546875, -0.197265625], "W/run/1": [0.935546875, -0.11328125], "W/run/2": [0.935546875, 0.3740234375], "W/run/3": [0.935546875, -0.11328125], "W/run/4": [0.935546875, -0.16015625], "W/run/5": [0.935546875, 0.1982421875], "W/run/6": [0.935546875, 0.400390625], "W/run/7": [0.935546875, -0.15625], "E/idle/0": [0.923828125, 0.0361328125], "E/walk/0": [0.9140625, 0.142578125], "E/walk/1": [0.916015625, 0.083984375], "E/walk/2": [0.9140625, -0.013671875], "E/walk/3": [0.9140625, -0.130859375], "E/walk/4": [0.91796875, -0.140625], "E/walk/5": [0.923828125, 0.07421875], "E/walk/6": [0.91796875, -0.0146484375], "E/walk/7": [0.923828125, 0.1357421875], "E/run/0": [0.935546875, 0.197265625], "E/run/1": [0.935546875, 0.11328125], "E/run/2": [0.935546875, -0.3740234375], "E/run/3": [0.935546875, 0.11328125], "E/run/4": [0.935546875, 0.16015625], "E/run/5": [0.935546875, -0.1982421875], "E/run/6": [0.935546875, -0.400390625], "E/run/7": [0.935546875, 0.15625], "N/run/8": [0.916015625, -0.0078125], "N/run/9": [0.916015625, 0.005859375], "N/run/10": [0.916015625, 0.009765625], "N/run/11": [0.916015625, 0.005859375], "N/run/12": [0.916015625, 0.03515625], "N/run/13": [0.916015625, 0.0322265625], "N/run/14": [0.916015625, 0.0556640625], "N/run/15": [0.916015625, -0.001953125]};
  const redSoleFrames={"W/walk/0": [0.9166666666666666, -0.18229166666666669], "W/walk/1": [0.9205729166666666, -0.109375], "W/walk/2": [0.9244791666666666, -0.07291666666666669], "W/walk/3": [0.9166666666666666, -0.16796875], "W/walk/4": [0.9205729166666666, -0.18098958333333331], "W/walk/5": [0.9244791666666666, -0.11067708333333331], "W/walk/6": [0.9244791666666666, -0.01953125], "W/walk/7": [0.9231770833333334, -0.15885416666666669], "S/walk/0": [0.908203125, -0.0107421875], "S/walk/1": [0.908203125, -0.00390625], "S/walk/2": [0.880859375, -0.00390625], "S/walk/3": [0.884765625, 0.0], "S/walk/4": [0.8828125, -0.01171875], "S/walk/5": [0.8671875, -0.009765625], "S/walk/6": [0.873046875, -0.009765625], "S/walk/7": [0.87109375, -0.005859375], "N/walk/0": [0.9140625, -0.005859375], "N/walk/1": [0.91015625, -0.01953125], "N/walk/2": [0.916015625, -0.017578125], "N/walk/3": [0.912109375, -0.01953125], "N/walk/4": [0.908203125, -0.015625], "N/walk/5": [0.90625, 0.013671875], "N/walk/6": [0.908203125, 0.013671875], "N/walk/7": [0.908203125, 0.0078125], "S/run/0": [0.91796875, 0.009765625], "S/run/1": [0.916015625, 0.013671875], "S/run/2": [0.916015625, 0.015625], "S/run/3": [0.916015625, 0.02734375], "S/run/4": [0.9140625, 0.021484375], "S/run/5": [0.9140625, 0.01953125], "S/run/6": [0.9140625, 0.0078125], "S/run/7": [0.916015625, 0.01171875], "N/run/0": [0.90625, -0.0048828125], "N/run/1": [0.904296875, -0.009765625], "N/run/2": [0.90625, -0.0078125], "N/run/3": [0.904296875, -0.01171875], "N/run/4": [0.89453125, -0.02734375], "N/run/5": [0.89453125, -0.01171875], "N/run/6": [0.89453125, -0.0078125], "N/run/7": [0.89453125, -0.02734375], "W/run/0": [0.95703125, -0.224609375], "W/run/1": [0.955078125, -0.080078125], "W/run/2": [0.966796875, 0.173828125], "W/run/3": [0.94921875, -0.197265625], "W/run/4": [0.94140625, -0.2197265625], "W/run/5": [0.9453125, -0.0234375], "W/run/6": [0.955078125, 0.2265625], "W/run/7": [0.93359375, -0.1953125], "S/idle/0": [0.9140625, -0.013671875], "W/idle/0": [0.908203125, -0.037109375], "N/idle/0": [0.90625, -0.0234375], "E/walk/0": [0.9166666666666666, 0.18229166666666669], "E/walk/1": [0.9205729166666666, 0.109375], "E/walk/2": [0.9244791666666666, 0.07291666666666669], "E/walk/3": [0.9166666666666666, 0.16796875], "E/walk/4": [0.9205729166666666, 0.18098958333333331], "E/walk/5": [0.9244791666666666, 0.11067708333333331], "E/walk/6": [0.9244791666666666, 0.01953125], "E/walk/7": [0.9231770833333334, 0.15885416666666669], "E/run/0": [0.95703125, 0.224609375], "E/run/1": [0.955078125, 0.080078125], "E/run/2": [0.966796875, -0.173828125], "E/run/3": [0.94921875, 0.197265625], "E/run/4": [0.94140625, 0.2197265625], "E/run/5": [0.9453125, 0.0234375], "E/run/6": [0.955078125, -0.2265625], "E/run/7": [0.93359375, 0.1953125], "E/idle/0": [0.908203125, 0.037109375]};
  const sole=(redSideRun?redSoleFrames:soleFrames)[this.frameName]??[176/192,0];
  const running=(beret||redSideRun)&&this.frameName.includes('/run/');
  const flight=running?[0,.009,.018,.008,0,.009,.018,.008][phase%8]:0;
  // Player root is y=.03; wooden floor top y=.013. Keep a .005 sole clearance.
  const fitLift=(beret||redSideRun)?(sole[0]-176/192)*scale*actionFit+(-.012+flight)/this.figure.scale.y:0;
  if(beret){
   const width=window.characterDisplaySizes?.getWidthScale(this.characterId,scale)??scale;
   floorAmbient.setPosition(0,-.015,.025);floorAmbient.setScale(.25+flight,.001,.14+flight);
   soleContact.setPosition((sole[1]+(this.atlas.frames[this.frameName]?.presentation?.bodyOffsetX??0))*width*actionFit*this.figure.scale.x,-.014,.006);
   soleContact.setScale(running?.085:.10,.001,running?.055:.065);
   soleContact.active=flight<.015;
  }
  window.__beretActionFit={frame:this.frameName,factor:actionFit,lift:fitLift,baseScale:scale,
   soleY:beret?.018+flight:null,flight,character:this.characterId,grounding:'v19-fixed-side-run-scale'};
  for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const i=(r*9+c)*3;this.lifeVertices[i]=(c/8-.5+(this.atlas.frames[this.frameName]?.presentation?.bodyOffsetX??0))*(window.characterDisplaySizes?.getWidthScale(this.characterId,scale)??scale)*actionFit;this.lifeVertices[i+1]=rootY+(r/16-.5-rootY)*scale*actionFit+y+fitLift;const idleOffset=breathing.offset(r/16);this.lifeVertices[i]+=idleOffset[0];this.lifeVertices[i+1]+=idleOffset[1];this.lifeVertices[i+2]=0}this.bodyMesh.updateSubMesh(0,this.lifeGeometry);
 };
 if(actor.atlas)await actor.setCharacter(actor.characterId,actor.characterName,actor.facing);
};
