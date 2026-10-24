// Local test UI only. Results stay in this browser until the user copies them.
(()=>{
 const result={network:'局域网；不代表公网下载速度',viewport:[innerWidth,innerHeight,devicePixelRatio],wechat:/MicroMessenger/.test(navigator.userAgent),secureCache:window.isSecureContext};
 try{const old=JSON.parse(localStorage.getItem('belvedere-phone-measure')||'null');if(old)result.previousSession={currentRoom:old.currentRoom,position:old.position,transitionPhase:old.transitionPhase,transitionError:old.transitionError,contextLost:old.contextLost,contextEvents:old.contextEvents,errors:old.errors,lastRecordedMs:old.lastRecordedMs};}catch{}
 result.version='room-memory-stick-20261024';result.errors=[];
 let hooked=false,lastSave=0,lastPhase='',engine;
 let child,button,started=false,done=false,frames=[],previous=0,longTasks=[];
 const save=()=>{try{localStorage.setItem('belvedere-phone-measure',JSON.stringify(result));}catch{}};
 const report=()=>{
  let panel=document.getElementById('phone-result');if(panel){panel.remove();return;}
  panel=document.createElement('div');panel.id='phone-result';panel.style.cssText='position:fixed;inset:12% 5%;z-index:30001;background:#eee0c3;color:#312419;border:2px solid #b58d4b;border-radius:12px;padding:18px;font:16px/1.6 system-ui;overflow:auto';
  const title=document.createElement('h3');title.textContent='手机实测结果（可复制发回）';
  const text=document.createElement('textarea');text.readOnly=true;text.style.cssText='width:100%;height:65%;font:15px/1.6 monospace';text.value=JSON.stringify(result,null,2);
  const copy=document.createElement('button');copy.textContent='选中并复制';copy.onclick=()=>{text.focus();text.select();try{document.execCommand('copy');copy.textContent='已复制；也可长按文字复制';}catch{}};
  const close=document.createElement('button');close.textContent='关闭，继续走动';close.onclick=()=>panel.remove();panel.append(title,text,copy,close);document.body.append(panel);
 };
 function frame(t){if(done)return;if(previous)frames.push(t-previous);previous=t;child.requestAnimationFrame(frame);}
 const poll=setInterval(()=>{
  if(!button){button=document.createElement('button');button.style.cssText='position:fixed;top:3px;left:50%;transform:translateX(-50%);z-index:30000;font:12px system-ui;padding:6px 12px;background:#332716;color:#ffe6bb;border:1px solid #ab8952;border-radius:7px;white-space:nowrap';button.onclick=report;document.body.append(button);}
  const entry=window.__tavernEntry?.status(),journey=window.__arrival?.state;
  if(entry?.ready&&!result.readyMs){result.readyMs=Math.round(performance.now());child=document.querySelector('iframe[title="贝尔维德酒馆二楼"]').contentWindow;const s=child.__tavern.state();result.initialRoom=s.floor;result.resumed=s.restoredPosition;result.loadTimings=s.loadTimings;result.frameStartedMs=Math.round(child.performance.timeOrigin-performance.timeOrigin);result.gateBuildMs=window.__arrival?.scene?.buildMs;result.returning=entry.returning;save();}
  if(journey&&journey.phase!=='map'&&!result.mapMs){result.mapMs=Math.round(performance.now());save();}
  if(entry?.entered&&!started){started=true;result.enteredMs=Math.round(performance.now());child=document.querySelector('iframe[title="贝尔维德酒馆二楼"]').contentWindow;child.requestAnimationFrame(frame);try{new child.PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>Math.round(e.duration)))).observe({type:'longtask'});}catch{}setTimeout(()=>{done=true;const f=frames.sort((a,b)=>a-b);result.walk20Seconds={samples:f.length,frameP95Ms:f[Math.floor(f.length*.95)],longFramesOver50ms:f.filter(t=>t>50).length,longTasksMs:longTasks};save();},20000);}
  if(child?.__tavern){
   if(!hooked){hooked=true;child.System.import('cc').then(cc=>engine=cc).catch(()=>{});child.addEventListener('error',event=>{result.errors.push(String(event.message));result.errors=result.errors.slice(-10);save();});child.addEventListener('unhandledrejection',event=>{result.errors.push(String(event.reason));result.errors=result.errors.slice(-10);save();});}
   const s=child.__tavern.state();result.currentRoom=s.floor;result.position=[s.x,s.z];result.roomTransitions=s.travelTimes;result.background=s.background;result.transitionPhase=s.transitionPhase;result.transitionError=s.transitionError;result.contextLost=s.contextLost;result.contextEvents=s.contextEvents;result.modelCount=s.modelCount;result.gateReleased=!!window.__gateReleased;
   if(s.transitionPhase!==lastPhase||performance.now()-lastSave>1000){lastPhase=s.transitionPhase;lastSave=performance.now();result.lastRecordedMs=Math.round(lastSave);result.graphicsMemory=engine?.director.root?{...engine.director.root.device.memoryStatus}:undefined;result.jsHeap=child.performance.memory?.usedJSHeapSize;save();}
  }
  button.textContent=done?'测试已记录 · 点这里复制':started?'请走动20秒 · 正在记录':result.readyMs?'大厅准备 '+(result.readyMs/1000).toFixed(2)+'秒 · 点击看结果':'手机实测 · 正在记录加载';
 },80);
 window.addEventListener('pagehide',save);
})();
