# 바람결 — Korea Sky Journey

A quiet Three.js flight game over Korea, with a satellite-textured terrain mesh, depth-aware volumetric clouds, and original models authored in Blender through Blender MCP.

## Play

The default is manual fighter flight with a small city label, speed readout, and **여행** menu. W/S changes pitch, A/D turns, Q/E rolls through 360 degrees, Shift increases throttle, X brakes, and Space engages the afterburner. Hold W for a complete loop. R recovers to level flight. C switches chase/cockpit/orbit views, P pauses, and H hides the interface. Touch controls appear on small screens after flight starts. **구름 위로** selects automatic flight and climbs to 3,300 game metres, above the 1,200–2,700 metre volumetric cloud layer. Altitude presets and the altitude slider enable automatic touring. Selecting a city moves to its airspace. Visiting cities leaves device-local travel stamps.

Route: Seoul → Incheon → Taean → Mokpo → Yeosu → Tongyeong → Busan → Pohang → Gangneung → Sokcho. The map is compressed for a relaxed journey; buildings, landmarks, terrain elevations and flight speeds are artistic approximations, not a flight simulator or navigational data.

## Weather

The public Open-Meteo forecast endpoint provides current temperature, weather code, cloud cover, wind direction, wind speed, and day/night state for ten fixed city coordinates. No location permissions, personal coordinates or API keys are used. Weather is fetched at launch and every ten minutes, with a ten-second timeout, one-minute manual refresh cooldown, schema validation, and a three-hour freshness limit. The interface explicitly labels demo conditions when current observations cannot be loaded. Ground-level wind is artistically limited for gentle flying; clouds and atmosphere respond to weather. Optional clear/cloudy/rain/sunset/night/snow presets are explicitly demo modes. World-space volumetric clouds drift with the wind. A depth-aware raymarch integrates light through the cloud layer, allowing flight below, inside and above it. Night scenes include stars, a moon and illuminated windows; rain and snow use separate particle effects.

## Graphics

- NASA Blue Marble cloud-free historical imagery, stored locally as a 4096 × 4096 WebP; this is not live or street-resolution imagery.
- A 1025 × 1025 elevation grid assembled from 48 Mapzen Terrain Tiles, with near 1024 × 1024 / far 512 × 512 terrain detail in independently culled LOD patches with matching boundary vertices.
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
- C 키의 1인칭 시점에 실제 3D 조종석과 속도·고도·방위 계기를 추가했습니다. 엔진 및 바람 소리는 시작 화면의 선택에 따라 켜며 Web Audio로 로컬 합성합니다.
- 전투기 모델은 Blender MCP로 제작·수정하고 재질별로 병합했습니다. 테스트에서 12개 이하의 렌더링 단위, 6만 삼각형 미만, 2MB 미만을 검사합니다.
- 지형 충돌 검사는 공간 격자를 사용합니다. 자동 품질은 모바일에서 낮은 설정으로 시작하고, 데스크톱에서 느린 프레임이 5초 누적되면 구름 해상도와 렌더 해상도를 줄입니다. 수동 고품질 선택도 가능합니다.
- 지형·도시의 축척과 건물은 여전히 게임용으로 단순화되어 있으며, 실사 도시 복제나 실제 항공 훈련용 시뮬레이터는 아닙니다. 호스팅 서비스 및 무료 날씨 API의 이용 한도는 적용됩니다.

### 비행 감각과 소리

시작 화면에서 ‘엔진·바람 소리 켜고 시작’을 선택하면 첫 조작으로 음향이 켜집니다. 쌍발 터빈, 저음 엔진, 고속 풍절음, 부스터를 각각 합성합니다. 회전 방향에 따라 바람이 좌우로 이동하고 급선회·구름·바람에 반응합니다. 조종석에서는 음색과 크기가 낮아집니다. 메뉴에서 음소거와 소리 크기를 조절합니다. 일시정지하거나 다른 창으로 이동하면 소리가 잦아듭니다.

급선회 시 날개 주변 응결과 궤적이 강조되고 카메라가 미세하게 진동합니다. 메뉴의 ‘비행 진동 효과’를 0으로 설정하면 진동을 끕니다. 운영체제의 동작 줄이기 설정도 존중합니다. 기동 강도는 연출용 값이며 실제 G 측정이 아닙니다. 추가 서버, 오디오 다운로드, 유료 API를 사용하지 않습니다.

### 전투 / 힐링 모드

시작 화면 또는 여행 메뉴에서 선택합니다. 기본값은 힐링 모드이며 적기, 미사일, 격추 판정이 없습니다. 전투 모드는 로컬에서 적기 3대를 움직이는 아케이드 공중전입니다.

