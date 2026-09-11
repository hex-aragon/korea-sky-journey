import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { styleSky } from './sky-style';
import { loadTerrain, terrainHeight } from './terrain';
import { createOcean } from './ocean';
export { terrainHeight } from './terrain';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import boundaries from './korea.json';
import { cities, geo, positions } from './data';
export const polygons:number[][][]=boundaries.features.flatMap(f=>f.geometry.coordinates.map(p=>p[0].map(([lon,lat])=>{const a=geo(lon,lat);return [a.x,a.z];})));
export function isLand(x:number,z:number){return terrainHeight(x,z)>1;}
function rng(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
export class World{
 scene=new THREE.Scene();sky=new Sky();sun=new THREE.DirectionalLight('#fff1d4',2.3);hemi=new THREE.HemisphereLight('#c8e8ff','#7c9c72',2.4);ocean:THREE.Mesh;sunDirection=new THREE.Vector3(-.6,.4,-.6).normalize();aircraft=new THREE.Group();landmarks:THREE.Group[]=[];obstacles:{x:number;z:number;w:number;d:number;h:number}[]=[];rain:THREE.LineSegments;snow:THREE.Points;stars:THREE.Points;moon:THREE.Mesh;private cityMaterial:THREE.MeshStandardMaterial|undefined;ready:Promise<void>;cameraCity=0;private time=0;
 constructor(){
  this.scene.fog=new THREE.FogExp2('#adc8dc',.000042);this.scene.add(this.hemi,this.sun);this.sun.position.set(-4000,8000,-3000);this.sky.scale.setScalar(180000);styleSky(this.sky);this.scene.add(this.sky);this.sky.material.uniforms.turbidity.value=3;this.sky.material.uniforms.rayleigh.value=1.4;this.sky.material.uniforms.mieCoefficient.value=.003;this.sky.material.uniforms.mieDirectionalG.value=.8;
  this.ocean=createOcean();this.scene.add(this.ocean);const random=rng(129);
  const rainG=new THREE.BufferGeometry(),rainPos=new Float32Array(600*6);
  for(let i=0;i<600;i++){const x=(random()-.5)*600,y=(random()-.5)*600,z=(random()-.5)*600;rainPos.set([x,y,z,x-1,y+12,z],i*6);}
  rainG.setAttribute('position',new THREE.BufferAttribute(rainPos,3));this.rain=new THREE.LineSegments(rainG,new THREE.LineBasicMaterial({color:'#d5e6ef',transparent:true,opacity:.32,depthWrite:false}));this.rain.visible=false;this.scene.add(this.rain);
  const snowG=new THREE.BufferGeometry(),snowPos=new Float32Array(450*3);for(let i=0;i<snowPos.length;i++)snowPos[i]=(random()-.5)*600;snowG.setAttribute('position',new THREE.BufferAttribute(snowPos,3));this.snow=new THREE.Points(snowG,new THREE.PointsMaterial({color:'#fffafa',size:2.2,transparent:true,opacity:.65,depthWrite:false}));this.snow.visible=false;this.scene.add(this.snow);
  const starGeometry=new THREE.BufferGeometry(),starPositions=new Float32Array(1200*3);for(let i=0;i<1200;i++){const angle=random()*Math.PI*2,elevation=.12+random()*1.4;starPositions.set([Math.cos(angle)*Math.cos(elevation)*28000,Math.sin(elevation)*28000,Math.sin(angle)*Math.cos(elevation)*28000],i*3);}starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));this.stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#fff2dc',size:22,transparent:true,opacity:0,depthWrite:false,fog:false}));this.scene.add(this.stars);this.moon=new THREE.Mesh(new THREE.SphereGeometry(280,24,16),new THREE.MeshBasicMaterial({color:'#fff2d2',fog:false}));this.moon.position.set(-18000,12500,-14000);this.moon.visible=false;this.scene.add(this.moon);
  this.scene.add(this.aircraft);this.ready=this.initialize();
 }
 async initialize(){
  await loadTerrain(this.scene);this.createCities();this.createLandmarks();await this.loadModels();await this.createForest();
 }
 async createForest(){
  const data=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/broadleaf.glb');const random=rng(761),dummy=new THREE.Object3D();const trees:{x:number;y:number;z:number;s:number}[]=[];
  for(let i=0;i<6500;i++){const x=(random()-.5)*16000,z=-7500+random()*21000,y=terrainHeight(x,z);if(y<18||y>220||positions.some(p=>Math.hypot(p.x-x,p.z-z)<450))continue;trees.push({x,y,z,s:.65+random()*1.1});}
  data.scene.updateMatrixWorld(true);data.scene.traverse(node=>{if(!(node instanceof THREE.Mesh))return;const g=node.geometry.clone();g.applyMatrix4(node.matrixWorld);const material=new THREE.MeshStandardMaterial({color:'#435636',roughness:1});const mesh=new THREE.InstancedMesh(g,material,trees.length);trees.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.y=random()*Math.PI*2;dummy.scale.setScalar(t.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color().setHSL(.22+random()*.04,.22,.3+random()*.17));});mesh.name='Blender broadleaf forest';this.scene.add(mesh);});
 }
 createDistrict(cx:number,cz:number){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!,r=rng(Math.round(cx+cz));
  ctx.fillStyle='#60685f';ctx.fillRect(0,0,512,512);
  for(let i=0;i<500;i++){ctx.fillStyle=['#92968b','#8a8e87','#727c70','#a0a094'][i%4];ctx.fillRect(r()*512,r()*512,3+r()*14,3+r()*10);}
  // Match the building lattice, with wider avenues every fourth block.
  const cell=512/1056*22;for(let n=0;n<49;n++){const a=n*cell;ctx.fillStyle=n%4?'#5b615e':'#737771';ctx.fillRect(a-1,0,n%4?2:3,512);ctx.fillRect(0,a-1,512,n%4?2:3);}
  const mask=ctx.createRadialGradient(256,256,120,256,256,256);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');ctx.globalCompositeOperation='destination-in';ctx.fillStyle=mask;ctx.fillRect(0,0,512,512);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const g=new THREE.PlaneGeometry(1056,1056,48,48);g.rotateX(-Math.PI/2);const a=g.attributes.position;
  const colors=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){const x=a.getX(i)+cx,z=a.getZ(i)+cz,h=terrainHeight(x,z);a.setXYZ(i,x,h+.35,z);const allowed=h>1&&h<70?1:0;colors.set([allowed,allowed,allowed],i*3);}g.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float groundHeight;').replace('#include <begin_vertex>','#include <begin_vertex>\ngroundHeight=position.y;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float groundHeight;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=smoothstep(1.,3.,groundHeight)*(1.-smoothstep(40.,80.,groundHeight));');};
  const district=new THREE.Mesh(g,material);district.receiveShadow=true;district.name='Conforming city district';this.scene.add(district);
 }
 createCities(){
  const random=rng(1024),dummy=new THREE.Object3D(),color=new THREE.Color();const items:{x:number;y:number;z:number;w:number;h:number;d:number;c:string}[]=[];
  cities.forEach((c,ci)=>{const center=positions[ci];this.createDistrict(center.x,center.z);const count=ci===0?2400:ci===6?1500:ci===1?1200:650;const occupied=new Set<string>();
   for(let i=0;i<count;i++){const x=center.x+(random()-.5)*1050,z=center.z+(random()-.5)*950;if(!isLand(x,z))continue;const gx=Math.round((x-center.x)/22)*22+center.x,gz=Math.round((z-center.z)/22)*22+center.z;const cell=`${gx},${gz}`;if(occupied.has(cell)||!isLand(gx,gz))continue;occupied.add(cell);const w=6+random()*8,d=6+random()*8,h=(5+random()**3*(ci===0||ci===6?65:30));const y=terrainHeight(gx,gz);if(y>90||Math.abs(terrainHeight(gx+10,gz)-y)>9)continue;items.push({x:gx,y,z:gz,w,h,d,c:['#d9d6cc','#c1c4be','#a9b7bc','#cfcabe','#b4b9b8'][Math.floor(random()*5)]});this.obstacles.push({x:gx,z:gz,w:w/2,d:d/2,h:y+h});}
  });
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e8ece9';ctx.fillRect(0,0,64,128);for(let y=7;y<128;y+=12)for(let x=6;x<64;x+=13){ctx.fillStyle=y%3?'#6b929a':'#c3d5d0';ctx.fillRect(x,y,5,6);}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const glow=document.createElement('canvas');glow.width=64;glow.height=128;const gc=glow.getContext('2d')!;gc.fillStyle='black';gc.fillRect(0,0,64,128);gc.fillStyle='#ffd58d';for(let y=7;y<128;y+=12)for(let x=6;x<64;x+=13)if(random()>.35)gc.fillRect(x,y,5,6);const emissiveMap=new THREE.CanvasTexture(glow);emissiveMap.colorSpace=THREE.SRGBColorSpace;this.cityMaterial=new THREE.MeshStandardMaterial({roughness:.72,metalness:.12,map:texture,emissiveMap,emissive:'#fff1bf',emissiveIntensity:0});const buildings=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),this.cityMaterial,items.length);items.forEach((o,i)=>{dummy.position.set(o.x,o.y+o.h/2,o.z);dummy.scale.set(o.w,o.h,o.d);dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);color.set(o.c);buildings.setColorAt(i,color);});buildings.castShadow=true;buildings.receiveShadow=true;this.scene.add(buildings);
  const rooftops=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#a3aca9',roughness:.85}),items.length);items.forEach((o,i)=>{dummy.position.set(o.x,o.y+o.h+1.2,o.z);dummy.scale.set(o.w*.5,2.4,o.d*.4);dummy.updateMatrix();rooftops.setMatrixAt(i,dummy.matrix);});this.scene.add(rooftops);
 }
 box(group:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:string){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 bridge(center:THREE.Vector3,length:number,color:string){const g=new THREE.Group();g.position.copy(center);this.box(g,0,37,0,length,5,22,'#dadcca');for(const x of [-length*.3,length*.3]){for(const z of [-14,14])this.box(g,x,65,z,6,128,6,color);this.box(g,x,115,0,9,6,34,color);}for(const z of [-14,14]){const points=[];for(let i=0;i<=40;i++){const x=-length*.3+length*.6*i/40;points.push(new THREE.Vector3(x,55+65*((i-20)/20)**2,z));if(i%2===0)this.box(g,x,(points.at(-1)!.y+38)/2,z,1,points.at(-1)!.y-38,1,'#ececdb');}const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,1.4,4,false),new THREE.MeshLambertMaterial({color:'#f5f0d8'}));g.add(cable);}this.scene.add(g);return g;}
 createLandmarks(){cities.forEach((c,i)=>{const p=positions[i];const g=new THREE.Group();const landmarkPosition=i===0?geo(126.9882,37.5512):{x:p.x+120,z:p.z-100};g.position.set(landmarkPosition.x,terrainHeight(landmarkPosition.x,landmarkPosition.z),landmarkPosition.z);this.landmarks.push(g);this.scene.add(g);});
 const bridges=[{i:1,x:-360,z:170,l:820,c:'#e6e9dd'},{i:4,x:100,z:240,l:430,c:'#cd6954'},{i:6,x:230,z:210,l:750,c:'#f1eee0'}];for(const b of bridges){const p=positions[b.i];this.bridge(new THREE.Vector3(p.x+b.x,0,p.z+b.z),b.l,b.c);this.landmarks[b.i].position.set(p.x+b.x,45,p.z+b.z);}
 for(const ci of [1,3,4,5,6,7]){const p=positions[ci];for(let j=0;j<11;j++){const x=p.x-360+j*62,z=p.z+330;if(isLand(x,z))continue;const boat=new THREE.Group();boat.position.set(x,1,z);boat.rotation.y=j*.7;const hull=new THREE.Mesh(new THREE.CapsuleGeometry(3,16,3,8),new THREE.MeshLambertMaterial({color:j%2?'#d3a66a':'#e9ebe1'}));hull.rotation.x=Math.PI/2;hull.scale.y=.7;boat.add(hull);this.box(boat,0,3,1,5,4,7,'#f2efe3');this.box(boat,0,7,2,.5,8,.5,'#555d60');this.scene.add(boat);}}
 // Coastal wind farms.
 [2].forEach(i=>{const p=positions[i];for(let j=0;j<4;j++){const g=new THREE.Group();g.position.set(p.x+(j-3)*80,terrainHeight(p.x+(j-3)*80,p.z+290),p.z+290);this.box(g,0,35,0,3,70,3,'#f5f1df');for(let b=0;b<3;b++){const blade=this.box(g,0,80,0,3,45,1,'#f5f1df');blade.position.set(Math.sin(b*Math.PI*2/3)*20,70+Math.cos(b*Math.PI*2/3)*20,0);blade.rotation.z=-b*Math.PI*2/3;}this.scene.add(g);}});
 }
 async loadModels(){const loader=new GLTFLoader();const base=import.meta.env.BASE_URL;const plane=await loader.loadAsync(base+'models/fighter.glb');this.aircraft.add(plane.scene);this.aircraft.scale.setScalar(2.2);this.aircraft.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m instanceof THREE.MeshStandardMaterial){m.emissive.copy(m.color);m.emissiveIntensity=.16;}}}});const load=async(file:string,indexes:number[])=>{const data=await loader.loadAsync(base+'models/'+file+'.glb');for(const i of indexes)this.landmarks[i].add(data.scene.clone());};const tower=await loader.loadAsync(base+'models/seoul-tower.glb');const tp=geo(127.1025,37.5126);tower.scene.position.set(tp.x,terrainHeight(tp.x,tp.z),tp.z);tower.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});this.scene.add(tower.scene);this.obstacles.push({x:tp.x,z:tp.z,w:22,d:22,h:tower.scene.position.y+205});await Promise.all([load('namsan',[0]),load('pavilion',[3,5,8]),load('lighthouse',[2,7,9])]);}
 ground(x:number,z:number){let y=terrainHeight(x,z);for(const o of this.obstacles)if(Math.abs(x-o.x)<o.w+16&&Math.abs(z-o.z)<o.d+16)y=Math.max(y,o.h);const tower=this.landmarks[0].position;if(Math.hypot(x-tower.x,z-tower.z)<50)y=Math.max(y,tower.y+220);return y;}
 update(dt:number,weather:{cloud:number;wind:number;direction:number;day:boolean;code:number},position:THREE.Vector3,sunset=false){
  this.time+=dt;const night=!weather.day,overcast=weather.cloud/100;
  this.sunDirection.setFromSphericalCoords(1,THREE.MathUtils.degToRad(night?100:sunset?86:66),THREE.MathUtils.degToRad(235));
  this.sun.position.copy(position).addScaledVector(this.sunDirection,5000);this.sun.target.position.copy(position);this.sun.target.updateMatrixWorld();
  this.sky.material.uniforms.sunPosition.value.copy(this.sunDirection);this.sky.material.uniforms.turbidity.value=1.5+overcast*2.8;this.sky.material.uniforms.rayleigh.value=night?.25:2.5;
  this.sun.color.set(sunset?'#ffd0a0':'#fff4e2');
  this.sun.intensity=THREE.MathUtils.damp(this.sun.intensity,night?.06:sunset?2.5:3.3-overcast*1.6,1,dt);
  this.hemi.intensity=THREE.MathUtils.damp(this.hemi.intensity,night?.18:.85-overcast*.2,1,dt);
  const fog=this.scene.fog as THREE.FogExp2;fog.density=THREE.MathUtils.damp(fog.density,(night?.000035:.00004)+overcast*.000025,.5,dt);fog.color.lerp(new THREE.Color(night?'#14273d':sunset?'#b9a1a0':'#a6c5d6'),dt);
  const ocean=this.ocean.material as THREE.ShaderMaterial;ocean.uniforms.time.value=this.time;ocean.uniforms.sunDirection.value.copy(this.sunDirection);ocean.uniforms.skyColor.value.copy(fog.color);ocean.uniforms.night.value=night?1:0;ocean.uniforms.sunset.value=sunset?1:0;
  (this.stars.material as THREE.PointsMaterial).opacity=THREE.MathUtils.damp((this.stars.material as THREE.PointsMaterial).opacity,night?1-overcast:0,1,dt);this.moon.visible=night;
  if(this.cityMaterial)this.cityMaterial.emissiveIntensity=THREE.MathUtils.damp(this.cityMaterial.emissiveIntensity,night?1.4:0,1,dt);
  const snowing=[71,73,75,77,85,86].includes(weather.code);this.rain.visible=weather.code>=51&&!snowing&&position.y<1200;this.snow.visible=snowing&&position.y<1200;
  if(this.rain.visible){this.rain.position.copy(position);const a=this.rain.geometry.attributes.position;for(let i=0;i<a.count;i+=2){let y=a.getY(i)-dt*190;if(y< -300)y+=600;a.setY(i,y);a.setY(i+1,y+12);}a.needsUpdate=true;}
  if(this.snow.visible){this.snow.position.copy(position);const a=this.snow.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*20;if(y< -300)y+=600;a.setY(i,y);}a.needsUpdate=true;}
 }
}
