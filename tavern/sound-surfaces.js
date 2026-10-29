// Read visible rug geometry, including generated doorway mats, after static batching.
export function soundSurfaces(cc){
 const regions=[],windows=[];
 function capture(root,type){
  const triangles=[];
  for(const r of root.getComponentsInChildren(cc.MeshRenderer)){
   const mesh=r.mesh;if(!mesh)continue;
   for(let part=0;part<mesh.struct.primitives.length;part++){
    const p=mesh.readAttribute(part,cc.gfx.AttributeName.ATTR_POSITION),idx=mesh.readIndices(part);if(!p)continue;
    const points=[];for(let i=0;i<p.length;i+=3)points.push(cc.Vec3.transformMat4(new cc.Vec3(),new cc.Vec3(p[i],p[i+1],p[i+2]),r.node.worldMatrix));
    const indices=idx||points.map((_,i)=>i);for(let i=0;i+2<indices.length;i+=3){const a=points[indices[i]],b=points[indices[i+1]],c=points[indices[i+2]];if(!a||!b||!c)continue;const area=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);if(Math.abs(area)>1e-8)triangles.push([a.x,a.z,b.x,b.z,c.x,c.z]);}
   }
  }
  if(triangles.length){const bounds=triangles.reduce((a,t)=>[Math.min(a[0],t[0],t[2],t[4]),Math.max(a[1],t[0],t[2],t[4]),Math.min(a[2],t[1],t[3],t[5]),Math.max(a[3],t[1],t[3],t[5])],[Infinity,-Infinity,Infinity,-Infinity]);regions.push({name:root.name,type,triangles,bounds});}
 }
 function walk(n){
  if(n.name==='Wall window'){const p=n.worldPosition;windows.push({x:p.x,z:p.z,on:true,canClose:false,decorative:true});}
  if(n.name.startsWith('Room emblem mat')){capture(n,'mat');return;}
  const model=n.name.match(/\b(rug[\w-]*)/);
  if(model){const prefab=cc.resources.get('models/'+model[1]+'/'+model[1],cc.Prefab);if(prefab){const copy=cc.instantiate(prefab);n.addChild(copy);copy.setPosition(0,0,0);copy.setRotationFromEuler(0,0,0);copy.setScale(1,1,1);capture(copy,'carpet');copy.destroy();}else capture(n,'carpet');return;}
  for(const child of [...n.children])walk(child);
 }
 walk(cc.director.getScene());regions.sort((a,b)=>(a.type==='mat'?-1:0)-(b.type==='mat'?-1:0));return {regions,windows};
}
export function surfaceAt(regions,{x,z}){
 for(const r of regions){if(x<r.bounds[0]||x>r.bounds[1]||z<r.bounds[2]||z>r.bounds[3])continue;for(const [ax,az,bx,bz,cx,cz]of r.triangles){const d=(bx-ax)*(cz-az)-(bz-az)*(cx-ax),u=((x-ax)*(cz-az)-(z-az)*(cx-ax))/d,v=((bx-ax)*(z-az)-(bz-az)*(x-ax))/d;if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001)return r.type;}}return 'wood';
}
