import * as THREE from 'three';
import { Combat } from './combat.mjs';

export class CombatView {
 private root = new THREE.Group();
 private enemies: THREE.Group[] = [];
 private missiles = new Map<number, THREE.Group>();
 private incoming: THREE.Group;
 private burstMeshes: THREE.Mesh[] = [];
 private markers: HTMLDivElement[] = [];
 private missileGeometry = new THREE.ConeGeometry(2.3, 15, 6);
 private trailGeometry = new THREE.CylinderGeometry(.5, 2, 65, 5);
 private hostileMaterial = new THREE.MeshBasicMaterial({color:'#ff594b'});
 private missileMaterial = new THREE.MeshBasicMaterial({color:'#fff1be'});
 private trailMaterial = new THREE.MeshBasicMaterial({color:'#ffb454', transparent:true, opacity:.7, depthWrite:false});
 constructor(scene:THREE.Scene, private hud:HTMLElement) {
  scene.add(this.root); this.root.visible=false;
  this.incoming = this.createMissile(true); this.root.add(this.incoming);
  const burstGeometry=new THREE.IcosahedronGeometry(1,1);
  for(let i=0;i<8;i++) {const mesh=new THREE.Mesh(burstGeometry,new THREE.MeshBasicMaterial({color:'#ffd29a',transparent:true,depthWrite:false}));mesh.visible=false;this.root.add(mesh);this.burstMeshes.push(mesh);}
  for(let i=0;i<3;i++){const marker=document.createElement('div');marker.className='enemy-marker';marker.hidden=true;this.hud.append(marker);this.markers.push(marker);}
 }
 setAircraft(template:THREE.Object3D) {
  const materials=new Map<THREE.Material,THREE.Material>();
  for(let i=0;i<3;i++) {
   const jet=new THREE.Group(),model=template.clone(true);model.traverse(o=>{
    if(o instanceof THREE.Mesh){o.castShadow=false;const convert=(m:THREE.Material)=>{
     if(!materials.has(m)){const copy=m.clone();if(copy instanceof THREE.MeshStandardMaterial){copy.color.lerp(new THREE.Color('#773d48'),.68);copy.emissive.set('#6f2431');copy.emissiveIntensity=.22;}materials.set(m,copy);}return materials.get(m)!;
    };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}
   });jet.add(model);jet.scale.setScalar(2.2);this.root.add(jet);this.enemies.push(jet);
  }
 }
 private createMissile(hostile=false) {
  const group=new THREE.Group();
  const nose=new THREE.Mesh(this.missileGeometry,hostile?this.hostileMaterial:this.missileMaterial);
  nose.rotation.x=-Math.PI/2;group.add(nose);
  const trail=new THREE.Mesh(this.trailGeometry,this.trailMaterial);trail.rotation.x=Math.PI/2;trail.position.z=37;group.add(trail);return group;
 }
 update(combat:Combat, camera:THREE.PerspectiveCamera, player:THREE.Vector3, attitude:THREE.Quaternion) {
  this.root.visible=combat.active;this.hud.hidden=!combat.active||combat.dead;
  for(let i=0;i<this.enemies.length;i++){const enemy=combat.enemies[i],model=this.enemies[i];model.visible=combat.active&&!!enemy?.alive;if(enemy){model.position.copy(enemy.position);model.quaternion.copy(enemy.attitude);}}
  for(const [id,mesh] of this.missiles)if(!combat.missiles.some(m=>m.id===id)){this.root.remove(mesh);this.missiles.delete(id);}
  for(const missile of combat.missiles){let mesh=this.missiles.get(missile.id);if(!mesh){mesh=this.createMissile(missile.target<0);this.root.add(mesh);this.missiles.set(missile.id,mesh);}mesh.position.copy(missile.position);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),missile.direction);}
  this.incoming.visible=!!combat.threat;
  if(combat.threat){this.incoming.position.copy(combat.threat.position);this.incoming.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),player.clone().sub(combat.threat.position).normalize());}
  this.burstMeshes.forEach((mesh,i)=>{const burst=combat.bursts[i];mesh.visible=!!burst;if(burst){mesh.position.copy(burst.position);mesh.scale.setScalar(8+burst.age*65);const material=mesh.material as THREE.MeshBasicMaterial;material.opacity=Math.max(0,1-burst.age/1.2);material.color.set(burst.age<.25?'#fff3cd':'#ed8856');}});
  if(!combat.active||combat.dead)return;
  const w=innerWidth,h=innerHeight;
  this.markers.forEach((marker,i)=>{
   const enemy=combat.enemies[i];marker.hidden=!enemy?.alive;if(!enemy?.alive)return;
   const local=enemy.position.clone().applyMatrix4(camera.matrixWorldInverse),point=enemy.position.clone().project(camera);
   const onScreen=local.z<0&&Math.abs(point.x)<.86&&Math.abs(point.y)<.76;
   let x=point.x,y=point.y;
   if(!onScreen){x=local.x;y=local.y;if(Math.hypot(x,y)<.001)y=-1;const k=Math.max(Math.abs(x)/.83,Math.abs(y)/.7);x/=k;y/=k;}
   marker.style.left=`${THREE.MathUtils.clamp((x*.5+.5)*w,90,w-90)}px`;marker.style.top=`${THREE.MathUtils.clamp((-y*.5+.5)*h,140,h-(w<700?280:110))}px`;
   const locked=combat.target===i&&combat.lock>=combat.rules.lockSeconds;
   marker.classList.toggle('locked',locked);marker.classList.toggle('offscreen',!onScreen);
   const arrow=['→','↗','↑','↖','←','↙','↓','↘'][THREE.MathUtils.euclideanModulo(Math.round(Math.atan2(y,x)/(Math.PI/4)),8)];
   marker.textContent=`${onScreen?(locked?'◆':'◇'):arrow} ${locked?'조준 완료':local.z>0?'뒤쪽 적기':'적기'} ${Math.round(enemy.position.distanceTo(player))}m`;
  });
  const nose=player.clone().addScaledVector(combat.aimDirection||new THREE.Vector3(0,0,-1).applyQuaternion(attitude),1200).project(camera);
  const reticle=document.getElementById('reticle')!;
  reticle.style.left=`${(nose.x*.5+.5)*w}px`;reticle.style.top=`${(-nose.y*.5+.5)*h}px`;
  reticle.classList.toggle('locked',combat.lock>=combat.rules.lockSeconds);
 }
}
