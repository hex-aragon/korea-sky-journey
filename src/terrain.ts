import * as THREE from 'three';

export const region = { west:124, south:33, east:131, north:40, size:1025 };
let elevation:Int16Array | undefined;
const minX=(region.west-127.4)*2600,minZ=(37-region.north)*3300;
export const terrainBounds={x:minX,z:minZ,width:18200,depth:23100};
export function terrainHeight(x:number,z:number):number {
 if(!elevation)return 0;
 const px=(x-minX)/18200*1024,pz=(z-minZ)/23100*1024;
 if(px<0||pz<0||px>=1024||pz>=1024)return -4;
 const ix=Math.floor(px),iz=Math.floor(pz),fx=px-ix,fz=pz-iz;
 const sample=(dx:number,dz:number)=>Math.max(-10,elevation![(iz+dz)*1025+ix+dx])*.12;
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(0,0),sample(1,0),fx),THREE.MathUtils.lerp(sample(0,1),sample(1,1),fx),fz);
}
export async function loadTerrain(scene:THREE.Scene){
 const response=await fetch(import.meta.env.BASE_URL+'geography/korea-elevation.bin');if(!response.ok)throw new Error('Terrain elevation unavailable');
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==1025*1025*2)throw new Error('Invalid elevation data');elevation=new Int16Array(bytes);
 const map=await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'geography/korea-satellite.webp');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
 const material=new THREE.MeshStandardMaterial({map,roughness:.98,metalness:0});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition;\nfloat groundHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
  .replace('#include <map_fragment>',`#include <map_fragment>
    float grain=groundHash(floor(terrainPosition.xz*1.1));
    diffuseColor.rgb*=.94+grain*.12;
    // A source-image coastal pixel may include sea colour while the elevation
    // sample includes shore; remove that blue fringe instead of raising water.
    float coastBlue=step(diffuseColor.r*1.3,diffuseColor.b)*step(diffuseColor.g*1.12,diffuseColor.b);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.14,.17,.13),coastBlue);

    // Gentle rock colour at steep slopes preserves the source imagery.
    float rock=pow(1.-abs(normalize(vNormal).y),4.);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.25,.23),rock*.14);
  `);
 };
 // Independent, indexed patches allow distant terrain to be frustum culled.
 const steps=512,patch=32;
 for(let pz=0;pz<steps;pz+=patch)for(let px=0;px<steps;px+=patch){
  const pos:number[]=[],uv:number[]=[],index:number[]=[];let above=false;
  for(let z=0;z<=patch;z++)for(let x=0;x<=patch;x++){
   const u=(px+x)/steps,v=(pz+z)/steps,wx=minX+u*18200,wz=minZ+v*23100;
   const h=terrainHeight(wx,wz);if(h>1)above=true;pos.push(wx,h,wz);uv.push(u,1-v);
  }
  if(!above)continue;
  for(let z=0;z<patch;z++)for(let x=0;x<patch;x++){const a=z*(patch+1)+x,b=a+patch+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.receiveShadow=true;m.name='Satellite terrain patch';scene.add(m);
 }
}
