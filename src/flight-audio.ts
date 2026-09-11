/** Layered stereo jet and airflow synthesis, entirely local and sample-free. */
export class FlightAudio {
 private context?:AudioContext;
 private master?:GainNode;
 private turbines:OscillatorNode[]=[];
 private rumble?:OscillatorNode;
 private air?:BiquadFilterNode;
 private roar?:GainNode;
 private windGain?:GainNode;
 private burnerGain?:GainNode;
 private pan?:StereoPannerNode;
 enabled=false;volume=.55;
 silence(){if(this.context&&this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.05);}
 async toggle(){return this.setEnabled(!this.enabled);}
 async setEnabled(on:boolean){
  if(!on&&!this.context){this.enabled=false;return false;}
  if(!this.context){
   const ctx=this.context=new AudioContext();const master=this.master=ctx.createGain();master.gain.value=0;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=18;limiter.ratio.value=6;limiter.attack.value=.008;limiter.release.value=.18;master.connect(limiter);limiter.connect(ctx.destination);
   for(const side of [-1,1]){const tone=ctx.createOscillator();tone.type='sine';const tg=ctx.createGain();tg.gain.value=.045;const p=ctx.createStereoPanner();p.pan.value=side*.3;tone.connect(tg);tg.connect(p);p.connect(master);tone.start();this.turbines.push(tone);}
   const rumble=this.rumble=ctx.createOscillator();rumble.type='triangle';const rg=ctx.createGain();rg.gain.value=.13;rumble.connect(rg);rg.connect(master);rumble.start();
   const buffer=ctx.createBuffer(2,ctx.sampleRate*5,ctx.sampleRate);
   for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
   const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
   const engine=ctx.createBiquadFilter();engine.type='lowpass';engine.frequency.value=320;const roar=this.roar=ctx.createGain();noise.connect(engine);engine.connect(roar);roar.connect(master);
   const air=this.air=ctx.createBiquadFilter();air.type='bandpass';air.Q.value=.45;const windGain=this.windGain=ctx.createGain();const pan=this.pan=ctx.createStereoPanner();noise.connect(air);air.connect(windGain);windGain.connect(pan);pan.connect(master);
   const burner=ctx.createBiquadFilter();burner.type='lowpass';burner.frequency.value=1100;const burnerGain=this.burnerGain=ctx.createGain();burnerGain.gain.value=0;noise.connect(burner);burner.connect(burnerGain);burnerGain.connect(master);noise.start();
  }
  this.enabled=on;if(!on)this.silence();
  await this.context.resume();return this.enabled;
 }
 cue(kind:string){
  const ctx=this.context;if(!ctx||!this.master||!this.enabled)return;
  const tone=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
  const frequency=kind==='warning'?880:kind==='locked'?1320:kind==='evaded'?660:kind==='hit'?95:190;
  tone.type=kind==='hit'||kind==='launch'?'sawtooth':'sine';tone.frequency.setValueAtTime(frequency,t);tone.frequency.exponentialRampToValueAtTime(kind==='launch'?65:frequency*.7,t+.16);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(kind==='warning'?.22:.15,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+.19);
  tone.connect(gain);gain.connect(this.master);tone.start(t);tone.stop(t+.2);tone.onended=()=>{tone.disconnect();gain.disconnect();};
 }
 update(speed:number,boost:number,throttle:number,paused:boolean,cockpit:boolean,load=1,roll=0,gust=0){
  const ctx=this.context;if(!ctx||!this.master)return;const t=ctx.currentTime,velocity=Math.min(1,speed/540),strain=Math.min(1,(load-1)/6);
  this.master.gain.setTargetAtTime(this.enabled&&!paused?this.volume*(cockpit?.55:.8):0,t,.15);
  this.turbines.forEach((tone,i)=>tone.frequency.setTargetAtTime(135+throttle*225+boost*100+i*3.7,t,.38));
  this.rumble!.frequency.setTargetAtTime(32+speed*.045+boost*12,t,.25);
  this.air!.frequency.setTargetAtTime((cockpit?450:1000)+velocity*1800+strain*600,t,.15);
  this.roar!.gain.setTargetAtTime(.45+throttle*.45,t,.3);
  this.windGain!.gain.setTargetAtTime(.025+velocity*velocity*.19+strain*.1+gust*.08,t,.1);
  this.burnerGain!.gain.setTargetAtTime(boost*.42,t,.1);
  this.pan!.pan.setTargetAtTime(Math.max(-.65,Math.min(.65,roll*.14)),t,.12);
 }
}
