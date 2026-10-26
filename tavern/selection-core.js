// Analytic critically damped springs: rendering depends only on time + input events.
export function springStep(t,omega=18){return t<=0?0:1-(1+omega*t)*Math.exp(-omega*t);}
export class Spring {
 constructor(value=0,omega=18){this.base=value;this.goal=value;this.omega=omega;this.events=[];}
 to(value,time){if(value===this.goal)return;this.events.push({time,delta:value-this.goal});this.goal=value;}
 at(time){return this.base+this.events.reduce((sum,e)=>sum+e.delta*springStep(time-e.time,this.omega),0);}
}
export function chooseGreeting(previous,first,pool,random=Math.random){
 if(!previous)return first;
 if(random()<.25)return previous;
 const choices=pool.filter(text=>text!==previous);
 return choices.length?choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]:first;
}
export function readSaved(storage,key,fallback=null){try{return JSON.parse(storage.getItem(key)||'null')??fallback;}catch{return fallback;}}
export function saveValue(storage,key,value){try{storage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
