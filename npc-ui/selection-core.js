// Analytic critically damped springs: rendering depends only on time + input events.
export function springStep(t,omega=18){return t<=0?0:1-(1+omega*t)*Math.exp(-omega*t);}
export class Spring {
 constructor(value=0,omega=18){this.base=value;this.goal=value;this.omega=omega;this.speed=0;this.time=0;}
 sample(time){const dt=Math.max(0,time-this.time),d=this.base-this.goal,b=this.speed+this.omega*d,e=Math.exp(-this.omega*dt);return {value:this.goal+(d+b*dt)*e,velocity:(this.speed-this.omega*b*dt)*e};}
 to(value,time){if(value===this.goal)return;const s=this.sample(time);this.base=s.value;this.speed=s.velocity;this.time=time;this.goal=value;}
 at(time){return this.sample(time).value;}
 release(value,velocity,time,goal=0){this.base=value;this.speed=velocity;this.time=time;this.goal=goal;}
}
export function chooseGreeting(previous,first,pool,random=Math.random){
 if(!previous)return first;
 if(random()<.25)return previous;
 const choices=pool.filter(text=>text!==previous);
 return choices.length?choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]:first;
}
export function readSaved(storage,key,fallback=null){try{return JSON.parse(storage.getItem(key)||'null')??fallback;}catch{return fallback;}}
export function saveValue(storage,key,value){try{storage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
