import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepFlight,damp} from '../src/flight.mjs';
import {normalizeWeather,weatherName,fetchWeather} from '../src/weather.mjs';
const initial=()=>({x:0,y:400,z:0,heading:0,bank:0,pitch:0,speed:85});
const input={turn:0,climb:0,fast:false};
const wind={wind:0,direction:0};
test('right steering turns east; left steering turns west',()=>{for(const turn of [-1,1]){const s=initial();for(let i=0;i<120;i++)stepFlight(s,{...input,turn},1/60,wind,()=>0);assert.equal(Math.sign(s.x),turn);}});
test('climbing and descending respect ceiling and terrain clearance',()=>{const s=initial();for(let i=0;i<2000;i++)stepFlight(s,{...input,climb:1},.05,wind,()=>0);assert.equal(s.y,3200);for(let i=0;i<2000;i++)stepFlight(s,{...input,climb:-1},.05,wind,()=>180);assert.equal(s.y,235);});
test('wind direction from north carries aircraft south',()=>{const a=initial(),b=initial();stepFlight(a,input,.05,wind,()=>0);stepFlight(b,input,.05,{wind:36,direction:0},()=>0);assert(b.z>a.z);});
test('large frame delays are clamped',()=>{const s=initial();stepFlight(s,input,40,wind,()=>0);assert(Math.abs(s.z)<5);assert(Number.isFinite(s.y));});
test('weather validates dates and clamps external values',()=>{const now=Date.parse('2026-09-11T09:00:00+09:00');const raw={current:{time:'2026-09-11T09:00',temperature_2m:24,cloud_cover:200,wind_speed_10m:12,wind_direction_10m:370,weather_code:3,is_day:1}};const w=normalizeWeather(raw,now);assert.equal(w.cloud,100);assert.equal(w.direction,10);assert.equal(w.live,true);assert.throws(()=>normalizeWeather(raw,now+4*3600*1000));assert.throws(()=>normalizeWeather({current:{...raw.current,wind_speed_10m:'bad'}},now));});
test('weather labels match common codes',()=>{assert.equal(weatherName(0),'맑음');assert.equal(weatherName(3),'구름 많음');assert.equal(weatherName(63),'비');});
test('damping does not overshoot',()=>{assert(damp(0,10,3,.05)>0);assert(damp(0,10,3,.05)<10);});

test('all Blender GLB assets are valid self-contained models',async()=>{const {readFile}=await import('node:fs/promises');for(const name of ['skywing','glider','namsan','pavilion','lighthouse','broadleaf','seoul-tower']){const b=await readFile(new URL(`../public/models/${name}.glb`,import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const len=b.readUInt32LE(12),json=JSON.parse(b.toString('utf8',20,20+len));assert(json.meshes.length>0);assert(json.buffers.every(buffer=>!buffer.uri));assert(!json.images?.some(image=>image.uri?.startsWith('http')));}});

test('altitude slider moves at a bounded rate without overshooting',async()=>{const {approachAltitude}=await import('../src/flight.mjs');assert.equal(approachAltitude(400,2400,.05),406);assert.equal(approachAltitude(400,100,.05),394);assert.equal(approachAltitude(400,402,.05),402);});
test('cruise speed selection changes manual flight speed',()=>{const slow=initial(),fast=initial();for(let i=0;i<600;i++){stepFlight(slow,{...input,cruise:35},1/60,wind,()=>0);stepFlight(fast,{...input,cruise:100},1/60,wind,()=>0);}assert(slow.speed<36);assert(fast.speed>99);});

test('geographic asset uses a north-to-south elevation grid with valid land and sea',async()=>{
 const {readFile}=await import('node:fs/promises');
 const meta=JSON.parse(await readFile(new URL('../public/geography/metadata.json',import.meta.url)));
 const data=await readFile(new URL('../public/geography/korea-elevation.bin',import.meta.url));
 assert.equal(data.length,meta.size*meta.size*2);
 const sample=(lon,lat)=>{const x=Math.round((lon-meta.west)/(meta.east-meta.west)*(meta.size-1)),y=Math.round((meta.north-lat)/(meta.north-meta.south)*(meta.size-1));return data.readInt16LE((y*meta.size+x)*2);};
 assert(sample(128.465,38.118)>1200,'Seoraksan must remain a mountain, not a flipped ocean sample');
 assert(sample(130,37)<0,'East Sea must remain below sea level');
 assert(sample(126.978,37.5665)>0&&sample(126.978,37.5665)<200,'central Seoul terrain is low-lying land');
});
