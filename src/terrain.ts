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
 const sample=(dx:number,dz:number)=>Math.max(-500,elevation![(iz+dz)*1025+ix+dx])*.12;
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(0,0),sample(1,0),fx),THREE.MathUtils.lerp(sample(0,1),sample(1,1),fx),fz);
}
export async function loadTerrain(scene:THREE.Scene){
 const response=await fetch(import.meta.env.BASE_URL+'geography/korea-elevation.bin');if(!response.ok)throw new Error('Terrain elevation unavailable');
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==1025*1025*2)throw new Error('Invalid elevation data');elevation=new Int16Array(bytes);
 const map=await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'geography/korea-satellite.webp');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
 const textures=await Promise.all(['rock-color.jpg','grass-color.jpg','rock-normal.jpg'].map(file=>new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'materials/'+file)));
 textures.forEach((t,i)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(i<2)t.colorSpace=THREE.SRGBColorSpace;});
 const material=new THREE.MeshStandardMaterial({map,roughness:.98,metalness:0});
 material.onBeforeCompile=shader=>{
  shader.uniforms.rockDetail={value:textures[0]};shader.uniforms.grassDetail={value:textures[1]};shader.uniforms.detailNormal={value:textures[2]};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition; varying vec3 terrainNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;terrainNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition; varying vec3 terrainNormal;\nuniform sampler2D rockDetail,grassDetail,detailNormal;\nfloat groundHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat groundNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(groundHash(i),groundHash(i+vec2(1,0)),f.x),mix(groundHash(i+vec2(0,1)),groundHash(i+vec2(1,1)),f.x),f.y);}')
  .replace('#include <map_fragment>',`#include <map_fragment>
    if(terrainPosition.y<.28) discard;
    float distanceToEye=length(cameraPosition-terrainPosition);
    float detailFade=1.-smoothstep(300.,3500.,distanceToEye);
    float detail=groundNoise(terrainPosition.xz*.025)*.6+groundNoise(terrainPosition.xz*.16)*.4;
    diffuseColor.rgb*=.86+detail*.32*detailFade;
    float luminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=mix(vec3(luminance),diffuseColor.rgb,.78);
    // A source-image coastal pixel may include sea colour while the elevation
    // sample includes shore; remove that blue fringe instead of raising water.
    float coastBlue=step(diffuseColor.r*1.3,diffuseColor.b)*step(diffuseColor.g*1.12,diffuseColor.b);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.14,.17,.13),coastBlue);

    // Gentle rock colour at steep slopes preserves the source imagery.
    float rock=pow(1.-abs(normalize(terrainNormal).y),4.);
    float slope=smoothstep(.08,.55,1.-abs(normalize(terrainNormal).y));
    vec3 grass=texture2D(grassDetail,terrainPosition.xz/115.).rgb;
    vec3 stone=texture2D(rockDetail,terrainPosition.xz/165.).rgb;
    vec3 closeSurface=mix(grass*vec3(.65,.8,.53),stone,slope);
    float altitudeBlend=smoothstep(18.,80.,terrainPosition.y);
    diffuseColor.rgb=mix(diffuseColor.rgb,closeSurface,detailFade*altitudeBlend*.62);
    float shore=(1.-smoothstep(.4,3.8,terrainPosition.y));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.32,.29,.19),shore*.52);
  `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec2 localUV=terrainPosition.xz/165.;
    vec3 detailN=texture2D(detailNormal,localUV).xyz*2.-1.;
    vec3 dp1=dFdx(-vViewPosition),dp2=dFdy(-vViewPosition);
    vec2 duv1=dFdx(localUV),duv2=dFdy(localUV);
    vec3 tangent=normalize(dp1*duv2.y-dp2*duv1.y);
    vec3 bitangent=normalize(-dp1*duv2.x+dp2*duv1.x);
    float bumpFade=(1.-smoothstep(300.,2400.,length(cameraPosition-terrainPosition)))*smoothstep(6.,40.,terrainPosition.y);
    normal=normalize(mix(normal,mat3(tangent,bitangent,normal)*detailN,.45*bumpFade));
  `);
 };
 // Boundary vertices share the coarse edge interpolation at both LOD levels.
 // This prevents cracks without overlapping skirts or extra draw calls.
 const tiles=16;
 const geometry=(tx:number,tz:number,segments:number)=>{
  const pos:number[]=[],uv:number[]=[],index:number[]=[];
  for(let z=0;z<=segments;z++)for(let x=0;x<=segments;x++){
   const u=(tx+x/segments)/tiles,v=(tz+z/segments)/tiles,wx=minX+u*18200,wz=minZ+v*23100;
   let height=terrainHeight(wx,wz);
   if(segments>32&&(x===0||z===0||x===segments||z===segments)){
    const along=x===0||x===segments?z:x,step=segments/32,lo=Math.floor(along/step)*step,hi=Math.min(segments,lo+step),f=(along-lo)/step;
    const edgeHeight=(n:number)=>terrainHeight(minX+(tx+(x===0||x===segments?x:n)/segments)/tiles*18200,minZ+(tz+(x===0||x===segments?n:z)/segments)/tiles*23100);
    height=THREE.MathUtils.lerp(edgeHeight(lo),edgeHeight(hi),f);
   }
   pos.push(wx,height,wz);uv.push(u,1-v);
  }
  for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){const a=z*(segments+1)+x,b=a+segments+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
 };
 for(let tz=0;tz<tiles;tz++)for(let tx=0;tx<tiles;tx++){
  let above=false;for(let z=0;z<=16;z++)for(let x=0;x<=16;x++)if(terrainHeight(minX+(tx+x/16)/tiles*18200,minZ+(tz+z/16)/tiles*23100)>1)above=true;
  if(!above)continue;
  const lod=new THREE.LOD();lod.position.set(minX+(tx+.5)/tiles*18200,0,minZ+(tz+.5)/tiles*23100);
  for(const [segments,distance] of [[64,0],[32,2400]]){const m=new THREE.Mesh(geometry(tx,tz,segments),material);m.position.copy(lod.position).negate();m.receiveShadow=true;lod.addLevel(m,distance,.15);}
  lod.name='Detailed satellite terrain LOD';scene.add(lod);
 }
}

export function coastalHeightTexture(){
 const data=new Uint8Array(1025*1025);for(let i=0;i<data.length;i++)data[i]=THREE.MathUtils.clamp(((elevation?.[i]??-500)*.12+60)/140,0,1)*255;
 const texture=new THREE.DataTexture(data,1025,1025,THREE.RedFormat);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
