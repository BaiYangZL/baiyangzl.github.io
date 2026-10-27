// Local audition controller; only the 4213 server maps this over arrival-audio.js.
const UI_OPTIONS=Array.from({length:10},(_,i)=>String(i+1).padStart(2,'0')),BUTTON_OPTIONS=[...Array.from({length:16},(_,i)=>String(i+1).padStart(2,'0')),'a','b','c','d'];
export function createArrivalAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return {started:true,setStage(){},setPaused(){},status:()=>({unsupported:true})};
 const context=new AC(),master=context.createGain(),musicGain=context.createGain(),rainGain=context.createGain(),fireflyGain=context.createGain(),bellGain=context.createGain();
 master.gain.value=.8;master.connect(context.destination);musicGain.connect(master);rainGain.connect(master);fireflyGain.connect(master);bellGain.connect(master);fireflyGain.gain.value=0;musicGain.gain.value=rainGain.gain.value=0;
 const music=new Audio('/assets/arrival-loading.mp3');music.loop=true;music.preload='auto';music.setAttribute('playsinline','');context.createMediaElementSource(music).connect(musicGain);
 const params=new URLSearchParams(location.search),buffers={},events=[],failures=[],shots=new Map();
 const levels={loading:80,gate:20,rain:33,clear:29,bell:71,fireflies:38};let confirmed=false;
 let ui=UI_OPTIONS.includes(params.get('ui'))?params.get('ui'):'05',button=BUTTON_OPTIONS.includes(params.get('button'))?params.get('button'):'04',auto=params.get('auto')!=='0';
 let fireflySource,fireflyLoading=false,lastFirefly=-1,envelopePlayed=false;
 let started=false,paused=false,completed=false,disposed=false,stage='map',phase='',letterState='',uiSeen=false,mailPlayed=false,lastAuto=0,dialogDue=0,letterDue=0,dialogVisible=false,frame,rainSource,rainLoading=false,lastMusic=-1,lastRain=-1;
 function emit(type,extra={}){const d={type,at:Math.round(performance.now()),...extra};if(type==='sound')events.push(d);parent.postMessage({channel:'belvedere-sound-study',...d},location.origin);}
 function ramp(p,v,s=.5){const t=context.currentTime;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.linearRampToValueAtTime(v,t+s);}
 function available(){return started&&!paused&&!disposed&&!document.hidden;}
 async function load(id,url){try{const r=await fetch(url);if(!r.ok)throw Error(r.status);buffers[id]=await context.decodeAudioData(await r.arrayBuffer());}catch(e){failures.push({id,message:String(e)});emit('error',{message:'声音读取失败：'+id});}}
 const ready=Promise.all([load('mail','/assets/gate-study-mail.mp3'),load('envelope','/assets/gate-study-envelope.mp3'),load('bell','/assets/gate-study-bell_01.wav'),...UI_OPTIONS.map(x=>load('transition-'+x,'/assets/gate-study-transition-'+x+'.wav')),...BUTTON_OPTIONS.map(x=>load('button-'+x,'/assets/gate-study-button-'+x+'.wav'))]).then(()=>emit('audio-ready'));
 function makeLoop(b,gain){const overlap=Math.round(b.sampleRate*.25),length=b.length-overlap,loop=context.createBuffer(b.numberOfChannels,length,b.sampleRate);let sum=0,peak=0;for(let c=0;c<b.numberOfChannels;c++){const input=b.getChannelData(c),out=loop.getChannelData(c);out.set(input.subarray(overlap));for(let i=0;i<overlap;i++){const t=i/(overlap-1);out[length-overlap+i]=out[length-overlap+i]*(1-t)+input[i]*t;}for(const v of out){sum+=v*v;peak=Math.max(peak,Math.abs(v));}}const scale=Math.min(.12/Math.max(1e-9,Math.sqrt(sum/(length*b.numberOfChannels))),.7/Math.max(1e-9,peak));for(let c=0;c<loop.numberOfChannels;c++){const out=loop.getChannelData(c);for(let i=0;i<out.length;i++)out[i]*=scale;}const source=context.createBufferSource();source.buffer=loop;source.loop=true;source.connect(gain);source.start();return source;}
 function apply(){
  const active=available()&&!confirmed;
  const foreground=Array.from(shots.values()).some(name=>name==='mail'||name==='envelope');
  const m=active?(stage==='map'?levels.loading:levels.gate)*.003*(foreground?.25:1):0,r=active&&stage!=='map'&&!uiSeen?(window.__arrival?.weather==='rain'?levels.rain:levels.clear)*.001:0;
  if(m!==lastMusic){ramp(musicGain.gain,m,foreground?.08:.7);lastMusic=m;}
  if(r!==lastRain){ramp(rainGain.gain,r,.7);lastRain=r;}
  if(r>0&&!rainLoading){rainLoading=true;load('ambience',window.__arrival?.weather==='rain'?'/assets/arrival-rain.mp3':'/assets/gate-study-wind_01.wav').then(()=>{if(!disposed&&buffers.ambience)rainSource=makeLoop(buffers.ambience,rainGain);});}
  const f=active&&stage!=='map'&&!uiSeen?levels.fireflies*.001:0;if(f!==lastFirefly){ramp(fireflyGain.gain,f,.7);lastFirefly=f;}
  bellGain.gain.setTargetAtTime(levels.bell*.01,context.currentTime,.04);
  if(f>0&&!fireflyLoading){fireflyLoading=true;load('fireflies','/assets/arrival-insects.mp3').then(()=>{if(!disposed&&buffers.fireflies)fireflySource=makeLoop(buffers.fireflies,fireflyGain);});}

 }
 function stopSound(name){for(const [s,n] of shots)if(!name||n===name){try{s.stop();}catch{}shots.delete(s);}}
 function play(name,gain=.65,manual=false){
  if(disposed||paused||document.hidden||context.state!=='running'||(!manual&&!available())||!buffers[name])return false;
  // One voice per cue, so repeated testing cannot pile up a long bell tail.
  stopSound(name);const s=context.createBufferSource(),g=context.createGain();s.buffer=buffers[name];g.gain.value=gain;s.connect(g);g.connect(name==='bell'?bellGain:master);shots.set(s,name);s.onended=()=>{shots.delete(s);s.disconnect();g.disconnect();if(!disposed)apply();};s.start();if(name==='mail'||name==='envelope')apply();emit('sound',{name,gain,stage});return true;
 }
 function uiSound(manual=false){play('transition-'+ui,.65,manual);}
 const overlay=document.createElement('div');overlay.id='sound-study-start';overlay.style.cssText='position:fixed;inset:0;z-index:25000;display:grid;place-content:center;gap:12px;text-align:center;background:#100e18a8;color:white;font:16px/1.6 system-ui';
 overlay.innerHTML='<strong style="font-size:23px">加载 → 递信 → 人物 UI</strong><span>加载只有音乐 · 城门加入轻环境声 · 选完人物后转入酒馆</span><button style="padding:13px 30px;border:0;border-radius:24px;background:#f6efe4;color:#342a27;font:inherit;cursor:pointer">开始试听</button>';document.body.append(overlay);
 async function start(){if(disposed)return;paused=false;const a=context.resume(),b=music.play();await Promise.allSettled([a,b]);await ready;started=true;overlay.remove();apply();emit('started');}
 overlay.querySelector('button').onclick=start;
 function reset(from='map'){const q=new URLSearchParams({ui,button,auto:auto?'1':'0',from,weather:params.get('weather')||'rain',seed:'20261026'});location.href='/stage.html?'+q;}
 function finish(){if(completed)return;completed=true;apply();emit('complete',{message:'已到人物 UI：环境声停止，音乐保持城门音量。选好人物并填写名字后，确认进入酒馆。'});}
 function tick(now){
  if(disposed)return;frame=requestAnimationFrame(tick);if(!available())return;
  const api=window.__arrival;if(!api)return;apply();
  if(api.story.phase!==phase){phase=api.story.phase;if(phase==='offer'&&!mailPlayed){mailPlayed=true;play('mail',.9);}if(phase==='deny')play('bell',1);}
  const letter=api.invitation.state;if(letter!==letterState){letterState=letter;if(letter==='open')letterDue=now+1900;}
  if(!envelopePlayed&&document.getElementById('letter')?.classList.contains('unseal')){envelopePlayed=true;play('envelope',.9);}
  const panel=document.querySelector('.cs-root');
  if(panel&&!uiSeen){uiSeen=true;stopSound('bell');uiSound();apply();emit('ui-open',{ui});finish();}
  if(uiSeen||!auto)return;
  const visible=!api.dialog.el.hidden;if(visible&&!dialogVisible)dialogDue=now+1600;dialogVisible=visible;
  if(now-lastAuto<500)return;
  if(visible&&now>dialogDue){
   if(api.dialog.typing){api.dialog.finish();dialogDue=now+1300;return;}
   const take=document.querySelector('#dialog-choices button');if(take&&!take.disabled){take.click();lastAuto=now;return;}
   if(!api.dialog.choices.childElementCount&&api.dialog.resolve){document.getElementById('dialog-box').click();lastAuto=now;dialogDue=now+1600;}
  }
  if(!document.getElementById('letter').hidden&&letter==='open'&&now>letterDue){const input=document.getElementById('passcode');input.value='DEMO';document.getElementById('letter-submit').click();lastAuto=now;letterDue=Infinity;}
 }
 window.addEventListener('click',e=>{const el=e.target.closest?.('.cs-root button');if(!el)return;if(!el.disabled)play('button-'+button,.55);},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSound();music.pause();context.suspend().catch(()=>{});}else if(started&&!paused){context.resume().then(()=>{if(!confirmed)music.play().catch(()=>{});});}apply();});
 function message(e){if(e.origin!==location.origin||e.source!==parent||e.data?.channel!=='belvedere-sound-control')return;const d=e.data;
  if(d.action==='ui'&&UI_OPTIONS.includes(d.value))ui=d.value;
  if(d.action==='button'&&BUTTON_OPTIONS.includes(d.value))button=d.value;
  if(d.action==='ui-preview')context.resume().then(()=>uiSound(true));
  if(d.action==='button-preview')context.resume().then(()=>play('button-'+button,.55,true));
  if(d.action==='bell-preview')context.resume().then(()=>play('bell',1,true));
  if(d.action==='auto'){auto=!!d.value;dialogDue=performance.now()+500;letterDue=performance.now()+500;}
  if(d.action==='levels'){for(const k of Object.keys(levels))if(Number.isFinite(d.value?.[k]))levels[k]=Math.max(0,Math.min(100,d.value[k]));apply();}
  if(d.action==='volume')master.gain.value=Math.max(0,Math.min(1,Number(d.value)||0));
  if(d.action==='replay')reset(d.from||'map');
  if(d.action==='pause')controller.setPaused(!!d.value);
 }
 window.addEventListener('message',message);
 const controller={get started(){return started;},ready,start,reset,play,finish,
 selectionConfirmed(){confirmed=true;apply();setTimeout(()=>{if(confirmed)music.pause();},750);},selectionFailed(){confirmed=false;music.play().catch(()=>{});apply();},
 setStage(next){stage=next==='map'?'map':'road';apply();},
 setPaused(value){paused=value;if(value){stopSound();music.pause();context.suspend().catch(()=>{});}else{context.resume().then(()=>{if(!confirmed)music.play().catch(()=>{});});}apply();},
 status:()=>({started,paused,completed,confirmed,levels:{...levels},stage,ui,button,auto,weather:window.__arrival?.weather,context:context.state,ready:Object.keys(buffers),durations:Object.fromEntries(Object.entries(buffers).map(([k,v])=>[k,v.duration])),events:[...events],failures:[...failures],musicGain:musicGain.gain.value,rainGain:rainGain.gain.value,fireflyGain:fireflyGain.gain.value,bellGain:bellGain.gain.value})};
 window.__gateSoundStudy=controller;frame=requestAnimationFrame(tick);
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);stopSound();music.pause();rainSource?.stop();fireflySource?.stop();context.close().catch(()=>{});},{once:true});
 if(params.get('from')==='gate'){const interval=setInterval(()=>{const a=window.__arrival;if(a?.state.ready){while(a.state.phase!=='arrived')a.state.tick(1/60);clearInterval(interval);}},100);}
 emit('study-ready',{ui,button,auto});return controller;
}

