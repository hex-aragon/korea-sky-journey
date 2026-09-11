import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { positions,geo } from './data';
import { terrainHeight } from './terrain';
/** Hand-authored, compressed sightseeing infrastructure, not surveyed geometry. */
export function createScenery(scene:THREE.Scene,obstacles:{x:number;z:number;w:number;d:number;h:number}[]){
 const materials={grass:new THREE.MeshStandardMaterial({color:'#777d55',roughness:1}),asphalt:new THREE.MeshStandardMaterial({color:'#434d50',roughness:.97}),concrete:new THREE.MeshStandardMaterial({color:'#b6bab0',roughness:.87}),steel:new THREE.MeshStandardMaterial({color:'#91a4ab',metalness:.45,roughness:.4}),glass:new THREE.MeshStandardMaterial({color:'#456b78',metalness:.5,roughness:.22}),white:new THREE.MeshStandardMaterial({color:'#e7e4cf',roughness:.7}),red:new THREE.MeshStandardMaterial({color:'#bc5741',roughness:.8})};
 const bins=new Map<keyof typeof materials,THREE.BufferGeometry[]>();
 function add(type:keyof typeof materials,g:THREE.BufferGeometry){if(!bins.has(type))bins.set(type,[]);bins.get(type)!.push(g);}
 function box(type:keyof typeof materials,x:number,y:number,z:number,w:number,h:number,d:number,angle=0){const g=new THREE.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);add(type,g);}
 // Major avenues follow terrain, with visible lane divisions and broad city blocks.
 const roads:number[]=[],indices:number[]=[],stripes:number[]=[];
 positions.forEach((p,ci)=>{for(let axis=0;axis<2;axis++)for(let lane=-2;lane<=2;lane++){
  let previous:THREE.Vector3|undefined;
  for(let n=0;n<=60;n++){const t=(n/60-.5)*1350,off=lane*125;const x=p.x+(axis?t:off),z=p.z+(axis?off:t),y=terrainHeight(x,z);
   if(y<1||y>95){previous=undefined;continue;}const current=new THREE.Vector3(x,y+.7,z);
   if(previous){const i=roads.length/3,w=lane===0?5:3,dx=axis?0:w,dz=axis?w:0;roads.push(previous.x-dx,previous.y,previous.z-dz,previous.x+dx,previous.y,previous.z+dz,x-dx,y+.7,z-dz,x+dx,y+.7,z+dz);if(axis)indices.push(i,i+1,i+2,i+1,i+3,i+2);else indices.push(i,i+2,i+1,i+1,i+2,i+3);if(n%2===0)stripes.push(previous.x,previous.y+.06,previous.z,x,y+.76,z);}
   previous=current;
  }
 }});
 const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roads,3));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();const road=new THREE.Mesh(roadGeometry,materials.asphalt);road.name='Terrain following avenues';scene.add(road);
 const stripeG=new THREE.BufferGeometry();stripeG.setAttribute('position',new THREE.Float32BufferAttribute(stripes,3));scene.add(new THREE.LineSegments(stripeG,new THREE.LineBasicMaterial({color:'#d3cfae',transparent:true,opacity:.65})));
 // Incheon-inspired airport, scaled for fly-bys, with threshold marks and hangars.
 const airport=geo(126.23,37.43),floor=Math.max(terrainHeight(airport.x,airport.z)+3,8);
 box('grass',airport.x,floor-2,airport.z,210,4,840);box('concrete',airport.x+127,floor-.1,airport.z,88,.4,560);
 for(const dx of [-52,52]){
  box('asphalt',airport.x+dx,floor+.15,airport.z,32,.3,760);
  for(let i=-16;i<=16;i++)box('white',airport.x+dx,floor+.36,airport.z+i*21,1,.06,10);
  for(const end of [-1,1])for(let line=-4;line<=4;line++)box('white',airport.x+dx+line*2.5,floor+.4,airport.z+end*325,1.3,.05,29);
 }
 for(let i=0;i<6;i++){const z=airport.z+(i-2.5)*82;box('concrete',airport.x+125,floor+9,z,43,18,50);box('steel',airport.x+125,floor+19,z,46,2,53);box('glass',airport.x+102.9,floor+7,z,.5,10,38);}
 box('concrete',airport.x+185,floor+18,airport.z,12,36,12);box('glass',airport.x+185,floor+38,airport.z,22,9,22);box('steel',airport.x+185,floor+43,airport.z,25,2,25);
 obstacles.push({x:airport.x,z:airport.z,w:105,d:420,h:floor+2},{x:airport.x+125,z:airport.z,w:28,d:255,h:floor+22},{x:airport.x+185,z:airport.z,w:14,d:14,h:floor+46});
 // Container terminals sit on the nearest water edge of six coastal cities.
 for(const ci of [1,3,4,5,6,7]){
  const p=positions[ci];let shore:{x:number;z:number}|undefined;
  for(let r=120;r<=750&&!shore;r+=40)for(let a=0;a<24;a++){const x=p.x+Math.cos(a*Math.PI/12)*r,z=p.z+Math.sin(a*Math.PI/12)*r;if(terrainHeight(x,z)<1){shore={x,z};break;}}
  if(!shore)continue;const {x,z}=shore;box('concrete',x,2,z,140,4,180);obstacles.push({x,z,w:70,d:90,h:20});
  for(let row=0;row<5;row++)for(let col=0;col<7;col++){const cx=x-42+col*13,cz=z-65+row*23;box((row+col)%3===0?'red':'steel',cx,5.5,cz,10,7,18);if((row+col)%3===0)box('concrete',cx,12.5,cz,10,7,18);}
  for(let n=0;n<3;n++){const cz=z+(n-1)*55;for(const dx of [-12,12])box('red',x+48+dx,25,cz,3,48,4);box('red',x+52,49,cz,73,3,4);box('steel',x+82,34,cz,1,28,1);obstacles.push({x:x+52,z:cz,w:38,d:5,h:52});}
 }
 for(const [type,geometries] of bins){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,materials[type]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Airport and harbour '+type;scene.add(mesh);}
 // Low-cost clustered forest canopy: fine silhouettes at low altitude without downloads.
 const random=(()=>{let s=7823;return()=>{s=(Math.imul(s,1664525)+1013904223)|0;return(s>>>0)/4294967296;};})();
 const trees:{x:number;y:number;z:number;size:number}[]=[];
 for(let i=0;i<18000;i++){const p=positions[i%positions.length],angle=random()*Math.PI*2,r=400+random()*1700,x=p.x+Math.cos(angle)*r,z=p.z+Math.sin(angle)*r,y=terrainHeight(x,z);if(y<16||y>230||positions.some(c=>Math.hypot(x-c.x,z-c.z)<540))continue;trees.push({x,y,z,size:3+random()*5});}
 const canopy=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#687b41',roughness:1}),trees.length),dummy=new THREE.Object3D();
 trees.forEach((t,i)=>{dummy.position.set(t.x,t.y+t.size,t.z);dummy.scale.set(t.size,t.size*1.6,t.size);dummy.rotation.set(random(),random()*6,random()*.4);dummy.updateMatrix();canopy.setMatrixAt(i,dummy.matrix);canopy.setColorAt(i,new THREE.Color().setHSL(.21+random()*.06,.19+random()*.18,.19+random()*.14));});canopy.name='Clustered forest canopy';scene.add(canopy);
 return {airport:{...airport,y:floor}};
}
