// Reproducible courses and swept crossings, independent of rendering.
export function randomFor(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function makeCourse(seed,origin,ground=(x,z)=>0){
 const random=randomFor(seed),gates=[],obstacles=[];
 let x=origin.x,z=origin.z,angle=Math.atan2(-x,3000-z)+(random()-.5)*.8;
 const start={x,y:Math.max(900+Math.floor(random()*3)*700,ground(x,z)+600),z};let y=start.y;
 for(let i=0;i<12;i++){
  angle+=(random()-.5)*.42;
  if(Math.abs(x)>4800||z<-4200||z>11200)angle=Math.atan2(-x,3000-z);
  const dx=Math.sin(angle),dz=Math.cos(angle),length=620+random()*170;
  const nx=x+dx*length,nz=z+dz*length;
  let floor=0;for(let t=0;t<=1;t+=.1)floor=Math.max(floor,ground(x+(nx-x)*t,z+(nz-z)*t));
  y=Math.max(800,Math.min(3300,y+(random()-.5)*170),floor+430);
  const gate={x:nx,y,z:nz,dx,dz,radius:155,index:i};gates.push(gate);
  // Suspended orange beacons sit beside, never inside, the gate opening.
  const side=random()>.5?1:-1,offset=220+random()*150;
  obstacles.push({x:nx-dx*210+dz*side*offset,y:y+(random()-.5)*130,z:nz-dz*210-dx*side*offset,radius:65});
  x=nx;z=nz;
 }
 // Smooth climbs while preserving every terrain clearance constraint.
 for(let i=gates.length-2;i>=0;i--)gates[i].y=Math.max(gates[i].y,gates[i+1].y-170);
 start.y=Math.max(start.y,gates[0].y-120);
 return{seed,start,heading:Math.atan2(-(gates[0].x-start.x),-(gates[0].z-start.z)),gates,obstacles:obstacles.filter(o=>gates.every(g=>Math.hypot(g.x-o.x,g.y-o.y,g.z-o.z)>g.radius+o.radius+20))};
}
function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=dx*dx+dy*dy+dz*dz;const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy,p.z-a.z-t*dz);}
export class SkyRace{
 active=false;finished=false;index=0;score=0;combo=0;passed=0;missed=0;hits=0;time=0;penalty=0;cooldown=0;gateTime=0;events=[];
 /** @type {ReturnType<typeof makeCourse>|null} */
 course=null;previous=null;
 reset(course){this.course=course;this.active=true;this.finished=false;this.index=this.score=this.combo=this.passed=this.missed=this.hits=this.time=this.penalty=this.cooldown=this.gateTime=0;this.events=[];this.previous={...course.start};}
 stop(){this.active=false;this.events=[];}
 update(player,dt){
  if(!this.active||this.finished||dt<=0)return;dt=Math.min(dt,.05);this.time+=dt;this.gateTime+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
  const a=this.previous,b=player,g=this.course.gates[this.index];
  if(this.cooldown===0&&this.course.obstacles.some(o=>distanceToSegment(o,a,b)<o.radius+12)){this.hits++;this.penalty+=3;this.combo=0;this.cooldown=2;this.events.push('collision');}
  const before=(a.x-g.x)*g.dx+(a.z-g.z)*g.dz,after=(b.x-g.x)*g.dx+(b.z-g.z)*g.dz;
  let crossed=false,passed=false;
  if(before<=0&&after>0){crossed=true;const t=-before/(after-before);passed=Math.hypot(a.x+(b.x-a.x)*t-g.x,a.y+(b.y-a.y)*t-g.y,a.z+(b.z-a.z)*t-g.z)<g.radius-12;}
  if(crossed||this.gateTime>15){
   if(passed){this.passed++;this.combo++;this.score+=100+Math.min(this.combo,10)*25;this.events.push('gate');}
   else{this.missed++;this.combo=0;this.penalty+=5;this.events.push('miss');}
   this.index++;this.gateTime=0;
   if(this.index===this.course.gates.length){this.finished=true;this.events.push('finish');}
  }
  this.previous={x:b.x,y:b.y,z:b.z};
 }
 drainEvents(){return this.events.splice(0);}
}
