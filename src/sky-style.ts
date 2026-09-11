import { Sky } from 'three/addons/objects/Sky.js';

/** Keep atmospheric scattering and the sun, with a clear blue upper sky. */
export function styleSky(sky:Sky){
 sky.material.uniforms.cloudCoverage.value=0;
 sky.material.uniforms.cloudDensity.value=0;
 sky.material.fragmentShader=sky.material.fragmentShader.replace('gl_FragColor = vec4( texColor, 1.0 );',`
  float daylight=smoothstep(-0.08,0.12,vSunDirection.y);
  float warmth=1.0-smoothstep(0.04,0.25,vSunDirection.y);
  float elevation=pow(max(direction.y,0.0),0.38);
  vec3 clearSky=mix(vec3(0.51,0.69,0.85),vec3(0.025,0.15,0.36),elevation);
  vec3 eveningSky=mix(vec3(0.91,0.39,0.19),vec3(0.065,0.15,0.32),pow(max(direction.y,0.0),0.3));
  clearSky=mix(clearSky,eveningSky,warmth*0.85);
  vec3 graded=mix(texColor*0.46,clearSky,daylight*0.68);
  graded+=vec3(1.0,0.84,0.62)*pow(max(dot(direction,vSunDirection),0.0),1800.0)*daylight*0.7;
  gl_FragColor=vec4(graded,1.0);
 `);
}
