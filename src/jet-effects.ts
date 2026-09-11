import * as THREE from 'three';
export class JetEffects {
 private flames:THREE.Mesh[]=[];
 private history:THREE.Vector3[][]=[[],[]];
 private trails:THREE.Line[]=[];
 private timer=0;
 constructor(private scene:THREE.Scene,private aircraft:THREE.Group){
  for(const side of [-1,1]){
   const flame=new THREE.Mesh(new THREE.ConeGeometry(.58,5,16,1,true),new THREE.MeshBasicMaterial({color:'#75caff',transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
   flame.rotation.x=Math.PI/2;flame.position.set(side*1.2,-.25,10.7);aircraft.add(flame);this.flames.push(flame);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(360*3),3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(360*3),3));geometry.setDrawRange(0,0);
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));line.frustumCulled=false;scene.add(line);this.trails.push(line);
  }
 }
 reset(){this.history=[[],[]];for(const t of this.trails)t.geometry.setDrawRange(0,0);}
 update(dt:number,boost:number,speed:number,active:boolean){
  this.timer+=dt;this.aircraft.updateMatrixWorld(true);
  this.flames.forEach((f)=>{f.visible=active;f.scale.setScalar(.55+boost*.9);f.scale.y*=1+Math.sin(this.timer*63)*.07;});
  for(let i=0;i<2;i++){
   const h=this.history[i],p=new THREE.Vector3((i===0?-1:1)*7.4,.2,5.3).applyMatrix4(this.aircraft.matrixWorld);
   if(active&&dt>0){if(h.length&&p.distanceTo(h[h.length-1])>200)this.reset();this.history[i].push(p);if(this.history[i].length>100)this.history[i].shift();}
   const list=this.history[i],g=this.trails[i].geometry,positions=g.attributes.position,colors=g.attributes.color;
   list.forEach((v,j)=>{positions.setXYZ(j,v.x,v.y,v.z);const a=(j/Math.max(1,list.length-1))**1.5*(.16+boost*.35+Math.min(speed/540,1)*.16);colors.setXYZ(j,a*.75,a*.9,a);});g.setDrawRange(0,active?list.length:0);positions.needsUpdate=true;colors.needsUpdate=true;
  }
 }
}
