export function damp(current,target,smoothing,dt){return current+(target-current)*(1-Math.exp(-smoothing*dt));}
export function stepFlight(state,input,dt,wind,ground){
 dt=Math.max(0,Math.min(.05,dt));
 state.bank=damp(state.bank,-input.turn*.45,3,dt);state.heading-=input.turn*.55*dt;
 state.pitch=damp(state.pitch,input.climb*.2,2,dt);state.speed=damp(state.speed,input.fast?200:85,1,dt);
 const r=wind.direction*Math.PI/180;const strength=Math.min(wind.wind/3.6,12);
 state.x+=(-Math.sin(state.heading)*state.speed-Math.sin(r)*strength)*dt;
 state.z+=(-Math.cos(state.heading)*state.speed+Math.cos(r)*strength)*dt;
 const min=ground(state.x,state.z)+55;
 state.y=Math.max(min,Math.min(3200,state.y+input.climb*160*dt));
 state.x=Math.max(-7200,Math.min(7200,state.x));state.z=Math.max(-6800,Math.min(14500,state.z));return state;
}
