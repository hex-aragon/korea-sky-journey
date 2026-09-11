# 바람결 — Korea Sky Journey

A quiet Three.js flight game over Korea, with a satellite-textured terrain mesh, depth-aware volumetric clouds, and original models authored in Blender through Blender MCP.

## Play

The default is manual fighter flight with a small city label, speed readout, and **여행** menu. W/S changes pitch, A/D turns, Q/E rolls through 360 degrees, Shift increases throttle, X brakes, and Space engages the afterburner. Hold W for a complete loop. R recovers to level flight. C switches chase/cockpit/orbit views, P pauses, and H hides the interface. Touch controls appear on small screens after flight starts. **구름 위로** selects automatic flight and climbs to 3,300 game metres, above the 1,200–2,700 metre volumetric cloud layer. Altitude presets and the altitude slider enable automatic touring. Selecting a city moves to its airspace. Visiting cities leaves device-local travel stamps.

Route: Seoul → Incheon → Taean → Mokpo → Yeosu → Tongyeong → Busan → Pohang → Gangneung → Sokcho. The map is compressed for a relaxed journey; buildings, landmarks, terrain elevations and flight speeds are artistic approximations, not a flight simulator or navigational data.

## Weather

The public Open-Meteo forecast endpoint provides current temperature, weather code, cloud cover, wind direction, wind speed, and day/night state for ten fixed city coordinates. No location permissions, personal coordinates or API keys are used. Weather is fetched at launch and every ten minutes, with a ten-second timeout, one-minute manual refresh cooldown, schema validation, and a three-hour freshness limit. The interface explicitly labels demo conditions when current observations cannot be loaded. Ground-level wind is artistically limited for gentle flying; clouds and atmosphere respond to weather. Optional clear/cloudy/rain/sunset/night/snow presets are explicitly demo modes. World-space volumetric clouds drift with the wind. A depth-aware raymarch integrates light through the cloud layer, allowing flight below, inside and above it. Night scenes include stars, a moon and illuminated windows; rain and snow use separate particle effects.

## Graphics

- NASA Blue Marble cloud-free historical imagery, stored locally as a 4096 × 4096 WebP; this is not live or street-resolution imagery.
- A 1025 × 1025 elevation grid assembled from 48 Mapzen Terrain Tiles, with a 512 × 512 terrain mesh split into frustum-culled patches.
- Atmospheric sky scattering with a blue upper-sky grade, cloud self-shading and scattered cloud regions, warm sunset lighting, a Fresnel water shader with moving wave normals, and multisampled scene rendering. The separate built-in Sky cloud layer is disabled to avoid duplicate clouds.
- An original Blender twin-engine fighter with detailed nozzles, canopy framing, control-surface seams, navigation lights and contrasting paint; a 3D cockpit with live instruments; original broadleaf and Seoul tower assets.
- Terrain-conforming city districts, varied buildings with rooftop equipment, shadow maps, night windows, and the existing tourism landmarks.
- Clouds render at 70% of output resolution with 56 ray steps in high quality; low quality uses 40% and 32 steps. Small screens initially select low quality. UI quality controls allow switching manually.

The horizontal map is deliberately compressed and elevation uses an artistic scale. City buildings and landmark geometry are reconstructions, not photogrammetry. Satellite resolution limits low-altitude ground detail. This is a browser sightseeing game, not a digital twin or an aviation simulator.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Node 22 or newer. Static output lives in `dist/`. GitHub Actions builds, tests, audits, and publishes it to GitHub Pages. No application backend is required.

To regenerate original GLB assets, run Blender from this directory:

```sh
blender --background --python scripts/create_models.py
blender --background --python scripts/create_aircraft.py
blender --background --python scripts/create_city_landmark.py
blender --background --python scripts/create_skywing.py
blender --background --python scripts/create_fighter.py
```

To regenerate geographic assets, install Pillow and NumPy in a separate Python environment, then run `python scripts/prepare_geography.py`. This downloads public imagery and elevation data during authoring; the deployed game loads only the bundled local assets.

The models were generated using the community Blender MCP server version 1.9.1 with telemetry disabled and its Blender socket bound to 127.0.0.1. The Blender authoring integration is local tooling and is not included in or called by the deployed game. Higgsfield is not a runtime dependency; its official MCP endpoint has been registered locally, but account authorization remains incomplete. No Higgsfield-generated assets are claimed or included.

## Security and privacy

- No secrets, authentication, payment, tracking scripts, uploads or user-provided HTML.
- Weather requests are HTTPS, omit credentials, and suppress referrer transmission.
- Remote weather values are validated and displayed using textContent.
- JavaScript, geographic data, textures and models are hosted together. CSP limits executable scripts to the same origin and API requests to Open-Meteo.
- Inline styling is allowed for positioned HUD elements; inline scripts and eval are not allowed.
- Third-party links use `noopener noreferrer`.
- Dependencies and GitHub Actions are pinned; CI uses minimal permissions and audits dependencies.
- Local storage contains only visited city indexes. Browser storage can be unavailable without breaking the game.
- WebGL context loss is handled with a recovery message. Rendering pauses logically when focus is lost. Frame deltas are bounded.

Known limitations: GitHub Pages does not provide arbitrary response-header configuration, so CSP is delivered via HTML meta. In-app browser checks cover start, automatic flight, city changes, weather presets, camera modes, pause/resume and high-altitude flight. Automated tests cover simulation direction, wind, terrain clearance, altitude limits, weather validation and model integrity, and geographic asset orientation/integrity, but are not a guarantee that the application has no vulnerabilities.

