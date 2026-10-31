
function materialRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL 不可用');
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v;uniform sampler2D tex;uniform vec3 stockingGain;uniform vec4 rect;uniform float flip;uniform float calibrated;uniform vec3 hairSourceLuma;uniform vec3 hairDark;uniform vec3 hairMid;uniform vec3 hairLight;
 void main(){vec2 uv=v;if(flip>.5)uv.x=1.-uv.x;vec4 c=texture2D(tex,rect.xy+uv*rect.zw);vec3 raw=c.rgb;
 if(calibrated>.5){float lum=dot(raw,vec3(.2126,.7152,.0722));float mask=smoothstep(.015,.04,raw.b-max(raw.r,raw.g))*(1.-smoothstep(.70,.73,v.y))*smoothstep(.035,.065,lum);vec3 mapped;
 if(lum<hairSourceLuma.x)mapped=hairDark*lum/max(.001,hairSourceLuma.x);
 else if(lum<hairSourceLuma.y)mapped=mix(hairDark,hairMid,(lum-hairSourceLuma.x)/max(.001,hairSourceLuma.y-hairSourceLuma.x));
 else if(lum<hairSourceLuma.z)mapped=mix(hairMid,hairLight,(lum-hairSourceLuma.y)/max(.001,hairSourceLuma.z-hairSourceLuma.y));
 else mapped=mix(hairLight,vec3(1.),clamp((lum-hairSourceLuma.z)/max(.001,1.-hairSourceLuma.z),0.,1.));
 c.rgb=mix(raw,mapped,mask);}
float stockMask=smoothstep(.53,.57,v.y)*(1.-smoothstep(.82,.88,v.y))*smoothstep(.025,.06,raw.r-raw.b)*(1.-smoothstep(.19,.27,raw.r-raw.g))*(1.-smoothstep(.46,.60,max(raw.r,max(raw.g,raw.b))))*smoothstep(.16,.24,min(raw.r,min(raw.g,raw.b)));
c.rgb=mix(c.rgb,c.rgb*stockingGain,stockMask);gl_FragColor=c;}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
 const loc=Object.fromEntries(['stockingGain','rect','flip','calibrated','hairSourceLuma','hairDark','hairMid','hairLight'].map(k=>[k,gl.getUniformLocation(program,k)]));let source;
 return(img,f,material={},flip=false)=>{gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);if(source!==img){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);source=img}const[x,y,w,h]=f;gl.uniform3fv(loc.stockingGain,material.stockingGain||[1,1,1]);gl.uniform4f(loc.rect,x/img.width,y/img.height,w/img.width,h/img.height);gl.uniform1f(loc.flip,flip?1:0);gl.uniform1f(loc.calibrated,material.hairPalette?1:0);gl.uniform3fv(loc.hairSourceLuma,material.hairSourceLuma||[.1,.3,.7]);const colors=material.hairPalette||[[0,0,0],[.3,.3,.3],[.7,.7,.7]];for(const [i,key]of ['hairDark','hairMid','hairLight'].entries())gl.uniform3fv(loc[key],colors[i]);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6)}
}


