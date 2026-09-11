import * as THREE from 'three';
/** Lightweight actual 3D cockpit, attached to the camera; no image overlay. */
export class Cockpit {
 readonly group=new THREE.Group();
 private canvas=document.createElement('canvas');
 private texture:THREE.CanvasTexture;
 private timer=.2;
 constructor(camera:THREE.PerspectiveCamera){
  const graphite=new THREE.MeshStandardMaterial({color:'#17242d',roughness:.66,metalness:.35});
  const rim=new THREE.MeshStandardMaterial({color:'#364854',roughness:.34,metalness:.7});
  const addBox=(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);this.group.add(mesh);return mesh;};
  addBox(0,-1.55,-3.45,4.7,.72,.75,graphite);
  for(const side of [-1,1]){
   const rail=addBox(side*2,-1.02,-2.8,.18,.24,5,graphite);rail.rotation.z=-side*.1;
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*2,-1.45,-3.0),new THREE.Vector3(side*1.95,.3,-3.4),new THREE.Vector3(side*1.35,1.4,-3.8),new THREE.Vector3(0,1.85,-4)]);
   this.group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.045,6,false),rim));
  }
  this.canvas.width=768;this.canvas.height=256;this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.88),new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false}));screen.position.set(0,-1.43,-3.06);this.group.add(screen);
  const hud=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.62),new THREE.MeshBasicMaterial({color:'#8ce9d1',transparent:true,opacity:.045,side:THREE.DoubleSide,depthWrite:false}));hud.position.set(0,-.52,-3);this.group.add(hud);
  const reticle=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.13,0,-3),new THREE.Vector3(-.035,0,-3),new THREE.Vector3(.035,0,-3),new THREE.Vector3(.13,0,-3),new THREE.Vector3(0,-.05,-3),new THREE.Vector3(0,.05,-3)]);
  this.group.add(new THREE.LineSegments(reticle,new THREE.LineBasicMaterial({color:'#9deacf',transparent:true,opacity:.65})));
  camera.add(this.group);this.group.visible=false;
 }
 update(dt:number,speed:number,altitude:number,heading:number,boost:number){
  if(!this.group.visible)return;this.timer+=dt;if(this.timer<.12)return;this.timer=0;
  const ctx=this.canvas.getContext('2d')!;ctx.fillStyle='#0b171c';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#31564e';ctx.lineWidth=2;ctx.strokeRect(12,12,220,225);ctx.strokeRect(270,12,220,225);ctx.strokeRect(528,12,220,225);
  ctx.textAlign='center';ctx.fillStyle='#72b6a0';ctx.font='20px monospace';ctx.fillText('AIRSPEED',122,57);ctx.fillText('ALTITUDE',380,57);ctx.fillText('HEADING',638,57);
  ctx.fillStyle='#b5e1cb';ctx.font='43px monospace';ctx.fillText(String(Math.round(speed*3.6)),122,135);ctx.fillText(String(Math.round(altitude)),380,135);ctx.fillText(String(Math.round(THREE.MathUtils.euclideanModulo(-heading*180/Math.PI,360))).padStart(3,'0'),638,135);
  ctx.fillStyle=boost>.5?'#f8c982':'#568273';ctx.font='17px monospace';ctx.fillText('KM/H',122,182);ctx.fillText('METRES',380,182);ctx.fillText(boost>.5?'AFTERBURNER':'KESTREL K-01',638,182);this.texture.needsUpdate=true;
 }
}
