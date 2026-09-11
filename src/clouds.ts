import * as THREE from 'three';
import {positions} from './data';

function cloudTexture(seed:number){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=192;
 const context=canvas.getContext('2d')!, image=context.createImageData(256,192);
 let state=seed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
 const lobes=Array.from({length:14},(_,i)=>({x:36+random()*180,y:65+random()*64,r:22+random()*33}));
 for(let y=0;y<192;y++)for(let x=0;x<256;x++){
  let density=0;
  for(const l of lobes){const d=Math.hypot(x-l.x,(y-l.y)*1.15)/l.r;density=Math.max(density,Math.max(0,1-d));}
  const noise=(Math.sin(x*.16+Math.sin(y*.09)*2)+Math.cos(y*.2+Math.sin(x*.13)))*.035;
  const alpha=THREE.MathUtils.smoothstep(density+noise,.015,.38)*.87;
  const shading=THREE.MathUtils.clamp((y-65)/120,0,1);const i=(y*256+x)*4;
  image.data[i]=255-shading*45;image.data[i+1]=255-shading*33;image.data[i+2]=255-shading*24;image.data[i+3]=alpha*255;
 }
 context.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export class CloudField{
 group=new THREE.Group();private puffs:{sprite:THREE.Sprite;x:number;y:number;z:number;size:number}[]=[];
 private drift=new THREE.Vector2();private coverage=.25;
 constructor(){
  const textures=[cloudTexture(13),cloudTexture(51),cloudTexture(127)];
  for(let i=0;i<130;i++){
   const p=positions[i%positions.length],phase=i*2.39996,ring=550+Math.floor(i/10)*280;
   const x=p.x+Math.sin(phase)*ring,z=p.z+Math.cos(phase)*ring,y=720+(i%7)*165;
   const size=400+(i%5)*85;
   for(let layer=0;layer<2;layer++){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:textures[i%3],transparent:true,depthWrite:false,opacity:.65,fog:true}));
    sprite.scale.set(size,size*.75,1);this.group.add(sprite);this.puffs.push({sprite,x:x+layer*110,y:y+layer*34,z:z+layer*95,size});
   }
  }
 }
 update(dt:number,weather:{cloud:number;wind:number;direction:number;day:boolean},position:THREE.Vector3){
  this.coverage=THREE.MathUtils.damp(this.coverage,weather.cloud/100,.7,dt);
  const r=weather.direction*Math.PI/180;
  this.drift.x-=Math.sin(r)*weather.wind*.13*dt;this.drift.y+=Math.cos(r)*weather.wind*.13*dt;
  let mist=0;const color=new THREE.Color(weather.day?'#ffffff':'#5a6a88');
  this.puffs.forEach((p,i)=>{
   const rank=(Math.floor(i/2)*.61803398875)%1;
   const visibility=THREE.MathUtils.smoothstep(this.coverage+.10-rank,0,.12);
   p.sprite.visible=visibility>.01;if(!p.sprite.visible)return;
   p.sprite.position.set(p.x+this.drift.x,p.y,p.z+this.drift.y);
   const distance=p.sprite.position.distanceTo(position);
   const fade=THREE.MathUtils.smoothstep(distance,55,280);
   p.sprite.material.opacity=visibility*fade*.64;
   p.sprite.material.color.copy(color);
   if(distance<p.size*.36)mist=Math.max(mist,(1-distance/(p.size*.36))*visibility);
  });
  return mist;
 }
}
