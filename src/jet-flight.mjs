import { Quaternion, Vector3, Euler, MathUtils } from 'three';
import { damp } from './flight.mjs';
const X=new Vector3(1,0,0), Y=new Vector3(0,1,0), Z=new Vector3(0,0,1);
export function createAttitude(heading=0){return new Quaternion().setFromEuler(new Euler(0,heading,0,'YXZ'));}
export function stepJet(s,input,delta,wind,ground){
 const dt=MathUtils.clamp(delta,0,.05),q=s.attitude;
 s.throttle=MathUtils.clamp(s.throttle+(input.throttle||0)*dt*.45,0,1);
 const boost=Boolean(input.boost);s.boost=damp(s.boost,boost?1:0,5,dt);
 s.speed=damp(s.speed,input.brake?95:boost?540:130+s.throttle*240,boost?1.2:.7,dt);
 if(input.recover){const f=new Vector3(0,0,-1).applyQuaternion(q);s.recovery=createAttitude(Math.atan2(-f.x,-f.z));}
 if(input.pitch||input.turn||input.roll)s.recovery=null;
 if(s.recovery){q.slerp(s.recovery,1-Math.exp(-dt*3));if(q.angleTo(s.recovery)<.01)s.recovery=null;}
 else {
  q.multiply(new Quaternion().setFromAxisAngle(X,(input.pitch||0)*1.2*dt));
  q.multiply(new Quaternion().setFromAxisAngle(Y,-(input.turn||0)*.85*dt));
  q.multiply(new Quaternion().setFromAxisAngle(Z,-(input.roll||0)*2.75*dt));
  if(input.turn&&!input.roll){const right=X.clone().applyQuaternion(q),up=Y.clone().applyQuaternion(q),f=new Vector3(0,0,-1).applyQuaternion(q);if(Math.abs(f.y)<.8){const bank=Math.atan2(right.y,up.y);const error=MathUtils.euclideanModulo(-input.turn*.65-bank+Math.PI,Math.PI*2)-Math.PI;q.multiply(new Quaternion().setFromAxisAngle(Z,error*dt*2));}}
 }
 q.normalize();const f=new Vector3(0,0,-1).applyQuaternion(q),w=wind.direction*Math.PI/180,drift=Math.min(wind.wind/3.6,12);
 const count=Math.max(1,Math.ceil(s.speed*dt/10));s.safety=false;
 for(let n=0;n<count;n++){s.x+= (f.x*s.speed-Math.sin(w)*drift)*dt/count;s.z+=(f.z*s.speed+Math.cos(w)*drift)*dt/count;s.y+=f.y*s.speed*dt/count;const floor=ground(s.x,s.z)+55;if(s.y<floor){s.y=floor;s.recovery=new Quaternion().setFromEuler(new Euler(.3,Math.atan2(-f.x,-f.z),0,'YXZ'));s.safety=true;}if(s.y>6000){s.y=6000;s.recovery=new Quaternion().setFromEuler(new Euler(-.25,Math.atan2(-f.x,-f.z),0,'YXZ'));s.safety=true;}}
 if(Math.abs(s.x)>7200||s.z< -6800||s.z>14500){s.x=MathUtils.clamp(s.x,-7200,7200);s.z=MathUtils.clamp(s.z,-6800,14500);s.recovery=createAttitude(Math.atan2(s.x,s.z-3000));s.safety=true;}
 const e=new Euler().setFromQuaternion(q,'YXZ');s.heading=e.y;s.pitch=e.x;s.bank=e.z;return s;
}
