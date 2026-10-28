// Runs against ORIGINAL release bytes, before transport compression. No network or saves.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(root){const entries={};function walk(relative=''){for(const item of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
 if(item.name.startsWith('.')||['node_modules','tools'].includes(item.name))continue;
 const name=[relative,item.name].filter(Boolean).join('/');if(['release-load-manifest.json','release-load-report.json'].includes(name))continue;
 assert(!item.isSymbolicLink(),'发布树不能含目录连接: '+name);if(item.isDirectory())walk(name);else{const b=fs.readFileSync(path.join(root,name));entries[name]={bytes:b.length,sha256:sha(b)};}
 }}walk();return entries;}
function check(root){root=path.resolve(root);const release=JSON.parse(fs.readFileSync(path.join(root,'release-load-manifest.json'))),actual=inventory(root);
 assert.equal(fs.readFileSync(path.join(root,'.gitattributes'),'utf8').trim(),'* -text','发布树必须禁止Git自动改写已校验字节');
 assert.deepEqual(actual,release.files,'发布内容在准备后发生变化，请重新准备并验证，不能混发旧清单');
 const sample=fs.readFileSync(path.join(root,'sample.js'),'utf8'),transition=fs.readFileSync(path.join(root,'tavern-transition.js'),'utf8');for(const name of ['coverCinema','enterCinema'])if(sample.includes('tavernTransition.'+name+'('))assert(transition.includes('function '+name+'(')&&transition.match(/return \{prepare[^\n]+/)[0].includes(name),'选角转场接口缺失: '+name);
 const bridge=fs.readFileSync(path.join(root,'tavern-transition.js'),'utf8');assert.equal(bridge.match(/const VERSION = '([^']+)'/)?.[1],release.version,'入口版本与发布清单不同');
 assert(fs.readFileSync(path.join(root,'tavern/index.html'),'utf8').includes('tavern-boot.js?v='+release.version),'直连酒馆缓存版本没有同步');
 const integrity=JSON.parse(fs.readFileSync(path.join(root,'tavern/mesh-integrity.json')));
 for(const [name,item] of Object.entries(integrity)){const b=fs.readFileSync(path.join(root,'tavern',name));assert.equal(b.length,item.size,name);assert.equal(sha(b),item.sha256,name);}
 for(const prefix of ['','tavern/']){const catalog=JSON.parse(fs.readFileSync(path.join(root,prefix,'character-catalog.json')));for(const c of catalog){for(const key of ['hero','dialogue','atlas','atlasData']){
  const name=path.resolve(root,prefix,c[key]);assert(name.startsWith(root+path.sep),'角色路径越界');assert(fs.existsSync(name),`角色资源丢失: ${prefix}${c[key]}`);
 }
 const atlasName=path.relative(root,path.resolve(root,prefix,c.atlas)).replaceAll('\\','/');
 const item=actual[atlasName];assert(item,'图集不在发布清单');
 const equivalent=Object.entries(actual).find(([name,other])=>name.startsWith('tavern/assets/resources/native/')&&name.endsWith('.png')&&other.sha256===item.sha256);
 if(equivalent)assert.equal(atlasName,equivalent[0],'同一图集仍通过两个URL下载，请运行准备流程: '+c.id);
 }}
 const sw=fs.readFileSync(path.join(root,'arrival-sw.js'),'utf8');assert(sw.includes('function mediaRange('),'缺少音频Range缓存修复');
 assert(fs.readFileSync(path.join(root,'tavern/tavern-boot.js'),'utf8').includes('Promise.all([manifestTask, getBytes(full.href)])'),'缺少并行且校验后交付的下载器');
 return {version:release.version,files:Object.keys(actual).length,bytes:Object.values(actual).reduce((n,f)=>n+f.bytes,0),verifiedModels:Object.keys(integrity).length};
}
module.exports={inventory,check,sha};
if(require.main===module){try{console.log(JSON.stringify(check(process.argv[2]||process.cwd()),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
