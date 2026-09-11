import * as THREE from 'three';
export function createOcean(){
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},wind:{value:9},sunDirection:{value:new THREE.Vector3(-.6,.4,-.6)},skyColor:{value:new THREE.Color('#b8d7eb')},night:{value:0},sunset:{value:0}},vertexShader:`varying vec3 worldPosition;void main(){vec4 p=modelMatrix*vec4(position,1.);worldPosition=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
 fragmentShader:`varying vec3 worldPosition;uniform float time,wind,night,sunset;uniform vec3 sunDirection,skyColor;
 float wave(vec2 p){
  float t=time*(.5+wind*.025);
  return sin(dot(p,vec2(.041,.019))+t)*.26
   +sin(dot(p,vec2(-.028,.037))+t*.87)*.19
   +sin(dot(p,vec2(.064,-.079))-t*1.2)*.10
   +sin(dot(p,vec2(.133,.092))+t*1.7)*.04
   +sin(dot(p,vec2(-.173,.151))-t*2.1)*.025;
 }
 void main(){vec2 p=worldPosition.xz;float e=1.;
 vec3 n=normalize(vec3(wave(p-vec2(e,0.))-wave(p+vec2(e,0.)),.9,wave(p-vec2(0.,e))-wave(p+vec2(0.,e))));
 vec3 view=normalize(cameraPosition-worldPosition);float distance=length(cameraPosition-worldPosition);
 float fade=1.-smoothstep(700.,10000.,distance);n=normalize(mix(vec3(0.,1.,0.),n,fade));
 float fresnel=.025+.975*pow(1.-max(dot(n,view),0.),4.);
 vec3 reflected=mix(vec3(.055,.18,.29),skyColor,max(0.,1.-reflect(-view,n).y));
 vec3 water=mix(vec3(.012,.08,.105),reflected,fresnel*.85);
 vec3 halfway=normalize(sunDirection+view);
 float glint=pow(max(dot(n,halfway),0.),220.)*.65+pow(max(dot(n,halfway),0.),24.)*.06;
 water+=mix(vec3(1.,.91,.74),vec3(1.,.45,.17),sunset)*glint*(1.-night);
 water*=mix(1.,.22,night);
 float haze=1.-exp(-distance*.00010);water=mix(water,skyColor,haze);
 gl_FragColor=vec4(water,1.);
 }`});
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(140000,140000),material);ocean.rotation.x=-Math.PI/2;ocean.position.y=.2;ocean.name='Wind-driven ocean';return ocean;
}
