import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ObstacleGrid} from '../src/obstacle-grid.mjs';
test('spatial collision lookup matches exact scan across negative coordinates and cell borders',()=>{
 const objects=Array.from({length:200},(_,i)=>({x:Math.sin(i*12.7)*1500,z:Math.cos(i*31.1)*1200,w:5+i%80,d:4+i%41,h:20+i%120}));
 const grid=new ObstacleGrid(objects);
 for(let x=-1600;x<1600;x+=17)for(let z=-1300;z<1300;z+=29){const expected=objects.reduce((y,o)=>Math.abs(x-o.x)<o.w+16&&Math.abs(z-o.z)<o.d+16?Math.max(y,o.h):y,7);assert.equal(grid.height(x,z,7),expected);}
});
test('detailed fighter stays inside browser mesh and download budgets',async()=>{
 const b=await readFile(new URL('../public/models/fighter.glb',import.meta.url));const gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 const primitives=gltf.meshes.flatMap(m=>m.primitives);assert.ok(primitives.length<=12,`${primitives.length} draw calls`);assert.ok(b.length<2*1024*1024);
 let triangles=0;for(const p of primitives)triangles+=(p.indices===undefined?gltf.accessors[p.attributes.POSITION].count:gltf.accessors[p.indices].count)/3;
 assert.ok(triangles<60000,`${triangles} triangles`);
});