// Shared budget: two room slots and one character slot, then three room slots.
window.__installCharacterQueue=async function(actor){
 const cc=await System.import('cc'),raw=new Map(),tasks=new Map();let urgent=0,started=false,roomTasks=new Set(),controllers=new Set();
 const ids=['blue-a','silver-a'],sleep=ms=>new Promise(r=>setTimeout(r,ms));
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
 const prepared=new Map(),pending=new Map(),owns=()=>['blue-a','silver-a'].includes(actor.characterId);
 let phase=2,clock=0,last=performance.now(),lastDistance=actor.distance,wasMoving=false,settling=false,selectRequest=0;
 async function prepare(id){
  if(prepared.has(id))return prepared.get(id);if(pending.has(id))return pending.get(id);
  const task=(async()=>{const base=new URL('characters/'+id+'/atlas',document.baseURI),cached=actor.actorCache.get(id);const [atlas,img]=cached?[cached.atlas,cached.texture.image.data]:await (async()=>{const data=await actor.characterDownloads.get(id),url=URL.createObjectURL(data.image);try{const img=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=url});return [data.atlas,img]}finally{URL.revokeObjectURL(url)}})();
   if(!['S','N','W','E'].every(d=>atlas.clips['walk-'+d]?.length===8&&atlas.clips['run-'+d]?.length===8&&atlas.clips['idle-'+d]?.length===1))throw Error('确认动作缺失');
   let source=img;if(id==='blue-a'){const out=document.createElement('canvas');out.width=img.width;out.height=img.height;const ctx=out.getContext('2d');ctx.drawImage(img,0,0);const cell=document.createElement('canvas'),draw=materialRenderer(cell);for(const f of Object.values(atlas.frames)){if(!f.previewMaterial?.hairPalette&&!f.previewMaterial?.stockingGain)continue;const[x,y,w,h]=f.frame;cell.width=w;cell.height=h;draw(img,f.frame,f.previewMaterial);ctx.clearRect(x,y,w,h);ctx.drawImage(cell,x,y,w,h)}source=out}
   const texture=new Texture();texture.image=new ImageAsset(source);texture.setFilters(1,1);const entry={texture,atlas};prepared.set(id,entry);return entry})();pending.set(id,task);try{return await task}finally{pending.delete(id)}
 }
 actor.setCharacter=async function(id,name='',direction='S'){
  const request=++selectRequest;if(!this.atlas)await this.loadActor(id);if(['blue-a','silver-a'].includes(id)){const entry=await prepare(id);if(request!==selectRequest)return;this.actorCache.set(id,entry)}
  if(request!==selectRequest)return;phase=2;clock=0;settling=false;wasMoving=false;last=performance.now();lastDistance=this.distance;return originalSet(id,name,direction);
 };
 const change=actor.setCharacter.bind(actor);
 actor.setCharacter=async function(id,name,direction){
  if(!['blue-a','silver-a'].includes(id))throw Error('此角色尚未发布');
  if(this.actorCache.has(id))return change(id,name,direction);
  const wasEntered=this.entered;let overlay=null;
  if(wasEntered){let doc=document;try{if(parent!==window)doc=parent.document}catch{}overlay=doc.createElement('div');overlay.id='character-amber-loading';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','正在准备角色');overlay.style.cssText='position:fixed;inset:0;z-index:100040;background:radial-gradient(ellipse at 64% 40%,#7c5634,#322131 60%,#140f1b)';doc.body.append(overlay);}
  try{return await this.characterDownloads.priority(()=>change(id,name,direction))}finally{overlay?.remove()}
 };
 actor.movementClip=function(){return owns()?(this.running?'run-':'walk-'):originalClip()};
 actor.drawFrame=function(frame,moving){
  if(!this.atlas)return;if(!owns())return originalDraw(frame,moving);
  const now=performance.now(),delta=Math.min(100,Math.max(0,now-last));last=now;const actual=moving&&this.distance>lastDistance;lastDistance=this.distance;
  const interval=this.running?120:(this.characterId==='silver-a'&&this.facing==='N'?180:140);
  if(actual){if(!wasMoving)clock=0;settling=false;clock+=delta}else if(wasMoving){settling=![2,6].includes(phase);clock=0}else if(settling)clock+=delta;
  while(clock>=interval){clock-=interval;phase=(phase+1)%8;if(!actual&&[2,6].includes(phase)){settling=false;clock=0;break}}
  wasMoving=actual;const result=originalDraw(phase,actual||settling),f=this.atlas.frames[this.frameName];if(!f)return result;
  for(const name of ['hairGain','skinGain','clothGain']){const v=this.actorMat.getProperty(name);this.actorMat.setProperty(name,new v.constructor(1,1,1,1))}
  const[x,y,w,h]=f.frame,[sw,sh]=this.atlas.size,v=this.actorMat.getProperty('tilingOffset');this.actorMat.setProperty('tilingOffset',new v.constructor((f.flipX?-w:w)/sw,-h/sh,(f.flipX?x+w:x)/sw,(y+h)/sh));return result;
 };
  // Whole-pose floor registration only. No changes to authored limb or body shapes.
 const footShadow=actor.player.getChildByName('Foot contact');
 const originalShadow=footShadow?{position:{...footShadow.position},scale:{...footShadow.scale}}:null;
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
   if(g){
    footShadow.setPosition(contactX,.009,.015);
    const flight=g.liftPx>0;
    footShadow.setScale(flight?.23:.205,.005,flight?.12:.095);
   }else{
    const p=originalShadow.position,s=originalShadow.scale;
    footShadow.setPosition(p.x,p.y,p.z);footShadow.setScale(s.x,s.y,s.z);
   }
  }
  return contactY;
 }

 actor.animateFigure=function(dt){
  if(!this.atlas)return;if(!owns()){updateSideContact();const result=originalAnimate(dt);if(this.characterId==='red-a'){
   const f=this.atlas.frames[this.frameName];if(f?.material)for(const name of ['hairGain','skinGain','clothGain'])if(f.material[name]){const v=this.actorMat.getProperty(name);this.actorMat.setProperty(name,new v.constructor(...f.material[name]))}
   if(f?.flipX){const[x,y,w,h]=f.frame,[sw,sh]=this.atlas.size,v=this.actorMat.getProperty('tilingOffset');this.actorMat.setProperty('tilingOffset',new v.constructor(-w/sw,-h/sh,(x+w)/sw,(y+h)/sh))}
   const scale=f?.presentation?.headScale??1,drop=f?.presentation?.headDrop??0;
   for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const t=r/16,x=c/8-.5,y=t-.5,i=(r*9+c)*3,k=Math.max(0,Math.min(1,(t-.50)/.125)),w=k*k*(3-2*k);this.lifeVertices[i]=x+(x*scale-x)*w;this.lifeVertices[i+1]=y+(.0625+(y-.0625)*scale-drop-y)*w;this.lifeVertices[i+2]=0}this.bodyMesh.updateSubMesh(0,this.lifeGeometry)
  }return result}
  const scale=this.characterId==='silver-a'?1.12:1,rootY=.5-176/192,y=updateSideContact();
  for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const i=(r*9+c)*3;this.lifeVertices[i]=(c/8-.5)*scale;this.lifeVertices[i+1]=rootY+(r/16-.5-rootY)*scale+y;this.lifeVertices[i+2]=0}this.bodyMesh.updateSubMesh(0,this.lifeGeometry);
 };
 if(actor.atlas)await actor.setCharacter(actor.characterId,actor.characterName,actor.facing);
};
