import * as THREE from 'three';
import { polygons } from './world';
import { cities,positions } from './data';
import { SkyRace } from './race.mjs';
export class Minimap{
 ctx:CanvasRenderingContext2D;
 constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;}
 draw(player:{x:number;z:number;attitude:THREE.Quaternion},race:SkyRace){
  const ctx=this.ctx,size=280,scale=.031,point=(x:number,z:number)=>({x:size/2+(x-player.x)*scale,y:size/2+(z-player.z)*scale});
  ctx.clearRect(0,0,size,size);ctx.fillStyle='#173746';ctx.fillRect(0,0,size,size);ctx.strokeStyle='#365563';ctx.lineWidth=1;
  for(let i=0;i<size;i+=35){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,size);ctx.moveTo(0,i);ctx.lineTo(size,i);ctx.stroke();}
  ctx.fillStyle='#466860';ctx.strokeStyle='#80a49a';
  for(const polygon of polygons){ctx.beginPath();polygon.forEach(([x,z],i)=>{const p=point(x,z);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.fill();ctx.stroke();}
  if(race.active&&race.course){ctx.strokeStyle='#a6ffe3';ctx.lineWidth=2;ctx.beginPath();race.course.gates.slice(race.index).forEach((g,i)=>{const p=point(g.x,g.z);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();const g=race.course.gates[race.index];if(g){const p=point(g.x,g.z);ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.stroke();}}
  ctx.font='19px sans-serif';ctx.textAlign='left';positions.forEach((p,i)=>{const q=point(p.x,p.z);if(q.x<5||q.x>size-40||q.y<25||q.y>size-15)return;ctx.fillStyle='#e0ece7';ctx.fillRect(q.x-2,q.y-2,4,4);ctx.fillText(cities[i].name,q.x+7,q.y+6);});
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(player.attitude);ctx.save();ctx.translate(size/2,size/2);ctx.rotate(Math.atan2(forward.x,-forward.z));ctx.fillStyle='#fff1ba';ctx.strokeStyle='#173746';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(9,10);ctx.lineTo(0,6);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle='#fff';ctx.fillText('N ↑',12,25);
 }
}
