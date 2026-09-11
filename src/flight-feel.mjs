import {Vector3,MathUtils} from 'three';
/** Visual/audio cues are driven by actual attitude change, not held keys. */
export class FlightFeel {
 previous=null;
 turn=0;roll=0;load=1;gust=0;
 reset(){this.previous=null;this.turn=0;this.roll=0;this.load=1;this.gust=0;}
 update(attitude,speed,altitude,wind,cloud,delta){
  const dt=MathUtils.clamp(delta,0,.05);if(!dt)return this;
  if(!this.previous){this.previous=attitude.clone();return this;}
  const before=new Vector3(0,0,-1).applyQuaternion(this.previous),after=new Vector3(0,0,-1).applyQuaternion(attitude);
  const turn=Math.min(before.angleTo(after)/dt,4);
  const relative=this.previous.clone().invert().multiply(attitude);if(relative.w<0)relative.set(-relative.x,-relative.y,-relative.z,-relative.w);
  const roll=MathUtils.clamp(2*Math.atan2(relative.z,relative.w)/dt,-4,4);
  this.turn=MathUtils.damp(this.turn,turn,6,dt);this.roll=MathUtils.damp(this.roll,roll,6,dt);
  this.load=MathUtils.damp(this.load,1+Math.min(7,speed*turn/70),5,dt);
  const inCloud=MathUtils.smoothstep(altitude,1100,1350)*(1-MathUtils.smoothstep(altitude,2450,2800));
  this.gust=MathUtils.damp(this.gust,Math.min(1,wind/70+inCloud*cloud/180),2,dt);
  this.previous.copy(attitude);return this;
 }
}
