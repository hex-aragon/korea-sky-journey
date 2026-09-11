import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {FlightFeel} from '../src/flight-feel.mjs';
function maneuver(axis,rate){const f=new FlightFeel();for(let i=0;i<=600;i++)f.update(new Quaternion().setFromAxisAngle(axis,i/100*rate),300,1800,0,0,.01);return f;}
test('continuous rolls produce directional airflow without false turn strain',()=>{const f=maneuver(new Vector3(0,0,1),2.75);assert.ok(f.roll>2.7);assert.ok(f.turn<.001);assert.ok(f.load<1.01);});
test('pitch loops produce sustained turn strain with no roll cue',()=>{const f=maneuver(new Vector3(1,0,0),1.2);assert.ok(f.load>5);assert.ok(Math.abs(f.roll)<.001);assert.ok(f.turn>1.19);});
test('equivalent quaternion signs do not trigger false motion',()=>{const f=new FlightFeel(),q=new Quaternion();f.update(q,300,1000,0,0,.01);f.update(new Quaternion(0,0,0,-1),300,1000,0,0,.01);assert.equal(f.roll,0);assert.equal(f.load,1);});
test('paused frames and reset prevent teleport spikes',()=>{const f=maneuver(new Vector3(1,0,0),1.2),previous=f.load;f.update(new Quaternion(),540,2000,60,100,0);assert.equal(f.load,previous);f.reset();f.update(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI),540,2000,60,100,.05);assert.equal(f.load,1);assert.equal(f.roll,0);});
test('cloud layer adds turbulence and all cues stay bounded',()=>{const sample=(alt)=>{const f=new FlightFeel();for(let i=0;i<300;i++)f.update(new Quaternion(),300,alt,20,100,.01);return f.gust;};assert.ok(sample(1800)>sample(3500)+.5);const f=maneuver(new Vector3(1,0,0),100);assert.ok(f.load<=8);assert.ok(Number.isFinite(f.load));});
