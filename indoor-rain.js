// Indoor weather is local to windows, except a faint rain bed in guest bedrooms.
export function indoorRain({room,x,z,raining,night=false,windows=[],blocked=false}){
 const mix={rain_inside:0,rain_window:0,rain_out:0,rain_roof:0};
 if(!raining||!night||blocked)return mix;
 let near=0,opened=0;
 for(const w of windows){const d=Math.hypot(x-w.x,z-w.z),t=Math.max(0,Math.min(1,(2.2-d)/1.8)),amount=t*t*(3-2*t);near=Math.max(near,amount);if(w.on)opened=Math.max(opened,amount);}
 const anyOpen=windows.some(w=>w.on||w.canClose===false);
 const lodging=/^room-20[1-9]$|^room-210$|^room-(bar|lady|story)$/.test(room);
 mix.rain_inside=(lodging&&windows.length?(anyOpen?.035:.009):0)+near*.10*(1-opened*.7);
 mix.rain_window=0;
 mix.rain_out=(lodging&&anyOpen?.018:0)+opened*.10;
 return mix;
}
