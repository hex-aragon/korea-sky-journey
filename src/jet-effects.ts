import * as THREE from 'three';
export class JetEffects {
 private flames:THREE.Mesh[]=[];
 private history:THREE.Vector3[][]=[[],[]];
 private trails:THREE.Line[]=[];
 private wing=7.4;private tail=5.3;private engineCount=2;
 private timer=0;private sampleClock=0;private vapor:THREE.Mesh[]=[];
 constructor(private scene:THREE.Scene,private aircraft:THREE.Group){
  for(const side of [-1,1]){
   const vapor=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),new THREE.MeshBasicMaterial({color:'#eefaff',transparent:true,opacity:0,depthWrite:false}));vapor.position.set(side*3.4,.32,1.6);vapor.scale.set(3,.06,2.4);aircraft.add(vapor);this.vapor.push(vapor);
   const flame=new THREE.Mesh(new THREE.ConeGeometry(.58,5,16,1,true),new THREE.MeshBasicMaterial({color:'#75caff',transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
   flame.rotation.x=Math.PI/2;flame.position.set(side*1.2,-.25,10.7);aircraft.add(flame);this.flames.push(flame);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(360*3),3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(360*3),3));geometry.setDrawRange(0,0);
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));line.frustumCulled=false;scene.add(line);this.trails.push(line);
  }
 }
 configure(choice:{engines:number[][];wing:number;tail:number}){this.engineCount=choice.engines.length;this.wing=choice.wing;this.tail=choice.tail;this.flames.forEach((f,i)=>{const p=choice.engines[i];if(p)f.position.set(p[0],p[1],p[2]);});this.vapor.forEach((v,i)=>v.position.x=(i?1:-1)*choice.wing*.46);this.reset();}
 reset(){this.history=[[],[]];for(const t of this.trails)t.geometry.setDrawRange(0,0);}
 update(dt:number,boost:number,speed:number,active:boolean,load=1){
  this.timer+=dt;this.sampleClock+=dt;const sample=this.sampleClock>=1/60;if(sample)this.sampleClock=0;this.vapor.forEach(v=>{v.visible=active;(v.material as THREE.MeshBasicMaterial).opacity=Math.min(.18,Math.max(0,load-2)*.035);});this.aircraft.updateMatrixWorld(true);
  this.flames.forEach((f,i)=>{f.visible=active&&i<this.engineCount;f.scale.setScalar(.55+boost*.9);f.scale.y*=1+Math.sin(this.timer*63)*.07;});
  for(let i=0;i<2;i++){
   const h=this.history[i],p=new THREE.Vector3((i===0?-1:1)*this.wing,.2,this.tail).applyMatrix4(this.aircraft.matrixWorld);
   if(active&&dt>0&&sample){if(h.length&&p.distanceTo(h[h.length-1])>200)this.reset();this.history[i].push(p);if(this.history[i].length>150)this.history[i].shift();}
   const list=this.history[i],g=this.trails[i].geometry,positions=g.attributes.position,colors=g.attributes.color;
   list.forEach((v,j)=>{positions.setXYZ(j,v.x,v.y,v.z);const a=(j/Math.max(1,list.length-1))**1.5*(.16+boost*.35+Math.min(speed/540,1)*.16+Math.min(load-1,5)*.07);colors.setXYZ(j,a*.75,a*.9,a);});g.setDrawRange(0,active?list.length:0);positions.needsUpdate=true;colors.needsUpdate=true;
  }
 }
}