- 기수 조준선 가까이에 적기를 약 0.75초 유지하면 ‘조준 완료’가 표시됩니다. F 또는 화면의 미사일 발사 버튼으로 추적 미사일을 발사합니다. 사거리 3,200 게임 미터, 재발사 대기 1.4초입니다.
- 적의 미사일 접근 경고가 뜨면 **3초가 끝나기 전에** 45° 이상 급선회하거나 약 반 바퀴 롤(Q/E, 모바일 ↶/↷)을 하면 회피합니다. 비행 경로에서 옆으로 충분히 벗어나도 회피합니다. 롤로 추적을 끊는 것은 게임용 규칙이며 실제 미사일 회피법이 아닙니다.
- 회피하지 못하면 한 번의 피격으로 비행이 종료됩니다. ‘다시 출격’ 또는 ‘힐링 비행으로’를 선택할 수 있습니다. 격추·회피 점수를 표시하며 적기는 재등장합니다.
- 설정 메뉴를 열거나 P로 일시정지하면 전투와 3초 제한이 함께 멈춥니다. 도시 이동은 전투를 새로 시작합니다. 자동 여행과 고도 프리셋을 선택하면 힐링 모드로 전환합니다.
- 조준 완료, 발사, 격추, 회피, 접근 경고음은 기존 음향 설정을 따릅니다. 전투 화면은 조준선, 적기 표시, 점수, 발사 버튼만 추가하고 접근 중에만 위험 경고를 표시합니다.

테스트는 조준·추적 명중·재장전, AI 경고, 3초 경계의 실패 판정, 실제 선회·롤 회피, 일시정지, 재시작과 힐링 모드 분리를 검증합니다. 적기는 기존 오리지널 Blender 전투기 모델을 공유하고 재질을 구분합니다. 새 모델 다운로드, 외부 API, 유료 서버 또는 멀티플레이 연결이 없습니다.

### 기체와 근거리 풍경 개선

- 시작 화면과 여행 메뉴에서 Kestrel, Viper 단발 경전투기, Specter 스텔스형의 세 기체를 고릅니다. 선택한 모델은 같은 출처의 로컬 GLB로 불러오며 캐시합니다. 빠르게 다른 기체를 골라도 마지막 선택을 우선합니다. 비행/전투 성능은 같고 모델과 노즐·날개 궤적 위치가 달라집니다. 조종석은 공통입니다.
- 신규 Viper/Specter는 설치된 Blender 5.2를 별도 백그라운드 프로세스로 실행해 `scripts/create_fleet.py`로 제작했습니다. 이번 작업 시 Blender MCP 소켓은 연결되지 않았습니다. 기존 사용자의 Blender 장면을 수정하지 않았습니다.
- 실루엣 참고: [미 공군 F-16](https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104505/f-16-fighting-falcon/), [미 공군 F-22](https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104506/f-22-raptor/). 독자 제작한 게임용 형상이며 공식 기체 모델이나 정확한 치수 복제는 아닙니다.
- 지형은 근거리 세분화, 경계가 맞는 LOD, 촬영 기반 지면 텍스처와 노멀 디테일을 사용합니다. [Poly Haven Aerial Rocks 02](https://polyhaven.com/a/aerial_rocks_02), [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock), Rob Tuytel, CC0. 출처는 `public/materials/ATTRIBUTION.md`에 기록했습니다. 위성영상·고도 원본의 해상도를 높인 것은 아닙니다.
- 해안의 얕은 물과 제한된 포말, 도시 간선도로와 차선, 숲 군집, 컨테이너 터미널·크레인, 활주로·격납고·관제탑을 추가했습니다. 공항은 서해의 가상 비행용 시설이며 실제 인천공항 배치나 좌표를 복제하지 않았습니다. 메뉴의 ‘공항 저공 비행’으로 접근할 수 있습니다.
- 하늘과 해안 조명 참고: [Poly Haven Wilderness Beach](https://polyhaven.com/a/wilderness_beach). 기존 번들 HDRI와 통과 가능한 볼륨 구름을 유지했습니다. [Three.js terrain example](https://threejs.org/examples/webgl_geometry_terrain.html)도 지형 표현 참고로 검토했습니다.
- 게임 버튼·캔버스에서 텍스트 선택, 드래그, 컨텍스트 메뉴, iOS 길게 누르기 메뉴를 억제했습니다. 비행 버튼은 pointerdown 즉시 반응하고 눌린 상태가 표시되며, 손을 떼거나 포커스를 잃으면 해제합니다. 설정의 입력·링크는 유지합니다.

도시와 시설은 게임용으로 재구성한 풍경이며 포토그래메트리나 실사 도시 복제는 아닙니다. 새 유료 서비스나 서버를 추가하지 않았습니다.
