// Local audition controller; only the 4213 server maps this over arrival-audio.js.
// Selected sounds from the approved 4213 mix. Other candidates stay in the review page.
export function createArrivalAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return {started:true,setStage(){},setPaused(){},status:()=>({unsupported:true})};
 const context=new AC(),master=context.createGain(),musicGain=context.createGain(),rainGain=context.createGain(),fireflyGain=context.createGain(),bellGain=context.createGain();
 let muted=false;try{muted=localStorage.getItem('belvedere-arrival-muted')==='1';}catch{}master.gain.value=muted?0:.8;master.connect(context.destination);musicGain.connect(master);rainGain.connect(master);fireflyGain.connect(master);bellGain.connect(master);fireflyGain.gain.value=0;musicGain.gain.value=rainGain.gain.value=0;
 const music=new Audio('/assets/arrival-loading.mp3');music.loop=true;music.preload='auto';music.setAttribute('playsinline','');context.createMediaElementSource(music).connect(musicGain);
 const params=new URLSearchParams(location.search),buffers={},events=[],failures=[],shots=new Map();
 const levels={loading:80,gate:20,rain:33,clear:29,bell:71,fireflies:38};let confirmed=false;
 let ui='05',button='04',auto=false;
 let fireflySource,fireflyLoading=false,lastFirefly=-1,envelopePlayed=false;
 let started=false,paused=false,completed=false,disposed=false,stage='map',phase='',letterState='',uiSeen=false,mailPlayed=false,lastAuto=0,dialogDue=0,letterDue=0,dialogVisible=false,frame,rainSource,rainLoading=false,lastMusic=-1,lastRain=-1;
 function emit(type,extra={}){const d={type,at:Math.round(performance.now()),...extra};if(type==='sound')events.push(d);parent.postMessage({channel:'belvedere-sound-study',...d},location.origin);}
 function ramp(p,v,s=.5){const t=context.currentTime;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.linearRampToValueAtTime(v,t+s);}
 function available(){return started&&!paused&&!muted&&!disposed&&!document.hidden;}
 async function load(id,url){try{const r=await fetch(url);if(!r.ok)throw Error(r.status);buffers[id]=await context.decodeAudioData(await r.arrayBuffer());}catch(e){failures.push({id,message:String(e)});emit('error',{message:'声音读取失败：'+id});}}
 const ready=Promise.all([load('mail','/assets/gate-study-mail.mp3'),load('envelope','/assets/gate-study-envelope.mp3'),load('bell','/assets/gate-study-bell_01.wav'),load('transition-05','/assets/gate-study-transition-05.wav'),load('button-04','/assets/gate-study-button-04.wav')]).then(()=>emit('audio-ready'));
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
 const soundButton=document.createElement('button');soundButton.id='arrival-sound';document.querySelector('footer')?.append(soundButton);
 function label(){soundButton.textContent=muted?'声音：关':context.state==='running'?'声音：开':'点击开启声音';soundButton.setAttribute('aria-pressed',String(!muted&&context.state==='running'));}
 function start(){if(disposed||started||muted)return;started=true;void context.resume().then(()=>{if(!disposed){void music.play().catch(()=>{});apply();label();}});void music.play().catch(()=>{});apply();label();emit('started');}
 const unlock=e=>{if(e.target!==soundButton)start();};for(const type of ['pointerdown','touchend','keydown'])document.addEventListener(type,unlock,{capture:true,passive:true});document.addEventListener('WeixinJSBridgeReady',start);soundButton.onclick=e=>{e.stopPropagation();muted=context.state!=='running'&&!muted?false:!muted;try{localStorage.setItem('belvedere-arrival-muted',muted?'1':'0');}catch{}master.gain.setTargetAtTime(muted?0:.8,context.currentTime,.04);if(!muted){if(started){void context.resume().then(()=>{if(!confirmed)void music.play().catch(()=>{});apply();});}else start();}else{music.pause();stopSound();apply();}label();};label();
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
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSound();music.pause();context.suspend().catch(()=>{});}else if(started&&!paused&&!muted){context.resume().then(()=>{if(!confirmed)music.play().catch(()=>{});});}apply();});
 function message(e){if(e.origin!==location.origin||e.source!==parent||e.data?.channel!=='belvedere-sound-control')return;const d=e.data;
  // Review controls are only active in the separate sound review page.

  if(d.action==='ui-preview')context.resume().then(()=>uiSound(true));
  if(d.action==='button-preview')context.resume().then(()=>play('button-'+button,.55,true));
  if(d.action==='bell-preview')context.resume().then(()=>play('bell',1,true));
  if(d.action==='auto'){auto=!!d.value;dialogDue=performance.now()+500;letterDue=performance.now()+500;}

  if(d.action==='volume')master.gain.value=Math.max(0,Math.min(1,Number(d.value)||0));
  if(d.action==='replay')reset(d.from||'map');
  if(d.action==='pause')controller.setPaused(!!d.value);
 }
 window.addEventListener('message',message);
 const controller={get started(){return started;},ready,start,reset,play,finish,
 selectionConfirmed(){confirmed=true;apply();setTimeout(()=>{if(confirmed)music.pause();},750);},selectionFailed(){confirmed=false;music.play().catch(()=>{});apply();},
 setStage(next){stage=next==='map'?'map':'road';apply();},
 setPaused(value){paused=value;if(value){stopSound();music.pause();context.suspend().catch(()=>{});}else{context.resume().then(()=>{if(!confirmed)music.play().catch(()=>{});});}apply();},
 status:()=>({started,paused,muted,completed,confirmed,levels:{...levels},stage,ui,button,auto,weather:window.__arrival?.weather,context:context.state,ready:Object.keys(buffers),durations:Object.fromEntries(Object.entries(buffers).map(([k,v])=>[k,v.duration])),events:[...events],failures:[...failures],masterGain:master.gain.value,musicGain:musicGain.gain.value,rainGain:rainGain.gain.value,fireflyGain:fireflyGain.gain.value,bellGain:bellGain.gain.value})};
 window.__gateSoundStudy=controller;frame=requestAnimationFrame(tick);
 const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);stopSound();music.pause();rainSource?.stop();fireflySource?.stop();for(const type of ['pointerdown','touchend','keydown'])document.removeEventListener(type,unlock,true);document.removeEventListener('WeixinJSBridgeReady',start);soundButton.remove();context.close().catch(()=>{});};window.addEventListener('pagehide',cleanup,{once:true});window.addEventListener('belvedere:tavern-enter',cleanup,{once:true});
 if(params.get('from')==='gate'){const interval=setInterval(()=>{const a=window.__arrival;if(a?.state.ready){while(a.state.phase!=='arrived')a.state.tick(1/60);clearInterval(interval);}},100);}
 emit('study-ready',{ui,button,auto});return controller;
}
