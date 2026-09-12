import * as THREE from 'three';
import { World, polygons } from './world';
import { Atmosphere } from './atmosphere';
import { cities, positions } from './data';
import { demoWeather, fetchWeather, weatherName } from './weather.mjs';
import { damp, approachAltitude } from './flight.mjs';
import { createAttitude, stepJet } from './jet-flight.mjs';
import { JetEffects } from './jet-effects';
import { FlightAudio } from './flight-audio';
import { FlightFeel } from './flight-feel.mjs';
import { aircraftChoices, aircraftById } from './aircraft.mjs';
import { Combat } from './combat.mjs';
import { CombatView } from './combat-view';
import { Cockpit } from './cockpit';
import { SkyRace, makeCourse } from './race.mjs';
import { SkyRaceView } from './sky-race-view';
import { SkyLife } from './sky-life';
import { Minimap } from './minimap';
import './style.css';
const icons:Record<string,string>={plane:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',camera:'<path d="M5 7h3l2-3h4l2 3h3a2 2 0 0 1 2 2v10H3V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/>',volume:'<path d="m11 5-5 4H3v6h3l5 4Zm4 3a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14"/>',mute:'<path d="m11 5-5 4H3v6h3l5 4Zm5 4 5 6m0-6-5 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',view:'<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',cloud:'<path d="M6 19a5 5 0 1 1 0-10 7 7 0 0 1 13-1 5 5 0 0 1 0 11Z"/>'};
function icon(name:string){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.plane}</svg>`;}
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<canvas id="scene" aria-label="대한민국의 도시와 해안을 비행하는 3D 세계"></canvas><div id="shade"></div>
<div id="loading"><div class="spinner"></div><strong>바람결</strong><p id="loading-text">하늘을 준비하고 있어요.</p></div>
<header class="brand">바람결</header>
<div class="destination"><span id="region">서울의 하늘</span><h2 id="city-title">서울</h2><p id="city-description">한강을 따라 흐르는 도시의 아침</p></div>
<section class="intro" id="intro"><p>KESTREL · FREE FLIGHT</p><h1>하늘의 한계를 넘어.</h1><div class="game-modes" aria-label="시작할 비행 모드"><button data-game-mode="healing" aria-pressed="true">힐링 비행</button><button data-game-mode="combat" aria-pressed="false">전투 비행</button><button data-game-mode="race" aria-pressed="false">하늘 레이싱</button></div><label class="aircraft-choice intro-aircraft"><span>기체</span><select id="intro-aircraft" aria-label="시작 기체 선택">${aircraftChoices.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></label><label class="combat-level" hidden>전투 난이도 <select data-combat-level aria-label="시작 전투 난이도"><option value="easy">하 · 넓은 조준, 회피 5초</option><option value="medium">중 · 회피 3초</option><option value="hard">상 · 빠른 적, 회피 2.5초</option></select></label><p id="mode-description">전투 없이, 한국의 하늘을 자유롭게.</p><button class="primary" id="start" aria-label="하늘 여행 시작">날아보기 ${icon('arrow')}</button><small class="desktop-hint">W/S 기수 · A/D 선회 · Q/E 회전<br>Shift 가속 · Space 부스터 · R 수평 복귀</small><small class="touch-hint">화면 버튼을 길게 눌러 조종하세요.<br>BOOST 가속 · 수평 자세 복귀</small><label class="start-audio"><input type="checkbox" id="start-audio" checked> 엔진·바람 소리 켜고 시작</label></section>
<nav class="flight-dock" aria-label="비행 메뉴"><button id="settings-button" aria-label="여행 메뉴 열기" aria-expanded="false" aria-controls="settings">${icon('compass')}<span>여행</span></button></nav>
<div class="jet-telemetry"><strong id="jet-speed">900</strong><small>KM/H</small><span id="jet-power">THR 65%</span></div><div id="flight-hint">W/S 기수 · A/D 선회 · Q/E 롤 · Space 부스터 · R 수평</div>
<div id="landmark" class="landmark-label" hidden></div>
<section class="drawer" id="settings" aria-labelledby="settings-title" hidden>
 <div class="drawer-head"><h2 id="settings-title">어떻게 날아볼까요?</h2><button class="control-button" data-close aria-label="닫기">${icon('close')}</button></div>
 <div class="game-modes menu-modes" aria-label="비행 모드 변경"><button data-game-mode="healing" aria-pressed="true">힐링 모드</button><button data-game-mode="combat" aria-pressed="false">전투 모드</button><button data-game-mode="race" aria-pressed="false">레이싱</button></div><label class="field combat-level" hidden><span>전투 난이도 <small>변경하면 새 전투 시작</small></span><select data-combat-level aria-label="전투 난이도"><option value="easy">하 · 넓은 조준, 회피 5초</option><option value="medium">중 · 회피 3초</option><option value="hard">상 · 빠른 적, 회피 2.5초</option></select></label><label class="field"><span>기체 선택 <small id="aircraft-status">Kestrel</small></span><select id="aircraft-select" aria-label="기체 선택">${aircraftChoices.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></label><div class="flight-actions"><button class="mode-button" id="mode" aria-pressed="false">${icon('compass')}<span>직접 조종</span></button><button class="control-button" id="pause" aria-label="일시정지" title="일시정지">${icon('pause')}</button><button class="control-button" id="view" aria-label="시점 변경" title="시점 변경">${icon('view')}</button><button class="control-button" id="sound" aria-label="엔진 소리 켜기" title="엔진과 바람 소리">${icon('mute')}</button><button class="control-button" id="cinema" aria-label="풍경만 보기" title="풍경만 보기">${icon('camera')}</button></div>
 <div class="altitude-choice"><button data-altitude="450">도시 가까이</button><button data-altitude="3300">구름 위로</button></div>
 <label class="altitude-field"><span>비행 고도 <span id="height">450</span> m</span><input id="altitude" type="range" min="100" max="6000" step="10" value="1100" aria-label="목표 비행 고도"></label>
 <button class="route-link" id="shuffle-sky">새로운 하늘 만나기 ↗</button><button class="route-link" id="airport-tour">공항 저공 비행 ${icon('plane')}</button><button class="route-link" id="destinations-button">다른 도시로 ${icon('arrow')}</button>
 <label class="field"><span>소리 크기</span><input id="sound-volume" type="range" min="0" max="100" value="55" aria-label="소리 크기"></label><label class="field"><span>비행 진동 효과</span><input id="motion-strength" type="range" min="0" max="100" value="55" aria-label="비행 진동 효과"></label><p>Q/E를 길게 누르면 연속 롤, W를 길게 누르면 루프. R로 수평 복귀합니다.</p><details class="preferences"><summary>날씨와 비행 설정</summary>
  <div class="weather-card"><span class="weather-icon">${icon('sun')}</span><div><strong id="weather-title">서울 · 날씨 확인 중</strong><small id="weather-status">현재 날씨 연결 중</small></div></div>
  <label class="field"><span>날씨</span><select id="weather-mode"><option value="live">도시의 현재 날씨</option><option value="clear" selected>맑은 날</option><option value="cloudy">구름 가득한 날</option><option value="rain">비 오는 날</option><option value="sunset">노을 진 하늘</option><option value="night">별이 뜬 밤</option><option value="snow">눈 내리는 날</option></select></label>
  <label class="field"><span>여행 속도 <small><span id="speed">0</span> km/h</small></span><select id="cruise" aria-label="여행 속도"><option value="150">느긋한 순항</option><option value="240" selected>전투기 순항</option><option value="340">고속 순항</option></select></label>
  <label class="field"><span>화면 품질</span><select id="quality"><option value="auto" selected>자동 · 기기에 맞게</option><option value="high">선명하게</option><option value="low">가볍게 · 모바일 권장</option></select></label>
  <div class="weather-details" id="weather-details">현재 날씨를 확인하고 있어요.</div><button class="small-action" id="refresh-weather">날씨 새로고침</button>
 </details>
 <details><summary>조작 안내와 출처</summary><p>W / ↑ 기수 올리기 · S / ↓ 기수 내리기<br>A / D 또는 ← / → 선회<br>Q / E 좌우 360° 롤 · W를 계속 누르면 루프<br>Shift 스로틀 증가 · X 감속 / 브레이크<br>Space 누르는 동안 애프터버너<br>R 수평 복귀 · C 시점 · P 일시정지 · H 화면 숨기기<br>고도 선택은 자동 여행으로 전환합니다.<br>모바일은 방향·롤·BOOST 버튼을 누르고 조종합니다.</p><p>현재 날씨를 바탕으로 구름과 바람을 연출합니다. 실제 항공 정보가 아닙니다. 거리와 높이는 축약했으며 건물은 재구성한 모형입니다.</p><div class="credits"><a href="https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky" target="_blank" rel="noopener noreferrer">하늘 Poly Haven · CC0</a><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">날씨 Open-Meteo</a><a href="https://earthobservatory.nasa.gov/features/BlueMarble" target="_blank" rel="noopener noreferrer">위성영상 NASA</a><a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener noreferrer">고도 Mapzen / USGS</a><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">지도 Natural Earth</a></div></details>
</section>
<section class="drawer" id="destinations" aria-labelledby="destinations-title" hidden><div class="drawer-head"><h2 id="destinations-title">다음 풍경</h2><button class="control-button" data-close aria-label="닫기">${icon('close')}</button></div><div class="map-title"><span>한국의 세 바다를 따라</span><span id="visited-count">0 / 10</span></div><canvas id="map" width="424" height="462" aria-label="서울에서 한국의 서해 남해 동해를 잇는 비행 지도"></canvas><div id="city-list"></div><button class="small-action" id="back-settings">비행 설정으로</button></section>
<div class="touch-controls"><button data-key="q" aria-label="왼쪽 롤">↶</button><button data-key="ArrowLeft" aria-label="왼쪽 선회">←</button><button data-key="ArrowRight" aria-label="오른쪽 선회">→</button><button data-key="ArrowUp" aria-label="상승">↑</button><button data-key="ArrowDown" aria-label="하강">↓</button><button data-key="e" aria-label="오른쪽 롤">↷</button><button data-key=" " aria-label="부스터">BOOST</button><button data-key="r" aria-label="수평 복귀">수평</button></div>
<aside id="mini-map" aria-label="현재 비행 위치"><canvas id="mini-map-canvas" width="280" height="280" aria-label="북쪽이 위인 현재 위치와 다음 게이트 지도"></canvas><span id="mini-location">서울 주변</span></aside><div id="race-hud" hidden><span id="race-course"></span><strong id="race-progress"></strong><span id="race-points"></span><small id="race-direction"></small></div><section class="combat-result" id="race-result" role="dialog" aria-modal="true" aria-labelledby="race-result-title" hidden><p id="race-result-title">코스 완주</p><h2 id="race-total"></h2><p id="race-summary"></p><p id="race-countdown"></p><div><button class="primary" id="race-next">다음 랜덤 코스</button><button class="primary" id="race-healing">편안한 비행으로</button></div></section><div id="combat-hud" hidden><div id="reticle" aria-hidden="true"><span></span></div><div class="combat-score" id="combat-score">격추 0 · 회피 0</div><div class="combat-warning" id="combat-warning" hidden><strong id="threat-time"></strong><span>45° 급선회 또는 Q/E 반 바퀴 롤로 회피</span></div><div class="combat-weapon"><button id="reset-aim">기수로 조준</button><span id="lock-status">적기를 기수 조준선에 맞추세요</span><button id="fire-missile" disabled>미사일 발사 <kbd>F</kbd></button></div></div><section class="combat-result" id="combat-result" role="dialog" aria-modal="true" aria-labelledby="combat-result-title" hidden><p>비행 종료</p><h2 id="combat-result-title">기체가 격추되었습니다.</h2><p id="combat-result-score"></p><p>다음에는 경고 시간이 끝나기 전에 급선회하거나 롤을 해 보세요.</p><div><button class="primary" id="combat-retry">다시 출격</button><button class="primary" id="combat-healing">힐링 비행으로</button></div></section><div class="paused-badge" id="paused" hidden><strong>잠시 머물러요.</strong><button class="primary" id="resume">이어서 날기 ${icon('play')}</button></div><div class="toast" id="toast" role="status" hidden></div><button class="cinema-exit" id="cinema-exit" aria-label="메뉴 다시 보기">${icon('compass')}</button>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let renderer:THREE.WebGLRenderer;
try{renderer=new THREE.WebGLRenderer({canvas:$<HTMLCanvasElement>('scene'),antialias:true,powerPreference:'high-performance'});}catch{$('loading-text').textContent='3D 화면을 열 수 없어요. WebGL을 지원하는 최신 브라우저에서 다시 열어주세요.';throw new Error('WebGL unavailable');}
const mobile=matchMedia('(max-width:700px)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const world=new World();world.sun.castShadow=true;world.sun.shadow.mapSize.set(2048,2048);Object.assign(world.sun.shadow.camera,{left:-1100,right:1100,top:1100,bottom:-1100,near:1,far:8000});world.sun.shadow.bias=-.0003;world.sun.shadow.normalBias=1;world.scene.add(world.sun.target);const atmosphere=new Atmosphere(renderer),camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,1,100000);const planePosition=new THREE.Vector3();world.scene.add(camera);const cockpit=new Cockpit(camera);
const state={x:positions[0].x,y:1100,z:positions[0].z+1800,heading:0,bank:0,pitch:0,speed:280,throttle:.65,boost:0,attitude:createAttitude(),recovery:null as THREE.Quaternion|null,safety:false};
const race=new SkyRace(),raceView=new SkyRaceView(world.scene),skyLife=new SkyLife(world.scene),miniMap=new Minimap($<HTMLCanvasElement>('mini-map-canvas'));
let raceStage=0,raceNextIn=6,gameMode='healing',raceRegion=0,raceBest=0;
try{raceBest=Math.max(0,Number(localStorage.getItem('baramgyeol-race-best'))||0);}catch{}
const combat=new Combat(),combatView=new CombatView(world.scene,$('combat-hud'));let lastThreatBeep=-1;combat.setDifficulty('easy');
let pointerAim:{x:number;y:number}|null=null,aimPointer:number|null=null;
function clearAim(){pointerAim=null;aimPointer=null;combat.aimDirection=null;combat.aimOrigin=null;}

const effects=new JetEffects(world.scene,world.aircraft),cameraRig=new THREE.PerspectiveCamera(),reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
document.body.classList.add("manual");
let started=false,paused=false,auto=false,current=0,target=1,view=0,elapsed=0,lastTime=0,lastHUD=0,frameAverage=16.7,targetAltitude=1100,weatherMode='clear',weatherList=Array.from({length:cities.length},()=>({...demoWeather})),refreshing=false,lastFetch=0,soundOn=false,tourComplete=false,toastTimer=0,cruise=240,tourHold=45,tourStop=0;
let lowQuality=mobile,slowFrames=0;
if(mobile){atmosphere.resize(true);world.sun.shadow.mapSize.set(1024,1024);}
const keys=new Set<string>(),visited=new Set<number>();try{const stored=JSON.parse(localStorage.getItem('baramgyeol-visits-v1')||'[]');if(Array.isArray(stored))stored.filter(n=>Number.isInteger(n)&&n>=0&&n<cities.length).forEach(n=>visited.add(n));}catch{/* Storage is optional. */}
const map=$<HTMLCanvasElement>('map'),mapCtx=map.getContext('2d')!;
const weather=()=>weatherMode==='live'?weatherList[current]:{...demoWeather,temperature:weatherMode==='snow'?-2:weatherMode==='night'?17:23,cloud:weatherMode==='cloudy'?91:weatherMode==='rain'||weatherMode==='snow'?96:weatherMode==='night'?10:40,code:weatherMode==='rain'?63:weatherMode==='snow'?73:weatherMode==='cloudy'?3:1,wind:weatherMode==='rain'?24:9,day:weatherMode!=='night'};
function toast(text:string){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').hidden=true,2400);}
function remember(i:number){if(visited.has(i))return;visited.add(i);try{localStorage.setItem('baramgyeol-visits-v1',JSON.stringify([...visited]));}catch{}renderCities();}
function renderCities(){$('city-list').replaceChildren();cities.forEach((c,i)=>{const b=document.createElement('button');b.className='city-button'+(i===current?' current':'');b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><div><strong>${c.name}</strong><small>${c.region} · ${c.landmark}</small></div><span class="stamp">${visited.has(i)?'✓':'○'}</span>`;b.onclick=()=>travel(i);$('city-list').append(b);});$('visited-count').textContent=`${visited.size} / 10`;}
function setCity(i:number){current=i;$('region').textContent=cities[i].region;$('city-title').textContent=cities[i].name;$('city-description').textContent=cities[i].desc;renderCities();updateWeatherHUD();}
function closeDrawers(){$('settings').hidden=true;$('destinations').hidden=true;$('settings-button').setAttribute('aria-expanded','false');document.body.classList.remove('panel-open');}
function openSettings(){closeDrawers();$('settings').hidden=false;$('settings-button').setAttribute('aria-expanded','true');document.body.classList.add('panel-open');}
function travel(i:number){if(race.active)setGameMode(false);feel.reset();setCity(i);state.x=positions[i].x;state.z=positions[i].z+650;state.y=Math.max(1100,world.ground(state.x,state.z)+350);targetAltitude=state.y;$<HTMLInputElement>('altitude').value=String(targetAltitude);state.heading=0;state.bank=0;state.pitch=0;state.attitude.identity();state.recovery=null;effects.reset();target=(i+1)%cities.length;tourStop=i;tourHold=22;tourComplete=false;closeDrawers();if(!started)begin();if(combat.active)combat.reset(state);snapCamera();toast(`${cities[i].name}에 도착했어요. ${cities[i].landmark}을 찾아보세요.`);}
function begin(){if(!started&&gameMode==='race')startRace();if(!started&&combat.active)combat.reset(state);if(!started&&$<HTMLInputElement>('start-audio').checked)void enableSound(true);started=true;paused=false;document.body.classList.add('started');$('intro').hidden=true;$('paused').hidden=true;remember(current);window.setTimeout(()=>$('flight-hint').hidden=true,16000);}
function toggleAuto(){if(combat.active||race.active)setGameMode(false);auto=!auto;document.body.classList.toggle('manual',!auto);if(!auto)closeDrawers();$('mode').classList.toggle('active',auto);$('mode').setAttribute('aria-pressed',String(auto));$('mode').innerHTML=icon('compass')+`<span>${auto?'자동 여행':'직접 조종'}</span>`;if(auto){state.recovery=null;const f=new THREE.Vector3(0,0,-1).applyQuaternion(state.attitude);state.heading=Math.atan2(-f.x,-f.z);state.pitch=0;state.bank=0;target=(current+1)%cities.length;tourStop=current;tourHold=18;targetAltitude=state.y;}toast(auto?'바람에 몸을 맡겨보세요.':'W/S 기수 · Q/E 롤 · Space 부스터 · R 수평 복귀');}
function togglePause(){if(!started||combat.dead)return;closeDrawers();paused=!paused;if(paused)flightAudio.silence();keys.clear();$('paused').hidden=!paused;$('pause').innerHTML=icon(paused?'play':'pause');$('pause').setAttribute('aria-label',paused?'여행 재개':'일시정지');}
function nextView(){view=(view+1)%3;closeDrawers();toast(['비행기를 따라가는 시점','조종석 시점','주위를 둘러보는 시점'][view]);}
function updateWeatherHUD(){document.body.classList.toggle('night',!weather().day);const w=weather(),name=weatherMode==='sunset'?'노을':weatherMode==='night'?'밤하늘':weatherName(w.code);$('weather-title').textContent=`${cities[current].name} · ${name} ${Math.round(w.temperature)}°`;$('weather-status').textContent=weatherMode==='live'&&w.live?`현재 날씨 · 바람 ${Math.round(w.wind)} km/h`:weatherMode==='live'?'연결 대기 · 체험 날씨':'내가 고른 체험 날씨';const direction=['북','북동','동','남동','남','남서','서','북서'][Math.round(w.direction/45)%8];$('weather-details').textContent=`${cities[current].name} · ${name}\n구름량 ${w.cloud}% · ${direction}풍 ${w.wind.toFixed(1)} km/h${w.live?' · 관측 '+w.time.slice(11,16)+' (한국 시간)':' · 실제 관측값이 아닌 체험 날씨'}`;document.querySelector('.weather-icon')!.innerHTML=icon(w.cloud>50?'cloud':'sun');}
async function refreshWeather(){if(refreshing||Date.now()-lastFetch<60000)return;refreshing=true;lastFetch=Date.now();const button=$<HTMLButtonElement>('refresh-weather');button.disabled=true;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);try{weatherList=await fetchWeather(cities,abort.signal);}catch{weatherList=weatherList.map(w=>({...w,live:false}));toast('현재 날씨 연결이 어려워 체험 날씨로 여행합니다.');}finally{clearTimeout(timer);refreshing=false;button.disabled=false;updateWeatherHUD();}}
function setGameMode(fighting:boolean){
 clearAim();document.querySelectorAll<HTMLElement>('.combat-level').forEach(el=>el.hidden=!fighting);gameMode=fighting?'combat':'healing';race.stop();race.finished=false;raceView.update(race);$('race-hud').hidden=true;$('race-result').hidden=true;document.body.classList.remove('race-mode');
 const wasDead=combat.dead;
 if(fighting&&auto)toggleAuto();
 if(wasDead){state.y=Math.max(1100,world.ground(state.x,state.z)+500);state.attitude.copy(createAttitude(state.heading));state.recovery=null;state.speed=280;effects.reset();feel.reset();}
 combat.reset(state,fighting);lastThreatBeep=-1;paused=false;keys.clear();
 document.body.classList.toggle('combat-mode',fighting);document.body.classList.remove('combat-dead','hide-ui');
 $('combat-result').hidden=true;$('paused').hidden=true;$('pause').innerHTML=icon('pause');$('pause').setAttribute('aria-label','일시정지');
 document.querySelectorAll<HTMLButtonElement>('[data-game-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gameMode===gameMode)));
 $('mode-description').textContent=fighting?'화면을 드래그해 조준 · 조준 완료 후 발사 버튼 또는 F':'전투 없이, 한국의 하늘을 자유롭게.';
 $('combat-hud').hidden=!fighting||!started;closeDrawers();
 if(started)toast(fighting?'화면을 드래그해 조준 · 조준 완료 후 발사':'힐링 모드 · 편안한 비행을 이어가세요.');
}
function fireMissile(){if(!started||paused||!$('settings').hidden||!$('destinations').hidden)return;combat.fire(state);}
function updateCombatHUD(){
 $('combat-score').textContent=`격추 ${combat.score} · 회피 ${combat.dodges}`;
 const ready=combat.target>=0&&combat.lock>=combat.rules.lockSeconds&&combat.cooldown<=0;
 $<HTMLButtonElement>('fire-missile').disabled=!ready||paused||combat.dead;
 $('lock-status').textContent=combat.cooldown>0?`미사일 준비 ${combat.cooldown.toFixed(1)}초`:ready?'조준 완료 · 발사 가능':combat.target>=0?`조준 유지 ${Math.round(combat.lock/combat.rules.lockSeconds*100)}%`:'화면 드래그로 적기 조준 · F 또는 발사 버튼';
 $('combat-warning').hidden=!combat.threat;
 if(combat.threat){$('threat-time').textContent=`미사일 접근 · ${combat.threat.remaining.toFixed(1)}초`;const beat=Math.floor((combat.rules.evadeSeconds-combat.threat.remaining)*4);if(beat!==lastThreatBeep){lastThreatBeep=beat;if(!paused)flightAudio.cue('warning');}}else lastThreatBeep=-1;
 for(const event of combat.drainEvents()){
  if(event==='death'){keys.clear();flightAudio.silence();document.body.classList.add('combat-dead');closeDrawers();$('combat-result-score').textContent=`격추 ${combat.score}대 · 회피 ${combat.dodges}회`;$('combat-result').hidden=false;$('combat-retry').focus();}
  else if(event==='evaded'){toast('회피 성공 · 적의 추적을 벗어났습니다.');flightAudio.cue('evaded');}
  else if(event==='hit'){toast('적기 격추');flightAudio.cue('hit');}
  else if(event==='launch'||event==='locked')flightAudio.cue(event);
 }
}
function selectRace(){
 setGameMode(false);if(auto)toggleAuto();gameMode='race';
 document.querySelectorAll<HTMLButtonElement>('[data-game-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gameMode==='race')));
 $('mode-description').textContent='빛나는 링을 따라 비행 · 주황색 장애물 피하기';
 if(started)startRace();
}
function startRace(){
 const seed=crypto.getRandomValues(new Uint32Array(1))[0];raceStage++;raceRegion=(raceRegion+1+seed%9)%cities.length;
 const course=makeCourse(seed,positions[raceRegion],(x:number,z:number)=>world.ground(x,z));race.reset(course);raceView.rebuild(race);raceView.update(race);
 Object.assign(state,course.start,{heading:course.heading,speed:220,throttle:.38,boost:0,bank:0,pitch:0,recovery:null});state.attitude.copy(createAttitude(course.heading));
 effects.reset();feel.reset();keys.clear();paused=false;raceNextIn=6;setCity(raceRegion);skyLife.reseed(seed,new THREE.Vector3(state.x,state.y,state.z),(x,z)=>world.ground(x,z));
 weatherMode=['clear','sunset','cloudy'][seed%3];$<HTMLSelectElement>('weather-mode').value=weatherMode;updateWeatherHUD();
 document.body.classList.add('race-mode');document.body.classList.remove('hide-ui');$('race-result').hidden=true;$('paused').hidden=true;$('race-hud').hidden=false;
 $('race-course').textContent=`${cities[raceRegion].name}의 하늘 · 코스 ${raceStage}`;closeDrawers();snapCamera();toast('민트색 링 통과 · 주황 장애물 회피 · 충돌 +3초');
}
function updateRace(dt:number){
 if(!race.active)return;
 if(race.finished){raceNextIn-=dt;$('race-countdown').textContent=`${Math.ceil(Math.max(0,raceNextIn))}초 뒤 새로운 하늘로 이어집니다`;if(raceNextIn<=0)startRace();return;}
 race.update(state,dt);raceView.update(race);
 for(const event of race.drainEvents()){
  if(event==='gate')flightAudio.cue('evaded');
  if(event==='collision'){toast('장애물 접촉 · +3초, 다시 날아보세요');flightAudio.cue('warning');}
  if(event==='miss')toast('놓친 링 +5초 · 다음 링으로 계속');
  if(event==='finish'){
   raceBest=Math.max(raceBest,race.score);try{localStorage.setItem('baramgyeol-race-best',String(raceBest));}catch{}
   $('race-result-title').textContent=race.passed===12?'완벽한 비행':'코스 종료';$('race-total').textContent=`${race.score.toLocaleString()}점`;$('race-summary').textContent=`링 ${race.passed}/12 · ${(race.time+race.penalty).toFixed(1)}초 (가산 ${race.penalty}초) · 최고 ${raceBest.toLocaleString()}점`;
   $('race-countdown').textContent='6초 뒤 새로운 하늘로 이어집니다';$('race-result').hidden=false;$('race-next').focus();keys.clear();flightAudio.cue('locked');
  }
 }
}
$('race-next').onclick=startRace;$('race-healing').onclick=()=>setGameMode(false);
$('shuffle-sky').onclick=()=>{if(gameMode==='race'){startRace();return;}const seed=crypto.getRandomValues(new Uint32Array(1))[0];travel((current+1+seed%9)%cities.length);weatherMode=['clear','sunset','cloudy'][seed%3];$<HTMLSelectElement>('weather-mode').value=weatherMode;updateWeatherHUD();skyLife.reseed(seed,new THREE.Vector3(state.x,state.y,state.z),(x,z)=>world.ground(x,z));};
document.querySelectorAll<HTMLButtonElement>('[data-game-mode]').forEach(b=>b.onclick=()=>b.dataset.gameMode==='race'?selectRace():setGameMode(b.dataset.gameMode==='combat'));
$('fire-missile').onclick=fireMissile;
$('reset-aim').onclick=clearAim;
document.querySelectorAll<HTMLSelectElement>('[data-combat-level]').forEach(el=>el.onchange=()=>{
 combat.setDifficulty(el.value);document.querySelectorAll<HTMLSelectElement>('[data-combat-level]').forEach(other=>other.value=el.value);
 if(combat.active){combat.reset(state);clearAim();setGameMode(true);toast(`난이도 ${combat.rules.label} · 새 전투 시작`);}
});
const aimCanvas=$<HTMLCanvasElement>('scene');
function moveAim(e:PointerEvent){if(e.pointerId!==aimPointer)return;const rect=aimCanvas.getBoundingClientRect();pointerAim={x:Math.max(.03,Math.min(.97,(e.clientX-rect.left)/rect.width)),y:Math.max(.03,Math.min(.97,(e.clientY-rect.top)/rect.height))};e.preventDefault();}
aimCanvas.addEventListener('pointerdown',e=>{if(!started||!combat.active||combat.dead||paused||e.button!==0||aimPointer!==null)return;aimPointer=e.pointerId;aimCanvas.setPointerCapture(e.pointerId);moveAim(e);});
aimCanvas.addEventListener('pointermove',moveAim);
for(const event of ['pointerup','pointercancel','lostpointercapture'])aimCanvas.addEventListener(event,()=>{aimPointer=null;});

$('combat-retry').onclick=()=>setGameMode(true);
$('combat-healing').onclick=()=>setGameMode(false);
let selectedAircraft='kestrel',aircraftChange=0;
async function changeAircraft(id:string){const choice=aircraftById(id);if(!choice)return;const token=++aircraftChange;$('aircraft-status').textContent='준비 중';try{await world.ready;if(token!==aircraftChange)return;if(await world.selectAircraft(id)){selectedAircraft=id;effects.configure(choice);document.querySelectorAll<HTMLSelectElement>('#intro-aircraft,#aircraft-select').forEach(el=>el.value=id);$('aircraft-status').textContent=choice.description;if(started){closeDrawers();(document.activeElement as HTMLElement)?.blur();toast(choice.name+' 탑승');}}}catch{if(token===aircraftChange){$('aircraft-status').textContent='기체를 불러오지 못했어요';document.querySelectorAll<HTMLSelectElement>('#intro-aircraft,#aircraft-select').forEach(el=>el.value=selectedAircraft);}}}
for(const id of ['intro-aircraft','aircraft-select'])$<HTMLSelectElement>(id).onchange=e=>void changeAircraft((e.target as HTMLSelectElement).value);
$('start').onclick=begin;$('mode').onclick=()=>{if(!started)begin();toggleAuto();};$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('view').onclick=nextView;
$('airport-tour').onclick=()=>{if(combat.active||race.active)setGameMode(false);if(auto)toggleAuto();const p=world.airport;state.x=p.x-20;state.z=p.z+690;state.y=p.y+190;state.attitude.copy(createAttitude());state.heading=0;state.recovery=null;state.speed=180;state.throttle=.25;state.boost=0;effects.reset();feel.reset();setCity(1);if(!started)begin();closeDrawers();paused=false;$('paused').hidden=true;snapCamera();toast('공항 저공 비행 · W로 상승, Q/E로 롤');};
$('destinations-button').onclick=()=>{const open=$('destinations').hidden;closeDrawers();$('destinations').hidden=!open;document.body.classList.toggle('panel-open',open);$('settings-button').setAttribute('aria-expanded',String(open));};
$('settings-button').onclick=()=>{if(!$('settings').hidden||!$('destinations').hidden)closeDrawers();else openSettings();};
$('back-settings').onclick=openSettings;
document.querySelectorAll<HTMLElement>('[data-close]').forEach(b=>b.onclick=closeDrawers);
$('scene').addEventListener('pointerdown',closeDrawers);
for(const event of ['contextmenu','selectstart','dragstart'])app.addEventListener(event,e=>{if((e.target as HTMLElement).closest('button,#scene,.touch-controls,#combat-hud'))e.preventDefault();});
document.querySelectorAll<HTMLButtonElement>('[data-altitude]').forEach(b=>b.onclick=()=>{if(!auto)toggleAuto();targetAltitude=Number(b.dataset.altitude);$<HTMLInputElement>('altitude').value=String(targetAltitude);closeDrawers();if(!started)begin();});
$<HTMLSelectElement>('weather-mode').onchange=e=>{weatherMode=(e.target as HTMLSelectElement).value;updateWeatherHUD();};
$<HTMLSelectElement>('cruise').onchange=e=>{cruise=Number((e.target as HTMLSelectElement).value);};
$('refresh-weather').onclick=()=>{if(Date.now()-lastFetch<60000)toast('날씨는 1분 뒤 다시 확인할 수 있어요.');else void refreshWeather();};
function applyQuality(low:boolean){lowQuality=low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);atmosphere.resize(low);}
$<HTMLSelectElement>('quality').onchange=e=>{const value=(e.target as HTMLSelectElement).value;applyQuality(value==='low'||value==='auto'&&mobile);slowFrames=0;};
$<HTMLInputElement>('altitude').oninput=e=>{if(!auto)toggleAuto();targetAltitude=Number((e.target as HTMLInputElement).value);};
for(const id of ['cinema','cinema-exit'])$(id).onclick=()=>{closeDrawers();document.body.classList.toggle('hide-ui');};
const flightAudio=new FlightAudio(),feel=new FlightFeel();let motionStrength=reducedMotion?0:.55;
$<HTMLInputElement>('motion-strength').value=String(motionStrength*100);
$<HTMLInputElement>('motion-strength').oninput=e=>{motionStrength=Number((e.target as HTMLInputElement).value)/100;};
$<HTMLInputElement>('sound-volume').oninput=e=>{flightAudio.volume=Number((e.target as HTMLInputElement).value)/100;};
async function enableSound(on:boolean){try{await flightAudio.setEnabled(on);soundOn=on;$('sound').innerHTML=icon(on?'volume':'mute');$('sound').setAttribute('aria-label',on?'엔진 소리 끄기':'엔진 소리 켜기');}catch{toast('소리를 켜지 못했어요. 메뉴에서 다시 켜 주세요.');}}

$('sound').onclick=()=>{void enableSound(!soundOn);};
window.addEventListener('keydown',e=>{const key=e.code.startsWith('Key')?e.code.slice(3).toLowerCase():e.key.length===1?e.key.toLowerCase():e.key;if(e.key==='Escape'){closeDrawers();document.body.classList.remove('hide-ui');$('settings-button').focus();return;}if((e.target as HTMLElement).closest('input,select,textarea')||((e.target as HTMLElement).closest('button')&&[' ','Enter'].includes(e.key)))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','q','e','r','x','Shift'].includes(key)){e.preventDefault();keys.add(key);if(!started)begin();if(auto&&e.key!==' ')toggleAuto();}if(!e.repeat){if(key==='f'){e.preventDefault();fireMissile();}if(key==='p')togglePause();if(key==='c')nextView();if(key==='h')document.body.classList.toggle('hide-ui');if(e.key==='Escape'){closeDrawers();document.body.classList.remove('hide-ui');}}});window.addEventListener('keyup',e=>keys.delete(e.code.startsWith('Key')?e.code.slice(3).toLowerCase():e.key.length===1?e.key.toLowerCase():e.key));
const clearKeys=()=>{aimPointer=null;keys.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));if(started&&!paused)togglePause();};window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys();});
document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button=>{button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('held');keys.add(button.dataset.key!);if(!started)begin();if(auto)toggleAuto();};const release=()=>{keys.delete(button.dataset.key!);button.classList.remove('held');};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;});
// Release button focus so keyboard flight controls remain available after a click.
document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>b.blur()));
function drawMap(){const ctx=mapCtx;ctx.clearRect(0,0,424,462);const point=(x:number,z:number)=>({x:210+x*.025,y:150+z*.025});ctx.fillStyle='#d7e3de';ctx.strokeStyle='#bacdc5';ctx.lineWidth=.8;for(const p of polygons){ctx.beginPath();p.forEach((a,i)=>{const b=point(a[0],a[1]);if(i===0)ctx.moveTo(b.x,b.y);else ctx.lineTo(b.x,b.y);});ctx.closePath();ctx.fill();ctx.stroke();}ctx.setLineDash([4,5]);ctx.strokeStyle='#90aaa6';ctx.lineWidth=1.4;ctx.beginPath();positions.forEach((p,i)=>{const a=point(p.x,p.z);if(i===0)ctx.moveTo(a.x,a.y);else ctx.lineTo(a.x,a.y);});ctx.stroke();ctx.setLineDash([]);positions.forEach((p,i)=>{const a=point(p.x,p.z);ctx.beginPath();ctx.arc(a.x,a.y,i===current?5:3,0,Math.PI*2);ctx.fillStyle=visited.has(i)?'#307e76':'#a3b8b0';ctx.fill();if([0,1,3,4,6,8,9].includes(i)){ctx.fillStyle='#55787a';ctx.font='18px Arial';ctx.textAlign=i<4?'right':'left';ctx.fillText(cities[i].name,a.x+(i<4?-9:9),a.y+5);}});const p=point(state.x,state.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-state.heading);ctx.fillStyle='#bc8947';ctx.strokeStyle='#f7f4e7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
function snapCamera(){planePosition.set(state.x,state.y,state.z);const f=new THREE.Vector3(0,0,-1).applyQuaternion(state.attitude),u=new THREE.Vector3(0,1,0).applyQuaternion(state.attitude);camera.position.copy(planePosition).addScaledVector(f,-100).addScaledVector(u,21);camera.up.copy(u);camera.lookAt(planePosition.clone().addScaledVector(f,400));}
snapCamera();renderCities();void refreshWeather();setInterval(()=>{if(!document.hidden)void refreshWeather();},10*60*1000);
function tick(now:number){const frozen=paused||((combat.active||race.active)&&(!$('settings').hidden||!$('destinations').hidden));const frameElapsed=now-lastTime;const dt=Math.min(frameElapsed/1000||0,.05);lastTime=now;if(!frozen)elapsed+=dt;let w=weather();if(started&&!frozen&&!combat.dead&&!race.finished){if(auto){tourHold=Math.max(0,tourHold-dt);const stop=positions[tourStop];const dest=tourHold>0?{x:stop.x+Math.sin(elapsed*.085)*450,z:stop.z+Math.cos(elapsed*.085)*450}:positions[target];const dx=dest.x-state.x,dz=dest.z-state.z;const desired=Math.atan2(-dx,-dz);let difference=THREE.MathUtils.euclideanModulo(desired-state.heading+Math.PI,Math.PI*2)-Math.PI;state.heading+=Math.max(-.5*dt,Math.min(.5*dt,difference));state.bank=damp(state.bank,-difference*.18,2,dt);state.speed=damp(state.speed,keys.has(' ')?540:cruise,1,dt);state.x-=Math.sin(state.heading)*state.speed*dt;state.z-=Math.cos(state.heading)*state.speed*dt;state.x-=Math.sin(w.direction*Math.PI/180)*Math.min(w.wind/3.6,12)*dt;state.z+=Math.cos(w.direction*Math.PI/180)*Math.min(w.wind/3.6,12)*dt;state.y=approachAltitude(state.y,Math.max(targetAltitude,world.ground(state.x-Math.sin(state.heading)*100,state.z-Math.cos(state.heading)*100)+125),dt);state.y=Math.max(state.y,world.ground(state.x,state.z)+55);state.pitch=damp(state.pitch,0,2,dt);if(tourHold===0&&Math.hypot(dx,dz)<450){remember(target);setCity(target);tourStop=target;tourHold=22;target=(target+1)%cities.length;if(target===0&&!tourComplete){tourComplete=true;toast('한국의 세 바다를 모두 여행했어요. 하늘 여행은 계속됩니다.');}}}else{stepJet(state,{turn:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),pitch:Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s')),roll:Number(keys.has('e'))-Number(keys.has('q')),throttle:Number(keys.has('Shift'))-Number(keys.has('x')),brake:keys.has('x'),boost:keys.has(' '),recover:keys.has('r')},dt,w,(x:number,z:number)=>world.ground(x,z));targetAltitude=state.y;}
 let nearest=current,nearestD=Infinity;positions.forEach((p,i)=>{const d=Math.hypot(p.x-state.x,p.z-state.z);if(d<nearestD){nearest=i;nearestD=d;}if(d<650)remember(i);});if(nearest!==current&&(!auto||nearestD<650))setCity(nearest);
 }
 if(!started){state.x=positions[0].x+Math.sin(elapsed*.035)*120;state.z=positions[0].z+1800;state.y=1100;state.heading=-.2;}
 if(auto)state.boost=damp(state.boost,keys.has(' ')?1:0,5,frozen?0:dt);
 if(auto||!started)state.attitude.setFromEuler(new THREE.Euler(state.pitch,state.heading,state.bank,'YXZ'));
 if(started&&!frozen)feel.update(state.attitude,state.speed,state.y,w.wind,w.cloud,dt);
 planePosition.set(state.x,state.y,state.z);world.aircraft.position.copy(planePosition);world.aircraft.quaternion.copy(state.attitude);world.aircraft.visible=view!==1&&!combat.dead;cockpit.group.visible=started&&view===1;cockpit.update(frozen?0:dt,state.speed,state.y,state.heading,state.boost);
 if(combat.active&&pointerAim){camera.updateMatrixWorld();const ray=new THREE.Vector3(pointerAim.x*2-1,1-pointerAim.y*2,.5).unproject(camera).sub(camera.position).normalize();combat.aimDirection=ray;combat.aimOrigin=camera.position.clone();}
 if(started&&!frozen)combat.update(state,dt,(x:number,z:number)=>world.ground(x,z));
 if(combat.active)updateCombatHUD();
 if(started&&!frozen)updateRace(dt);
 const forward=new THREE.Vector3(0,0,-1).applyQuaternion(state.attitude),up=new THREE.Vector3(0,1,0).applyQuaternion(state.attitude),desired=new THREE.Vector3(),look=new THREE.Vector3();
 if(!started){desired.copy(planePosition).add(new THREE.Vector3(-44,30,85));look.copy(planePosition).add(new THREE.Vector3(0,0,-60));cameraRig.up.set(0,1,0);}
 else if(view===2){desired.copy(planePosition).add(new THREE.Vector3(Math.cos(elapsed*.09)*140,70,Math.sin(elapsed*.09)*140));look.copy(planePosition);cameraRig.up.set(0,1,0);}
 else {desired.copy(planePosition).addScaledVector(forward,view===1?8:innerWidth<700?-100:-78).addScaledVector(up,view===1?3:21);look.copy(planePosition).addScaledVector(forward,400);cameraRig.up.copy(up);}
 if(started&&!frozen&&!reducedMotion&&motionStrength>0&&view!==2){const intensity=motionStrength*(state.boost*.48+feel.gust*.14+(feel.load-1)*.06);desired.addScaledVector(up,Math.sin(elapsed*43)*intensity).addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(state.attitude),Math.sin(elapsed*37)*intensity*.65);look.addScaledVector(up,Math.sin(elapsed*29)*intensity*1.4);}
 if(!frozen){camera.position.lerp(desired,1-Math.exp(-dt*(view===1?18:7)));cameraRig.position.copy(camera.position);cameraRig.lookAt(look);camera.quaternion.slerp(cameraRig.quaternion,1-Math.exp(-dt*7));const fov=!started?55:reducedMotion?65:62+state.boost*20+Math.max(0,state.speed-280)*.015;camera.fov=damp(camera.fov,fov,3,dt);camera.updateProjectionMatrix();}
 effects.update(frozen?0:dt,state.boost,state.speed,started&&view!==1&&!combat.dead,feel.load);world.update(frozen?0:dt,w,planePosition,weatherMode==='sunset');
 skyLife.update(frozen?0:dt,planePosition,w.wind,(x,z)=>world.ground(x,z));
 camera.updateMatrixWorld();combatView.update(combat,camera,planePosition,state.attitude);if(combat.active&&pointerAim){$('reticle').style.left=`${pointerAim.x*100}%`;$('reticle').style.top=`${pointerAim.y*100}%`;}if(!started)$('combat-hud').hidden=true;
 atmosphere.render(world.scene,camera,frozen?0:dt,w,world.sunDirection,weatherMode==='sunset');
 frameAverage=frameAverage*.95+Math.min(frameElapsed,1000)*.05;if(started&&!frozen&&!lowQuality&&$<HTMLSelectElement>('quality').value==='auto'){slowFrames=frameAverage>27?slowFrames+dt:Math.max(0,slowFrames-dt);if(slowFrames>5)applyQuality(true);}if(now-lastHUD>150){miniMap.draw(state,race);$('mini-location').textContent=`${cities[current].name} 주변`;
 if(race.active){$('race-progress').textContent=`링 ${Math.min(race.index+1,12)} / 12`;$('race-points').textContent=`${race.score.toLocaleString()}점 · 연속 ${race.combo} · ${(race.time+race.penalty).toFixed(1)}초`;const g=race.course?.gates[race.index];if(g){const distance=Math.hypot(g.x-state.x,g.y-state.y,g.z-state.z);const direction=new THREE.Vector3(g.x-state.x,g.y-state.y,g.z-state.z).applyQuaternion(state.attitude.clone().invert());$('race-direction').textContent=`${direction.z>0?'뒤쪽으로 선회':Math.abs(direction.x)>distance*.2?(direction.x>0?'오른쪽 ↗':'↖ 왼쪽'):'정면 ↑'} · ${Math.round(distance)} m${g.y-state.y>90?' · 상승':g.y-state.y< -90?' · 하강':''}`;}}
 $('jet-speed').textContent=String(Math.round(state.speed*3.6));$('jet-power').textContent=state.safety?'지형 · 자동 회피':auto?'AUTO CRUISE':state.boost>.4?'AFTERBURNER':`THR ${Math.round(state.throttle*100)}%`;$('jet-power').classList.toggle('boosting',state.boost>.4);$('scene').dataset.draws=String(renderer.info.render.calls);$('scene').dataset.fps=String(Math.round(1000/frameAverage));$('height').textContent=Math.round(state.y).toLocaleString('ko');$('speed').textContent=started?String(Math.round(state.speed*3.6)):'0';if(!$('destinations').hidden)drawMap();const landmark=world.landmarks[current],point=landmark.position.clone().add(new THREE.Vector3(0,current===0?240:80,0)),distance=point.distanceTo(planePosition);point.project(camera);const visible=started&&state.y<320&&point.z<1&&Math.abs(point.x)<.9&&Math.abs(point.y)<.7&&distance<1200;$('landmark').hidden=!visible;if(visible){$('landmark').textContent=cities[current].landmark;$('landmark').style.left=`${(point.x*.5+.5)*innerWidth}px`;$('landmark').style.top=`${(-point.y*.5+.5)*innerHeight}px`;}lastHUD=now;}
 flightAudio.update(state.speed,state.boost,state.throttle,frozen||!started||combat.dead||race.finished,view===1,feel.load,feel.roll,feel.gust);requestAnimationFrame(tick);
}
world.ready.then(()=>{skyLife.reseed(42,new THREE.Vector3(state.x,state.y,state.z),(x,z)=>world.ground(x,z));const fighter=world.aircraft.children.find(o=>o instanceof THREE.Group);if(fighter)combatView.setAircraft(fighter);world.update(.016,weather(),planePosition);const pmrem=new THREE.PMREMGenerator(renderer);const environmentScene=new THREE.Scene();environmentScene.add(world.sky.clone());world.scene.environment=pmrem.fromEquirectangular(world.sky.material.uniforms.skyPhoto.value).texture;world.scene.environmentIntensity=.55;pmrem.dispose();$('loading').hidden=true;requestAnimationFrame(tick);}).catch(error=>{console.error(error);$('loading-text').textContent='여행 풍경을 불러오지 못했어요. 페이지를 새로고침해 주세요.';});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);atmosphere.resize(lowQuality);});
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;$('loading').hidden=false;$('loading-text').textContent='3D 화면이 잠시 중단됐어요. 새로고침하면 여행을 이어갈 수 있어요.';});
