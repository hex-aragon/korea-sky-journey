# 바람결 — Korea Sky Journey

A quiet Three.js flight game over Korea, with a satellite-textured terrain mesh, depth-aware volumetric clouds, and original models authored in Blender through Blender MCP.

## Play

The default flight screen contains only a small city name and one **여행** button. Open it for altitude, automatic/direct flight, camera, sound and destination controls. Weather, quality and instructions expand only when requested. **구름 위로** climbs to 2,300 game metres and closes the panel. Start with automatic touring, or use arrow keys / WASD to take control. Up/down changes altitude; left/right turns. Space flies faster, C switches among chase/first-person/orbit views, P pauses, and H hides the interface. Touch flight buttons appear on small screens only during direct flight. The altitude slider inside the travel panel works in either flight mode. Automatic touring lingers at each city before continuing. Three cruising speeds and gradual altitude changes make it easier to enjoy the scenery. Selecting a city moves to its airspace. Visiting cities leaves device-local travel stamps.

Route: Seoul → Incheon → Taean → Mokpo → Yeosu → Tongyeong → Busan → Pohang → Gangneung → Sokcho. The map is compressed for a relaxed journey; buildings, landmarks, terrain elevations and flight speeds are artistic approximations, not a flight simulator or navigational data.

## Weather

The public Open-Meteo forecast endpoint provides current temperature, weather code, cloud cover, wind direction, wind speed, and day/night state for ten fixed city coordinates. No location permissions, personal coordinates or API keys are used. Weather is fetched at launch and every ten minutes, with a ten-second timeout, one-minute manual refresh cooldown, schema validation, and a three-hour freshness limit. The interface explicitly labels demo conditions when current observations cannot be loaded. Ground-level wind is artistically limited for gentle flying; clouds and atmosphere respond to weather. Optional clear/cloudy/rain/sunset/night/snow presets are explicitly demo modes. World-space volumetric clouds drift with the wind. A depth-aware raymarch integrates light through the cloud layer, allowing flight below, inside and above it. Night scenes include stars, a moon and illuminated windows; rain and snow use separate particle effects.

## Graphics

- NASA Blue Marble cloud-free historical imagery, stored locally as a 4096 × 4096 WebP; this is not live or street-resolution imagery.
- A 1025 × 1025 elevation grid assembled from 48 Mapzen Terrain Tiles, with a 512 × 512 terrain mesh split into frustum-culled patches.
- Atmospheric sky scattering with a blue upper-sky grade, cloud self-shading and scattered cloud regions, warm sunset lighting, a Fresnel water shader with moving wave normals, and multisampled scene rendering. The separate built-in Sky cloud layer is disabled to avoid duplicate clouds.
- An original Blender electric skywing with swept airfoil wings, raked tips, a butterfly tail, twin ducted fans, a panoramic canopy and copper/carbon detailing; original Blender broadleaf and Seoul tower assets.
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
- GLB skywing, glider, broadleaf tree, Seoul tower, Namsan tower, pavilion and lighthouse: original Blender geometry generated for this project.
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
