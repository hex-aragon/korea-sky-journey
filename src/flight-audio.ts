/** Entirely synthesized locally; no samples, downloads, or paid audio service. */
export class FlightAudio {
 private context?:AudioContext;
 private master?:GainNode;
 private turbine?:OscillatorNode;
 private rumble?:OscillatorNode;
 private air?:BiquadFilterNode;
 private roar?:GainNode;
 enabled=false;
 async toggle(){
  if(!this.context){
   const ctx=this.context=new AudioContext();const master=this.master=ctx.createGain();master.gain.value=0;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=5;master.connect(limiter);limiter.connect(ctx.destination);
   const tone=this.turbine=ctx.createOscillator();tone.type='sine';const tg=ctx.createGain();tg.gain.value=.065;tone.connect(tg);tg.connect(master);tone.start();
   const rumble=this.rumble=ctx.createOscillator();rumble.type='triangle';const rg=ctx.createGain();rg.gain.value=.07;rumble.connect(rg);rg.connect(master);rumble.start();
   const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let previous=0;
   for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.04)/1.03;data[i]=previous*6;}
   const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const air=this.air=ctx.createBiquadFilter();air.type='lowpass';air.Q.value=.5;const roar=this.roar=ctx.createGain();noise.connect(air);air.connect(roar);roar.connect(master);noise.start();
  }
  this.enabled=!this.enabled;await this.context.resume();return this.enabled;
 }
 update(speed:number,boost:number,throttle:number,paused:boolean,cockpit:boolean){
  const ctx=this.context;if(!ctx||!this.master)return;const t=ctx.currentTime;
  this.master.gain.setTargetAtTime(this.enabled&&!paused?(cockpit?.3:.48):0,t,.12);
  this.turbine!.frequency.setTargetAtTime(170+throttle*190+boost*130,t,.2);
  this.rumble!.frequency.setTargetAtTime(35+speed*.065,t,.25);
  this.air!.frequency.setTargetAtTime((cockpit?400:700)+speed*2.8+boost*850,t,.25);
  this.roar!.gain.setTargetAtTime(.25+speed/650+boost*.6,t,.15);
 }
}
