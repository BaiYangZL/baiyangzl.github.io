// A short, user-triggered performance of the original HD illustration.
// This is a calibrated 2D portrait rig, not the indoor pixel-character animator.
// No extra frame images, timer loops, audio, or additional animation clocks.
export const GREETING_SECONDS=5;
export const SETTLE_SECONDS=5;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const radians=d=>d*Math.PI/180;
export const PORTRAIT_RIGS={
 'blue-a':{
  waist:[560,850],neck:[520,442],elbow:[855,735],wrist:[805,426],
  headBottom:[388,494],headRight:[713,763],
  forearm:[[756,305],[863,327],[934,751],[892,817],[815,788],[767,490]],
  wristRegion:[[742,309],[858,312],[883,409],[830,480],[763,451]],
  hairLeft:[265,430],hairRight:[790,925],hairStart:410,hairEnd:1030,
  eyes:[[486,256,39,18,.31],[603,300,38,18,.34]],handSign:1
 },
 'gold-a':{
  waist:[439,933],neck:[505,431],elbow:[931,437],wrist:[756,267],
  headBottom:[368,466],headRight:[616,717],
  forearm:[[578,112],[711,92],[786,250],[992,414],[998,475],[890,489],[717,325],[638,265]],
  wristRegion:[[569,118],[713,88],[766,244],[721,305],[608,232]],
  hairLeft:[170,341],hairRight:[650,827],hairStart:463,hairEnd:1220,
  eyes:[[434,318,34,17,-.12],[537,282,35,18,-.34]],handSign:-1
 }
};
// Keyed poses are angles/translations, not replacement pictures. Hermite sampling
// preserves velocity at every join; the first/last derivatives are zero.
const keys=[
 [0,    0,    0,   0,    0,  0,  0],
 [.45, -.55,-1.2,  .6,  1.1, -1, -2],
 [1.12,-1.3,-5.4, -2.0,-3.4, 10, -9],
 [1.90, .75,-2.1,  2.3, 3.8,  4,  8],
 [2.65, 1.05,-4.1, 1.7, 2.6,  2, 10],
 [3.35, .65,-2.8,  .8, 1.2,  1,  5],
 [4,    .35,-1.6, .55,  .8,  1,  3],
 [5,    0,    0,   0,    0,  0,  0]
];
const slope=(i,j)=>i===0||i===keys.length-1?0:(keys[i+1][j]-keys[i-1][j])/(keys[i+1][0]-keys[i-1][0]);
function sample(t,j){
 if(t<=0||t>=SETTLE_SECONDS)return 0;
 let i=0;while(keys[i+1][0]<t)i++;
 const a=keys[i],b=keys[i+1],d=b[0]-a[0],u=(t-a[0])/d,u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*a[j]+(u3-2*u2+u)*d*slope(i,j)+(-2*u3+3*u2)*b[j]+(u3-u2)*d*slope(i+1,j);
}
function blink(t,at){const d=t-at;return d<0||d>.29?0:d<.085?smooth(0,.085,d):d<.125?1:1-smooth(.125,.29,d);}
export function greetingPose(t){
 return {body:radians(sample(t,1)),head:radians(sample(t,2)),arm:radians(sample(t,3)),wrist:radians(sample(t,4)),nod:sample(t,5),hair:sample(t,6),blink:Math.max(blink(t,.92),blink(t,2.58)),settled:t>=SETTLE_SECONDS,finished:t>=GREETING_SECONDS};
}
function inside(x,y,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function edgeDistance(x,y,poly){let d=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return d;}
function regionWeight(x,y,poly){return inside(x,y,poly)?smooth(0,18,edgeDistance(x,y,poly)):0;}
export function portraitWeights(x,y,rig){
 const arm=regionWeight(x,y,rig.forearm),wrist=regionWeight(x,y,rig.wristRegion);
 const head=(1-smooth(...rig.headBottom,y))*(1-smooth(...rig.headRight,x))*(1-Math.max(arm,wrist));
 const body=1-smooth(840,1400,y);
 const outer=(1-smooth(...rig.hairLeft,x))+smooth(...rig.hairRight,x);
 const hair=smooth(rig.hairStart,rig.hairEnd,y)*Math.min(1,outer)*(1-Math.max(arm,wrist));
 return [body,head,arm,wrist,hair];
}
const vertex=`
 attribute vec2 point;
 attribute vec4 bones;
 attribute float hairWeight;
 uniform vec2 waist,neck,elbow,wrist;
 uniform vec4 angles;
 uniform vec2 motion;
 varying vec2 uv;
 vec2 rotateAt(vec2 p,vec2 o,float a){float c=cos(a),s=sin(a);p-=o;return o+vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
 void main(){
  uv=point/vec2(1024.,1536.);
  vec2 p=point;
  p+=bones.y*(rotateAt(point,neck,angles.y)-point+vec2(0.,motion.x));
  p+=bones.z*(rotateAt(point,elbow,angles.z)-point);
  p+=bones.w*(rotateAt(point,wrist,angles.w)-point);
  p.x+=hairWeight*motion.y;
  p.y+=hairWeight*motion.y*.18;
  p=mix(p,rotateAt(p,waist,angles.x),bones.x);
  gl_Position=vec4(p.x/512.-1.,1.-p.y/768.,0.,1.);
 }`;
const fragment=`
 precision highp float;
 uniform sampler2D portrait;
 uniform vec4 eyeA,eyeB;
 uniform vec2 eyeAngles;
 uniform float blinkAmount;
 varying vec2 uv;
 vec4 eyelid(vec4 color,vec4 eye,float angle){
  vec2 d=uv*vec2(1024.,1536.)-eye.xy;
  float c=cos(angle),s=sin(angle);
  vec2 p=vec2(c*d.x+s*d.y,-s*d.x+c*d.y);
  float q=p.x/eye.z,r=p.y/eye.w;
  float mask=(1.-smoothstep(.88,1.13,q*q+r*r))*blinkAmount;
  vec2 skinPoint=eye.xy+vec2(c*p.x-s*eye.w*1.5,s*p.x+c*eye.w*1.5);
  vec4 skin=texture2D(portrait,skinPoint/vec2(1024.,1536.));
  float line=3.8*(1.-q*q);
  float lash=(1.-smoothstep(1.,2.4,abs(p.y-line)))*(1.-smoothstep(.83,1.02,abs(q)));
  vec3 lid=mix(skin.rgb,vec3(.16,.065,.055)*skin.a,lash);
  return vec4(mix(color.rgb,lid,mask),color.a);
 }
 void main(){vec4 color=texture2D(portrait,uv);if(blinkAmount>.001){color=eyelid(color,eyeA,eyeAngles.x);color=eyelid(color,eyeB,eyeAngles.y);}gl_FragColor=color;}
`;
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;}
function createRenderer(){
 const canvas=document.createElement('canvas');canvas.className='cs-hero-motion';canvas.width=1024;canvas.height=1536;canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
 if(!gl)throw Error('Portrait motion is unavailable');
 const program=gl.createProgram(),vs=compile(gl,gl.VERTEX_SHADER,vertex),fs=compile(gl,gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const vertices=[],indices=[],nx=64,ny=96;
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)vertices.push(x*1024/nx,y*1536/ny,0,0,0,0,0);
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const data=new Float32Array(vertices),buffer=gl.createBuffer(),index=gl.createBuffer(),texture=gl.createTexture();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 for(const [name,size,offset]of [['point',2,0],['bones',4,8],['hairWeight',1,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);}
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const locations={};for(const n of ['waist','neck','elbow','wrist','angles','motion','eyeA','eyeB','eyeAngles','blinkAmount'])locations[n]=gl.getUniformLocation(program,n);
 gl.viewport(0,0,1024,1536);gl.clearColor(0,0,0,0);
 let rig;
 return {canvas,gl,
  use(image,profile){rig=profile;for(let i=0;i<data.length;i+=7)data.set(portraitWeights(data[i],data[i+1],rig),i+2);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);for(const n of ['waist','neck','elbow','wrist'])gl.uniform2fv(locations[n],rig[n]);gl.uniform4fv(locations.eyeA,rig.eyes[0].slice(0,4));gl.uniform4fv(locations.eyeB,rig.eyes[1].slice(0,4));gl.uniform2f(locations.eyeAngles,rig.eyes[0][4],rig.eyes[1][4]);},
  draw(p){gl.uniform4f(locations.angles,p.body,p.head,p.arm*rig.handSign,p.wrist*rig.handSign);gl.uniform2f(locations.motion,p.nod,p.hair);gl.uniform1f(locations.blinkAmount,p.blink);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);},
  dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteBuffer(index);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();canvas.width=canvas.height=1;}
 };
}
export function createHeroGreeting({reduced=false}={}){
 let renderer=null,layer=null,start=0,played=-1,settled=false,disposed=false,failed=false,draws=0,lastDraw=-Infinity;
 function restore(){if(layer){layer.h.classList.remove('cs-performing');layer.h.dataset.greeting='rest';}renderer?.canvas.remove();}
 function play(next,t){
  if(disposed||failed||reduced||!PORTRAIT_RIGS[next.c.id])return;
  restore();layer=next;start=t;settled=false;draws=0;lastDraw=-Infinity;played=next.greetingRequest;
  try{if(!renderer){renderer=createRenderer();renderer.canvas.addEventListener('webglcontextlost',()=>{failed=true;restore();},{once:true});}renderer.use(next.c.heroImage,PORTRAIT_RIGS[next.c.id]);next.h.append(renderer.canvas);renderer.draw(greetingPose(0));next.h.classList.add('cs-performing');next.h.dataset.greeting='playing';next.h.dataset.greetingStarted=String(t);}
  catch(error){failed=true;restore();console.warn('立绘动作暂不可用，保留原画。',error);}
 }
 return {
  update(target,t,{enabled=true}={}){
   if(disposed||reduced||failed)return;
   if(enabled&&target&&target.greetingRequest!==played)play(target,t);
   if(!layer||!renderer||layer!==target||!enabled||settled)return;
   const elapsed=t-start,p=greetingPose(elapsed);
   layer.h.dataset.greetingTime=Math.min(5,elapsed).toFixed(3);
   if(p.settled){restore();settled=true;layer.h.dataset.greeting='rest';layer.h.dataset.greetingTime=SETTLE_SECONDS.toFixed(3);layer.h.dataset.greetingDraws=String(draws);return;}
   // 144/240 Hz displays do not need 144/240 portrait redraws per second.
   if(t-lastDraw<1/60-.0005)return;lastDraw=t;
   renderer.draw(p);draws++;layer.h.dataset.greetingDraws=String(draws);
  },
  dispose(){disposed=true;restore();renderer?.dispose();renderer=null;layer=null;}
 };
}