## Attribution

- Rendering: [Three.js](https://threejs.org/), MIT.
- Coastline: [Natural Earth 1:50m countries](https://www.naturalearthdata.com/), public domain. Source: `nvkelso/natural-earth-vector`, `ne_50m_admin_0_countries.geojson`; Korean peninsula geometries extracted locally.
- Weather: [Open-Meteo](https://open-meteo.com/), weather data under CC BY 4.0; free endpoint is for non-commercial use and subject to provider limits.
- Imagery: [NASA Blue Marble](https://earthobservatory.nasa.gov/features/BlueMarble) via [GIBS](https://nasa-gibs.github.io/gibs-api-docs/access-basics/). Historical satellite mosaic; resampled to the game region and compressed locally. NASA Earth Observatory imagery by Reto Stöckli, based on MODIS data; source imagery is not represented as a current observation.
- Elevation: [Mapzen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/), accessed 2026-09-11. Global SRTM/GMTED2010 terrain data courtesy of the U.S. Geological Survey; global ETOPO1 terrain data courtesy of NOAA. See [source attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Resampled and vertically scaled for gameplay.
- Sky HDRI: [Poly Haven Kloofendal Pure Sky](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Greg Zaal / Jarod Guest, CC0. Bundled locally; see `public/environment/ATTRIBUTION.md`.
- GLB fighter, skywing, glider, broadleaf tree, Seoul tower, Namsan tower, pavilion and lighthouse: original Blender geometry generated for this project.
- Technical reference: [Three.js volume cloud example](https://threejs.org/examples/webgl_volume_cloud.html). The game uses its own world-space, depth-aware cloud pass; no game screenshots, proprietary models or textures were copied from commercial flight games.

### Kestrel 전투기 자유 비행

기본 모드는 직접 조종입니다. Blender로 제작한 오리지널 쌍발 전투기(`scripts/create_fighter.py`, `public/models/fighter.glb`)를 사용합니다. 밝은 세라믹 도색, 어두운 날개 패널, 주황색 식별 무늬와 두 엔진의 불꽃으로 지형과 기체를 구분합니다.

- W/S 또는 ↑/↓: 기수 올리기/내리기. W를 계속 누르면 360° 루프.
- A/D 또는 ←/→: 좌우 선회. Q/E: 좌우 360° 롤.
- Shift: 스로틀 증가. X: 스로틀 감소 및 에어브레이크.
- Space: 누르는 동안 애프터버너, 최고 약 1,944 km/h.
- R: 현재 방향을 유지하며 수평 자세로 복귀.
- C: 시점 전환, P: 일시정지, H: 화면 UI 숨기기.
- 모바일: 방향·롤·BOOST·수평 버튼을 누르고 조종.
- 메뉴의 고도 선택은 자동 여행으로 전환합니다. 직접 조종 중에는 기수 방향을 따라 고도가 바뀝니다.

쿼터니언 자세와 로컬 축 회전을 사용하므로 롤/피치 제한이 없습니다. 카메라도 기체의 상하 방향을 따라 회전합니다. 가속에 따른 시야 확장과 날개 궤적이 속도를 표현하며, 동작 줄이기 설정에서는 시야 확장을 끕니다. 지면/지도 경계에는 자동 회피가 적용됩니다. 실제 비행역학이나 전투 시뮬레이터가 아닌 아케이드 비행입니다.

### 무료 브라우저 그래픽 구성

- 게임은 Three.js/WebGL로 이용자 기기에서 렌더링하며 GitHub Pages 정적 배포를 유지합니다. GPU 서버, 유료 생성 API, 로그인, 결제 기능이 없습니다.
- Poly Haven의 CC0 2K 하늘 HDRI를 저장소에 포함했습니다. Greg Zaal / Jarod Guest 제작. 출처와 해시는 `public/environment/ATTRIBUTION.md`에 있습니다. 이는 한국 실황 하늘 사진이 아닌 시각 연출용 환경입니다.
- 먼 하늘은 HDRI, 통과 가능한 가까운 구름은 반복 경계가 없는 3D 볼륨, 높은 고도와 야간은 별도의 하늘 셰이더로 표현합니다. 밝은 낮이 기본이며 메뉴에서 현재 날씨를 선택할 수 있습니다.
- C 키의 1인칭 시점에 실제 3D 조종석과 속도·고도·방위 계기를 추가했습니다. 엔진 및 바람 소리는 메뉴에서 켜며 Web Audio로 로컬 합성합니다.
- 전투기 모델은 Blender MCP로 제작·수정하고 재질별로 병합했습니다. 테스트에서 12개 이하의 렌더링 단위, 6만 삼각형 미만, 2MB 미만을 검사합니다.
- 지형 충돌 검사는 공간 격자를 사용합니다. 자동 품질은 모바일에서 낮은 설정으로 시작하고, 데스크톱에서 느린 프레임이 5초 누적되면 구름 해상도와 렌더 해상도를 줄입니다. 수동 고품질 선택도 가능합니다.
- 지형·도시의 축척과 건물은 여전히 게임용으로 단순화되어 있으며, 실사 도시 복제나 실제 항공 훈련용 시뮬레이터는 아닙니다. 호스팅 서비스 및 무료 날씨 API의 이용 한도는 적용됩니다.
