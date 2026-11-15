window.__installStoryNPC=async function(actor,{savedSize,world:existingWorld}={}){
 const cc=await System.import('cc'),atlas=await(await fetch('/npc/all.json')).json();
 const image=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src='/npc/all.png'});
 const texture=new cc.Texture2D();texture.image=new cc.ImageAsset(image);texture.setFilters(2,2) /* Cocos Filter.LINEAR: avoid enlarged point-sampled blocks */;
 const node=new cc.Node('NPC · 酒保 · 埃德蒙·霍桑');actor.node.addChild(node);const figure=new cc.Node('NPC figure');node.addChild(figure);figure.setScale(actor.figure.scale);figure.setRotation(actor.figure.rotation);
 const geo={lifeVertices:new Float32Array(9*17*3),lifeGeometry:{positions:null,indices16:new Uint16Array(768)}};geo.lifeGeometry.positions=geo.lifeVertices;
 const mesh=actor.createLivingFigure.call(geo),renderer=figure.addComponent(cc.MeshRenderer);renderer.mesh=mesh;
 const material=new cc.Material();material.copy(actor.actorMat);material.setProperty('mainTexture',texture);for(const k of ['hairGain','skinGain','clothGain'])material.setProperty(k,new cc.Vec4(...(atlas.frames['W/walk/0'].material?.[k]||[.94,.94,.94,.94])));renderer.setMaterial(material,0);
 const {installBartenderWorld}=await import('/npc-ui/bartender.js');
 const world=existingWorld||await installBartenderWorld(actor,cc);
 let x=0,z=0,room='',facing='S',phase=0,paused=true,groundY=.013,groundRoom='',last=performance.now();
 const frameSeconds=.1,speed=2.1;
 // Measure sole contacts from each complete frame, without changing its artwork.
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
 const contactMap={};for(const key of Object.keys(atlas.frames)){const [fx,fy,fw]=atlas.frames[key].frame;const pixels=ctx.getImageData(fx,fy+(atlas.soleY??469)-5,fw,6).data,xs=[];for(let x=0;x<fw;x++){let n=0;for(let y=0;y<6;y++)if(pixels[(y*fw+x)*4+3]>200)n++;if(n>=2)xs.push(x)}const groups=[];for(const x of xs){if(!groups.length||x-groups.at(-1).at(-1)>5)groups.push([]);groups.at(-1).push(x)}contactMap[key]=groups.filter(g=>g.length>8).sort((a,b)=>b.length-a.length).slice(0,2).map(g=>({x:(g[0]+g.at(-1))/2,width:g.at(-1)-g[0]+1}));}
 // Soft body occlusion plus tighter sole contacts, using the furniture shadow shader.
 const ambient=new cc.Node('NPC soft ground occlusion');node.addChild(ambient);ambient.setPosition(0,.0015,0);
 const positions=[0,0,0],colors=[.10,.065,.045,.40],indices=[];for(let ring=1;ring<=4;ring++)for(let i=0;i<=32;i++){const a=i*Math.PI*2/32,r=ring/4;positions.push(Math.cos(a)*r,0,Math.sin(a)*r);colors.push(.10,.065,.045,.40*(1-r)**2)}for(let i=0;i<32;i++)indices.push(0,1+i,2+i);for(let ring=0;ring<3;ring++)for(let i=0;i<32;i++){const a=1+ring*33+i;indices.push(a,a+33,a+1,a+1,a+33,a+34)}
 const ar=ambient.addComponent(cc.MeshRenderer);ar.mesh=cc.utils.createMesh({positions,colors,indices});const am=new cc.Material();am.initialize({effectAsset:actor.unlitEffect,technique:1,defines:{USE_TEXTURE:false,USE_ALPHA_TEST:false,USE_VERTEX_COLOR:true},states:{rasterizerState:{cullMode:0}}});am.setProperty('mainColor',cc.Color.WHITE);ar.setMaterial(am,0);ar.shadowCastingMode=0;
 const shadows=[];for(let j=0;j<2;j++)for(let k=0;k<3;k++){const mat=new cc.Material();mat.initialize({effectAsset:actor.unlitEffect,technique:1,defines:{USE_TEXTURE:false,USE_ALPHA_TEST:false}});mat.setProperty('mainColor',new cc.Color(26,20,15,95));const n=actor.primitive(node,'NPC sole '+j+' '+k,0,.002+k*.0002,0,.1,.001,.08,mat,true);shadows.push({n,j,k})}
 function update(now){if(!node.isValid)return;last=now;const state=world.state;
 if(state){({x,z,room,facing}=state.npc);paused=!state.npc.moving;phase=state.npc.phase||0;}
 node.active=!!state&&actor.room.id===room&&!actor.transitioning;if(node.active){
 if(groundRoom!==actor.room.id){const floors=actor.stage.getComponentsInChildren(cc.MeshRenderer).filter(r=>/floor/i.test(r.node.name+' '+r.node.parent?.name)).map(r=>r.model?.worldBounds).filter(b=>b&&b.halfExtents.y<.05&&Math.abs(x-b.center.x)<=b.halfExtents.x&&Math.abs(z-b.center.z)<=b.halfExtents.z);groundY=floors.length?Math.max(...floors.map(b=>b.center.y+b.halfExtents.y)):.013;groundRoom=actor.room.id;}
 const source=facing==='E'?'W':facing,key=paused?facing+'/idle/0':source+'/walk/'+phase,frame=atlas.frames[key],flip=!paused&&facing==='E';
 const h=window.characterScaleEditor?.getScale('innkeeper-fat',savedSize?.height||1)||savedSize?.height||1,w=window.characterScaleEditor?.getWidthScale('innkeeper-fat',savedSize?.width||1)||savedSize?.width||1,rootY=.5-176/192;
 for(let r=0;r<=16;r++)for(let c=0;c<=8;c++){const i=(r*9+c)*3;geo.lifeVertices[i]=(c/8-.5)*w;geo.lifeVertices[i+1]=rootY+(r/16-.5-rootY)*h;geo.lifeVertices[i+2]=0}mesh.updateSubMesh(0,geo.lifeGeometry);
 const [fx,fy,fw,fh]=frame.frame,[sw,sh]=atlas.size;material.setProperty('tilingOffset',new cc.Vec4((flip?-fw:fw)/sw,-fh/sh,(flip?fx+fw:fx)/sw,(fy+fh)/sh));const registration=(frame.registrationX||0)/(atlas.pixelCell??512)*figure.scale.x*w*(flip?-1:1);figure.setPosition(registration,-rootY*figure.scale.y,0);node.setPosition(x,groundY,z);
 ambient.setScale(.35*w,1,.17*w);
 for(const {n,j,k} of shadows){const foot=contactMap[key]?.[j];n.active=!!foot;if(foot){n.setPosition(registration+(foot.x/(atlas.pixelCell??512)-.5)*figure.scale.x*w*(flip?-1:1),.002+k*.0002,0);const a=1-k*.23;n.setScale(foot.width/(atlas.pixelCell??512)*figure.scale.x*w*a,.001,.12*a)}}
 }requestAnimationFrame(update)}requestAnimationFrame(update);
 window.__bartenderNPC={node,figure,atlas,get state(){return {x,z,facing,phase,room,visible:node.active,paused,groundY,speed,frameSeconds,role:'酒保',name:'埃德蒙·霍桑'};}};
 // Legacy diagnostic handle only. The character's current identity is bartender.
 window.__storyNPC=window.__bartenderNPC;
};
