import * as THREE from 'three';
export function createOcean(){
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},sunDirection:{value:new THREE.Vector3(-.6,.4,-.6)},skyColor:{value:new THREE.Color('#a6c5d6')},night:{value:0},sunset:{value:0}},vertexShader:`varying vec3 worldPosition;void main(){vec4 p=modelMatrix*vec4(position,1.);worldPosition=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
 fragmentShader:`varying vec3 worldPosition;uniform float time,night,sunset;uniform vec3 sunDirection,skyColor;
 float height(vec2 p){return sin(p.x*.038+p.y*.018+time*.7)*.38+sin(p.x*.019-p.y*.045+time*.5)*.24+sin(p.x*.087+p.y*.063-time*.9)*.09;}
 void main(){vec2 p=worldPosition.xz;float e=1.;vec3 n=normalize(vec3(height(p-vec2(e,0.))-height(p+vec2(e,0.)),1.,height(p-vec2(0.,e))-height(p+vec2(0.,e))));
 vec3 view=normalize(cameraPosition-worldPosition);float distance=length(cameraPosition-worldPosition);float fade=1.-smoothstep(1500.,15000.,distance);n=normalize(mix(vec3(0.,1.,0.),n,fade));
 float fresnel=.04+.96*pow(1.-max(dot(n,view),0.),5.);
 vec3 water=mix(vec3(.012,.065,.088),skyColor*.67,fresnel);vec3 halfway=normalize(sunDirection+view);
 float glint=pow(max(dot(n,halfway),0.),420.)*2.8+pow(max(dot(n,halfway),0.),38.)*.12;
 water+=mix(vec3(1.,.91,.68),vec3(1.,.45,.12),sunset)*glint*(1.-night);
 water*=mix(1.,.18,night);float haze=1.-exp(-distance*.000025);water=mix(water,skyColor,haze*.76);
 gl_FragColor=vec4(water,1.);
 }`});
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(140000,140000),material);ocean.rotation.x=-Math.PI/2;ocean.position.y=.2;ocean.name='Fresnel ocean';return ocean;
}
