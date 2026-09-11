import { MathUtils, Quaternion, Vector3 } from 'three';
const FORWARD = new Vector3(0, 0, -1);
export const COMBAT_RULES = Object.freeze({ lockSeconds: .75, evadeSeconds: 3, turnEscape: Math.PI / 4, rollEscape: Math.PI * .9, range: 3200, cone: Math.cos(Math.PI / 18), reload: 1.4 });
const position = p => new Vector3(p.x, p.y, p.z);

/** Arcade combat in world space. No network, weapon data, or real flight modelling. */
export class Combat {
 active = false; dead = false; time = 0; score = 0; dodges = 0;
 enemies = []; missiles = []; bursts = []; events = [];
 target = -1; lock = 0; cooldown = 0; attackIn = 8; serial = 0;
 /** @type {{source:number, remaining:number, origin:Vector3, forward:Vector3, previous:Quaternion, roll:number, position:Vector3}|null} */
 threat = null;
 reset(player, active = true) {
  this.active = active; this.dead = false; this.time = 0; this.score = 0; this.dodges = 0;
  this.enemies = []; this.missiles = []; this.bursts = []; this.events = [];
  this.target = -1; this.lock = 0; this.cooldown = 0; this.attackIn = 8; this.threat = null;
  if (active) for (let i = 0; i < 3; i++) this.enemies.push(this.spawn(i, player));
 }
 spawn(id, player) {
  const f = FORWARD.clone().applyQuaternion(player.attitude), right = new Vector3(1, 0, 0).applyQuaternion(player.attitude);
  const p = position(player).addScaledVector(f, [850, 1400, -850][id]).addScaledVector(right, [0, 420, 200][id]);
  p.y = MathUtils.clamp(p.y, 500, 5000);
  return { id, position: p, attitude: player.attitude.clone(), alive: true, respawn: 0 };
 }
 fire(player) {
  if (!this.active || this.dead || this.cooldown > 0 || this.target < 0 || this.lock < COMBAT_RULES.lockSeconds) return false;
  const enemy = this.enemies[this.target]; if (!enemy?.alive) return false;
  const direction = FORWARD.clone().applyQuaternion(player.attitude);
  this.missiles.push({ id: ++this.serial, position: position(player).addScaledVector(direction, 30), direction, target: this.target, age: 0 });
  this.cooldown = COMBAT_RULES.reload; this.events.push('launch'); return true;
 }
 startThreat(enemy, player) {
  this.threat = { source: enemy.id, remaining: COMBAT_RULES.evadeSeconds, origin: position(player), forward: FORWARD.clone().applyQuaternion(player.attitude), previous: player.attitude.clone(), roll: 0, position: enemy.position.clone() };
  this.events.push('warning');
 }
 update(player, delta, ground = (_x, _z) => 0) {
  const dt = MathUtils.clamp(delta, 0, .05);
  if (!this.active || !dt) return;
  this.bursts = this.bursts.filter(b => (b.age += dt) < 1.2);
  if (this.dead) return;
  this.time += dt; this.cooldown = Math.max(0, this.cooldown - dt);
  const p = position(player), f = FORWARD.clone().applyQuaternion(player.attitude);
  for (const enemy of this.enemies) {
   if (!enemy.alive) { enemy.respawn -= dt; if (enemy.respawn <= 0) Object.assign(enemy, this.spawn(enemy.id, player)); continue; }
   if (enemy.position.distanceTo(p) > 5500) Object.assign(enemy, this.spawn(enemy.id, player));
   const destination = p.clone().addScaledVector(f, 700 + enemy.id * 120);
   destination.x += Math.sin(this.time * .3 + enemy.id * 2) * (enemy.id === 0 ? 80 : 450);
   destination.y += Math.sin(this.time * .25 + enemy.id) * 180;
   const heading = destination.sub(enemy.position).normalize();
   const desired = new Quaternion().setFromUnitVectors(FORWARD, heading);
   enemy.attitude.rotateTowards(desired, dt * .65);
   const velocity = FORWARD.clone().applyQuaternion(enemy.attitude);
   enemy.position.addScaledVector(velocity, (enemy.id === 0 ? 245 : 290) * dt);
   enemy.position.y = MathUtils.clamp(enemy.position.y, ground(enemy.position.x, enemy.position.z) + 150, 5700);
  }
  // Acquire only what the aircraft nose points at; the camera may lag during turns.
  let candidate = -1, best = COMBAT_RULES.cone;
  for (const enemy of this.enemies) {
   const to = enemy.position.clone().sub(p), distance = to.length();
   const alignment = distance > 0 ? to.divideScalar(distance).dot(f) : 0;
   if (enemy.alive && distance < COMBAT_RULES.range && alignment > best) { candidate = enemy.id; best = alignment; }
  }
  if (candidate !== this.target) { this.target = candidate; this.lock = 0; }
  if (candidate >= 0) {
   const wasLocked = this.lock >= COMBAT_RULES.lockSeconds;
   this.lock = Math.min(COMBAT_RULES.lockSeconds, this.lock + dt);
   if (!wasLocked && this.lock >= COMBAT_RULES.lockSeconds) this.events.push('locked');
  } else this.lock = 0;
  for (const missile of this.missiles) {
   missile.age += dt; if(missile.target<0){missile.position.addScaledVector(missile.direction,950*dt);continue;} const enemy = this.enemies[missile.target];
   if (!enemy?.alive) { missile.age = 7; continue; }
   const to = enemy.position.clone().sub(missile.position), distance = to.length();
   missile.direction.lerp(to.clone().normalize(), 1 - Math.exp(-dt * 8)).normalize();
   const travel = 950 * dt;
   // Swept proximity prevents a fast missile skipping a small target between frames.
   const segment = missile.direction.clone().multiplyScalar(travel);
   const closest = segment.clone().multiplyScalar(MathUtils.clamp(to.dot(segment) / segment.lengthSq(), 0, 1));
   if (distance < 32 || closest.distanceTo(to) < 32) {
    enemy.alive = false; enemy.respawn = 4; missile.age = 7; this.score++;
    this.bursts.push({ position: enemy.position.clone(), age: 0 }); this.events.push('hit');
    if (this.target === enemy.id) { this.target = -1; this.lock = 0; }
    if (this.threat?.source === enemy.id) this.escape();
   } else missile.position.add(segment);
  }
  this.missiles = this.missiles.filter(m => m.age < 6);
  if (this.threat) {
   const threat = this.threat;
   const elapsed = COMBAT_RULES.evadeSeconds - threat.remaining;
   const relative = threat.previous.clone().invert().multiply(player.attitude);
   if (relative.w < 0) relative.set(-relative.x, -relative.y, -relative.z, -relative.w);
   // Signed roll accumulation: shaking the keys cannot replace a committed roll.
   threat.roll += 2 * Math.atan2(relative.z, relative.w); threat.previous.copy(player.attitude);
   const offset = p.clone().sub(threat.origin); offset.addScaledVector(threat.forward, -offset.dot(threat.forward));
   const escaped = f.angleTo(threat.forward) >= COMBAT_RULES.turnEscape || Math.abs(threat.roll) >= COMBAT_RULES.rollEscape || offset.length() > 220;
   const remaining = Math.max(0, threat.remaining - dt);
   threat.position.lerp(p, Math.min(1, dt / Math.max(dt, threat.remaining)));
   // Crossing the deadline on this frame is a hit; only earlier evasion succeeds.
   if (escaped && elapsed + dt < COMBAT_RULES.evadeSeconds) this.escape();
   else if (remaining <= 1e-8) {
    this.dead = true; this.threat = null; this.missiles = []; this.events.push('death');
    this.bursts.push({ position: p.clone(), age: 0 });
   } else threat.remaining = remaining;
  } else {
   this.attackIn -= dt;
   if (this.attackIn <= 0) {
    const attacker = this.enemies.find(e => e.alive && e.position.distanceTo(p) < 2600 && FORWARD.clone().applyQuaternion(e.attitude).dot(p.clone().sub(e.position).normalize()) > .35);
    if (attacker) this.startThreat(attacker, player);
   }
  }
 }
 escape() { if(this.threat)this.missiles.push({id:++this.serial,position:this.threat.position.clone(),direction:this.threat.forward.clone(),target:-1,age:4.8});this.threat = null; this.attackIn = 7; this.dodges++; this.events.push('evaded'); }
 drainEvents() { return this.events.splice(0); }
}
