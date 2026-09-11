import * as THREE from 'three';
import { SkyRace } from './race.mjs';
export class SkyRaceView{
 group=new THREE.Group();rings:THREE.Mesh[]=[];
 activeMaterial=new THREE.MeshStandardMaterial({color:0xb9fff0,emissive:0x50cfb3,emissiveIntensity:1.5,metalness:.4,roughness:.28});
 futureMaterial=new THREE.MeshStandardMaterial({color:0xd1e7ea,emissive:0x659197,emissiveIntensity:.3,metalness:.5,roughness:.35});
 dangerMaterial=new THREE.MeshStandardMaterial({color:0xf18739,emissive:0xaa3c0b,emissiveIntensity:.4,metalness:.3,roughness:.45});
 ringGeometry=new THREE.TorusGeometry(155,5,8,64);beaconGeometry=new THREE.OctahedronGeometry(65,0);
 constructor(scene:THREE.Scene){scene.add(this.group);}
 rebuild(race:SkyRace){this.group.clear();this.rings=[];if(!race.course)return;
  for(const gate of race.course.gates){const ring=new THREE.Mesh(this.ringGeometry,this.futureMaterial);ring.position.set(gate.x,gate.y,gate.z);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(gate.dx,0,gate.dz));this.group.add(ring);this.rings.push(ring);}
  for(const o of race.course.obstacles){const mesh=new THREE.Mesh(this.beaconGeometry,this.dangerMaterial);mesh.position.set(o.x,o.y,o.z);this.group.add(mesh);}
 }
 update(race:SkyRace){this.group.visible=race.active;this.rings.forEach((r,i)=>{r.visible=i>=race.index;r.material=i===race.index?this.activeMaterial:this.futureMaterial;});}
}
