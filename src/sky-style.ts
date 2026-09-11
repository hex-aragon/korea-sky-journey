import { Sky } from 'three/addons/objects/Sky.js';

/** Continuous day/night dome; the dome must stay inside the camera far plane. */
export function styleSky(sky:Sky){
 sky.material.uniforms.cloudCoverage.value=0;
 sky.material.uniforms.cloudDensity.value=0;
 sky.material.depthWrite=false;
 sky.material.uniforms.skyPhoto={value:null};
 sky.material.uniforms.photoStrength={value:0};
 sky.material.uniforms.photoRotation={value:.4975};
 sky.material.fragmentShader='uniform sampler2D skyPhoto; uniform float photoStrength; uniform float photoRotation;\n'+sky.material.fragmentShader;
 // Replace the scattering output with a stable linear-light art direction.
 // Keep the library's sun direction, vertex shader and physical sky inputs.
 sky.material.fragmentShader=sky.material.fragmentShader.replace('gl_FragColor = vec4( texColor, 1.0 );',`
  float day=smoothstep(-0.14,0.13,vSunDirection.y);
  float golden=(1.0-smoothstep(0.07,0.32,vSunDirection.y))*day;
  float h=pow(clamp(direction.y,0.0,1.0),0.45);
  vec3 zenith=mix(vec3(0.003,0.009,0.026),vec3(0.045,0.205,0.48),day);
  vec3 horizon=mix(vec3(0.027,0.049,0.087),vec3(0.48,0.68,0.83),day);
  horizon=mix(horizon,vec3(0.91,0.48,0.25),golden*0.76);
  vec3 skyColor=mix(horizon,zenith,h);
  float alignment=max(dot(direction,vSunDirection),0.0);
  skyColor+=vec3(1.0,0.77,0.49)*pow(alignment,16.0)*0.12*day;
  skyColor+=vec3(6.0,4.5,2.7)*smoothstep(0.99980,0.99994,alignment)*day;
  skyColor=mix(skyColor,horizon,(1.0-smoothstep(-0.35,0.0,direction.y))*0.6);
  vec2 photoUv=vec2(fract(atan(direction.z,direction.x)/6.2831853+0.5+photoRotation),asin(clamp(direction.y,-1.0,1.0))/3.14159265+0.5);
  vec3 photographedSky=texture2D(skyPhoto,photoUv).rgb*0.7;
  photographedSky=mix(photographedSky,photographedSky*vec3(1.15,0.64,0.4),golden*0.75);
  float photoMask=smoothstep(-0.04,0.12,direction.y)*day*photoStrength*(1.0-golden*.85);
  skyColor=mix(skyColor,photographedSky,photoMask);
  gl_FragColor=vec4(skyColor,1.0);
 `);
}
