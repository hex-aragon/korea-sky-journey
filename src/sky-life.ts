import * as THREE from 'three';
import { randomFor } from './race.mjs';
export class SkyLife{
 group=new THREE.Group();birds:THREE.Group[]=[];balloons:THREE.Group[]=[];time=0;
 constructor(scene:THREE.Scene){
  scene.add(this.group);const bodyMaterial=new THREE.MeshStandardMaterial({color:0xd4dce0,roughness:.8,side:THREE.DoubleSide});
  const wing=new THREE.BufferGeometry();wing.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,8,0,2,5,0,-1],3));wing.computeVertexNormals();
  for(let i=0;i<36;i++){const bird=new THREE.Group();for(const side of [-1,1]){const mesh=new THREE.Mesh(wing,bodyMaterial);mesh.scale.x=side;bird.add(mesh);}this.birds.push(bird);this.group.add(bird);}
  const envelope=new THREE.SphereGeometry(1,24,16).toNonIndexed(),colors=[];const p=envelope.getAttribute('position');
  for(let i=0;i<p.count;i++){const y=p.getY(i),taper=y<0?1+y*.4:1;p.setXYZ(i,p.getX(i)*taper,y,p.getZ(i)*taper);}envelope.computeVertexNormals();
  for(let i=0;i<p.count;i+=3){const x=p.getX(i)+p.getX(i+1)+p.getX(i+2),z=p.getZ(i)+p.getZ(i+1)+p.getZ(i+2);const stripe=Math.floor((Math.atan2(z,x)+Math.PI)*6/Math.PI);const c=new THREE.Color(stripe%2?0xf4d7a1:0xc75c42);for(let j=0;j<3;j++)colors.push(c.r,c.g,c.b);}envelope.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const fabric=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),basketMat=new THREE.MeshStandardMaterial({color:0x755037,roughness:1});
  const ropeMat=new THREE.MeshStandardMaterial({color:0xcbbca6});
  for(let i=0;i<7;i++){const balloon=new THREE.Group(),skin=new THREE.Mesh(envelope,fabric);skin.scale.set(43,57,43);balloon.add(skin);const basket=new THREE.Mesh(new THREE.BoxGeometry(13,10,11),basketMat);basket.position.y=-69;balloon.add(basket);
   for(const side of [-1,1]){const rope=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,24,4),ropeMat);rope.position.set(side*7,-57,0);balloon.add(rope);}this.balloons.push(balloon);this.group.add(balloon);}
 }
 reseed(seed:number,position:THREE.Vector3,ground:(x:number,z:number)=>number){const random=randomFor(seed);const flocks=Array.from({length:4},()=>({angle:random()*Math.PI*2,distance:500+random()*1900,height:(random()-.5)*650}));this.group.children.forEach((o,i)=>{const flock=flocks[Math.floor(i/9)%4],bird=i<this.birds.length;const angle=bird?flock.angle+(i%9-4)*.025:random()*Math.PI*2,distance=bird?flock.distance+Math.abs(i%9-4)*18:400+random()*2400;o.position.set(position.x+Math.cos(angle)*distance,0,position.z+Math.sin(angle)*distance);o.position.y=Math.max(ground(o.position.x,o.position.z)+250,position.y+(bird?flock.height+Math.sin(i)*12:(random()-.5)*900));o.userData.phase=random()*6.28;o.userData.bird=i<this.birds.length;});}
 update(dt:number,position:THREE.Vector3,wind:number,ground:(x:number,z:number)=>number){this.time+=dt;
  this.group.children.forEach((o,i)=>{const bird=o.userData.bird,phase=o.userData.phase||0;o.position.x+=dt*(bird?19:wind*.18);o.position.z+=dt*(bird?Math.sin(phase)*12:wind*.1);
   if(bird){o.children.forEach((wing,j)=>wing.rotation.z=Math.sin(this.time*5+phase)*.32*(j===0?-1:1));o.rotation.y=phase;}
   else{o.rotation.z=Math.sin(this.time*.3+phase)*.025;}
   if(Math.hypot(o.position.x-position.x,o.position.z-position.z)>3300){const a=phase+this.time*.025;o.position.x=position.x+Math.cos(a)*2900;o.position.z=position.z+Math.sin(a)*2900;o.position.y=Math.max(ground(o.position.x,o.position.z)+250,position.y+Math.sin(i)*500);}
  });
 }
}
