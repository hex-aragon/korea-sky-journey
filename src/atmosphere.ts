import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// Depth-aware, half-resolution volumetric clouds. All samples live in world
// space, so climbing through the cloud layer changes the actual perspective.
export class Atmosphere {
 private sceneTarget:THREE.WebGLRenderTarget;
 private cloudTarget:THREE.WebGLRenderTarget;
 private cloud:THREE.ShaderMaterial;
 private composite:THREE.ShaderMaterial;
 private quad:FullScreenQuad;
 private time=0;
 private cover=.22;
 private drift=new THREE.Vector2();
 constructor(private renderer:THREE.WebGLRenderer){
  this.sceneTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});this.sceneTarget.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  this.cloudTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  const size=64,data=new Uint8Array(size**3),noise=new ImprovedNoise();let i=0;
  // Blend opposite samples to make the repeat volume seamless. Abrupt edges
  // in the old non-periodic volume produced rectangular cloud walls.
  const smooth=(v:number)=>v*v*(3-2*v);
  const periodic=(x:number,y:number,z:number,scale:number)=>{
   const u=smooth(x/size),v=smooth(y/size),w=smooth(z/size);let sum=0;
   for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)sum+=noise.noise((x-a*size)/scale,(y-b*size)/scale,(z-c*size)/scale)*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);
   return sum;
  };
  for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const v=periodic(x,y,z,13)*.65+periodic(x,y,z,6)*.25+periodic(x,y,z,2.8)*.1;data[i++]=Math.round(THREE.MathUtils.clamp(v*.9+.5,0,1)*255);
  }
  const tex=new THREE.Data3DTexture(data,size,size,size);tex.format=THREE.RedFormat;tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.wrapS=tex.wrapT=tex.wrapR=THREE.RepeatWrapping;tex.unpackAlignment=1;tex.needsUpdate=true;
  const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
  this.cloud=new THREE.ShaderMaterial({uniforms:{depthMap:{value:this.sceneTarget.depthTexture},noiseMap:{value:tex},inverseProjection:{value:new THREE.Matrix4()},cameraWorld:{value:new THREE.Matrix4()},eye:{value:new THREE.Vector3()},sunDirection:{value:new THREE.Vector3(-.6,.4,-.6)},coverage:{value:.22},night:{value:0},sunset:{value:0},drift:{value:this.drift},steps:{value:48}},vertexShader,depthWrite:false,depthTest:false,
  fragmentShader:`precision highp sampler3D;
  varying vec2 vUv;uniform sampler2D depthMap;uniform sampler3D noiseMap;uniform mat4 inverseProjection,cameraWorld;uniform vec3 eye,sunDirection;uniform float coverage,night,sunset;uniform vec2 drift;uniform int steps;
  float density(vec3 p){
    float h=(p.y-1200.)/1500.;if(h<0.||h>1.)return 0.;
    vec3 q=(p+vec3(drift.x,0.,drift.y))*.00011;
    float broad=texture(noiseMap,q).r;
    float detail=texture(noiseMap,q*3.1+vec3(.1,.2,.3)).r;
    float shape=broad*.62+detail*.38;
    float profile=smoothstep(0.,.14,h)*(1.-smoothstep(.48,1.,h));
    float threshold=mix(.65,.39,coverage)+h*.15-.045;
    float patchNoise=texture(noiseMap,vec3(q.x*.85,.36,q.z*.85)).r;
    float patchThreshold=mix(.59,.32,coverage);
    float coverageMask=smoothstep(patchThreshold,patchThreshold+.12,patchNoise);
    return clamp((shape-threshold)*8.,0.,1.)*profile*coverageMask;
  }
  void main(){
    vec4 v=inverseProjection*vec4(vUv*2.-1.,1.,1.);vec3 ray=normalize((cameraWorld*vec4(normalize(v.xyz/v.w),0.)).xyz);
    float depth=texture2D(depthMap,vUv).r;
    vec4 world=cameraWorld*inverseProjection*vec4(vUv*2.-1.,depth*2.-1.,1.);float sceneDistance=depth>.999999?45000.:length(world.xyz/world.w-eye);
    float ry=abs(ray.y)<0.0001?0.0001:ray.y;
    float a=(1200.-eye.y)/ry,b=(2700.-eye.y)/ry;
    float start=max(0.,min(a,b)),end=min(min(max(a,b),sceneDistance),16000.);
    if(end<=start){gl_FragColor=vec4(0.);return;}
    float stride=(end-start)/float(steps),jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    float trans=1.;vec3 light=vec3(0.);
    float towardSun=pow(max(dot(ray,sunDirection),0.),8.);
    for(int i=0;i<64;i++){
      if(i>=steps||trans<.015)break;
      vec3 p=eye+ray*(start+(float(i)+jitter)*stride);float d=density(p);
      if(d>.002){
        float shadow=density(p+sunDirection*160.)*.7+density(p+sunDirection*420.)*.3;
        float h=clamp((p.y-1200.)/1500.,0.,1.);
        vec3 base=mix(vec3(.28,.39,.56),vec3(1.3,1.34,1.39),clamp(h*.56+(1.-shadow)*.62,0.,1.));
        base+=vec3(1.,.92,.79)*towardSun*.75*(1.-shadow);
        base=mix(base,base*vec3(1.15,.64,.38),sunset*.8);
        base=mix(base,base*vec3(.035,.06,.10),night*.98);
        float opacity=1.-exp(-d*stride*.0045);
        light+=trans*opacity*base;trans*=1.-opacity;
      }
    }
    float distantFade=exp(-start*.000065);gl_FragColor=vec4(light*distantFade,(1.-trans)*distantFade);
  }`});
  this.composite=new THREE.ShaderMaterial({uniforms:{sceneMap:{value:this.sceneTarget.texture},cloudMap:{value:this.cloudTarget.texture},cloudTexel:{value:new THREE.Vector2()},sunScreen:{value:new THREE.Vector3()},sunset:{value:0},night:{value:0}},vertexShader,depthWrite:false,depthTest:false,
  fragmentShader:`varying vec2 vUv;uniform sampler2D sceneMap,cloudMap;uniform vec2 cloudTexel;uniform vec3 sunScreen;uniform float sunset,night;
  void main(){vec3 color=texture2D(sceneMap,vUv).rgb;vec4 cloud=texture2D(cloudMap,vUv)*4.;
   cloud+=(texture2D(cloudMap,vUv+vec2(cloudTexel.x,0.))+texture2D(cloudMap,vUv-vec2(cloudTexel.x,0.))+texture2D(cloudMap,vUv+vec2(0.,cloudTexel.y))+texture2D(cloudMap,vUv-vec2(0.,cloudTexel.y)))*2.;
   cloud+=texture2D(cloudMap,vUv+cloudTexel)+texture2D(cloudMap,vUv-cloudTexel)+texture2D(cloudMap,vUv+vec2(cloudTexel.x,-cloudTexel.y))+texture2D(cloudMap,vUv+vec2(-cloudTexel.x,cloudTexel.y));cloud/=16.;color=color*(1.-cloud.a)+cloud.rgb;
   float halo=exp(-length((vUv-sunScreen.xy)*vec2(1.6,1.))*7.)*sunScreen.z*(1.-night)*(1.-cloud.a);
   color+=vec3(1.,.67,.33)*halo*.055;
   float vignette=1.-smoothstep(.25,.85,length(vUv-.5));color*=mix(.91,1.,vignette);
   gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});this.quad=new FullScreenQuad(this.cloud);this.resize();
 }
 resize(low=false){const size=this.renderer.getDrawingBufferSize(new THREE.Vector2());this.sceneTarget.setSize(size.x,size.y);this.cloudTarget.setSize(Math.max(1,Math.floor(size.x*(low?.4:.7))),Math.max(1,Math.floor(size.y*(low?.4:.7))));this.cloud.uniforms.steps.value=low?32:56;this.composite.uniforms.cloudTexel.value.set(1.4/this.cloudTarget.width,1.4/this.cloudTarget.height);}
 render(scene:THREE.Scene,camera:THREE.PerspectiveCamera,dt:number,weather:{cloud:number;wind:number;direction:number;day:boolean},sun:THREE.Vector3,sunset:boolean){
  this.time+=dt;this.cover=THREE.MathUtils.damp(this.cover,.06+weather.cloud/100*.91,.45,dt);this.drift.x+=Math.sin(weather.direction*Math.PI/180)*weather.wind*dt*.5;this.drift.y-=Math.cos(weather.direction*Math.PI/180)*weather.wind*dt*.5;
  camera.updateMatrixWorld(true);const u=this.cloud.uniforms;u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);u.eye.value.copy(camera.position);u.coverage.value=this.cover;u.night.value=weather.day?0:1;u.sunset.value=sunset?1:0;u.sunDirection.value.copy(sun);
  const p=camera.position.clone().addScaledVector(sun,20000).project(camera);this.composite.uniforms.sunScreen.value.set(p.x*.5+.5,p.y*.5+.5,p.z<1?1:0);this.composite.uniforms.night.value=weather.day?0:1;
  const tone=this.renderer.toneMapping;this.renderer.toneMapping=THREE.NoToneMapping;
  this.renderer.setRenderTarget(this.sceneTarget);this.renderer.render(scene,camera);
  this.quad.material=this.cloud;this.renderer.setRenderTarget(this.cloudTarget);this.quad.render(this.renderer);
  this.renderer.toneMapping=tone;this.quad.material=this.composite;this.renderer.setRenderTarget(null);this.quad.render(this.renderer);
 }
}
