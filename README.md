# 바람결 — Korea Sky Journey

A quiet Three.js flight game above a stylized Korea, with models authored in Blender through Blender MCP.

## Play

Start with automatic touring, or use arrow keys / WASD to take control. Up/down changes altitude; left/right turns. Space flies faster, C switches among chase/first-person/orbit views, P pauses, and H hides the interface. Touch flight buttons are available on small screens. The altitude slider works in either flight mode. Selecting a city moves to its airspace. Visiting cities leaves device-local travel stamps.

Route: Seoul → Incheon → Taean → Mokpo → Yeosu → Tongyeong → Busan → Pohang → Gangneung → Sokcho. The map is compressed for a relaxed journey; buildings, landmarks, terrain elevations and flight speeds are artistic approximations, not a flight simulator or navigational data.

## Weather

The public Open-Meteo forecast endpoint provides current temperature, weather code, cloud cover, wind direction, wind speed, and day/night state for ten fixed city coordinates. No location permissions, personal coordinates or API keys are used. Weather is fetched at launch and every ten minutes, with a ten-second timeout, one-minute manual refresh cooldown, schema validation, and a three-hour freshness limit. The interface explicitly labels demo conditions when current observations cannot be loaded. Ground-level wind is artistically limited for gentle flying; clouds and atmosphere respond to weather. Optional clear/cloudy/rain/sunset presets are explicitly demo modes.

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
```

The initial models were generated using the community Blender MCP server version 1.9.1 with telemetry disabled and its Blender socket bound to 127.0.0.1. The Blender authoring integration is local tooling and is not included in or called by the deployed game. Higgsfield is not a runtime dependency; its account connection was not completed during this build.

## Security and privacy

- No secrets, authentication, payment, tracking scripts, uploads or user-provided HTML.
- Weather requests are HTTPS, omit credentials, and suppress referrer transmission.
- Remote weather values are validated and displayed using textContent.
- JavaScript and assets are hosted together. CSP limits executable scripts to the same origin and API requests to Open-Meteo.
- Inline styling is allowed for positioned HUD elements; inline scripts and eval are not allowed.
- Third-party links use `noopener noreferrer`.
- Dependencies and GitHub Actions are pinned; CI uses minimal permissions and audits dependencies.
- Local storage contains only visited city indexes. Browser storage can be unavailable without breaking the game.
- WebGL context loss is handled with a recovery message. Rendering pauses logically when focus is lost. Frame deltas are bounded.

Known limitations: GitHub Pages does not provide arbitrary response-header configuration, so CSP is delivered via HTML meta. Browser interaction/visual QA still requires an unlocked desktop. Automated tests cover simulation direction, wind, terrain clearance, altitude limits, weather validation and model integrity, but are not a guarantee that the application has no vulnerabilities.

## Attribution

- Rendering: [Three.js](https://threejs.org/), MIT.
- Coastline: [Natural Earth 1:50m countries](https://www.naturalearthdata.com/), public domain. Source: `nvkelso/natural-earth-vector`, `ne_50m_admin_0_countries.geojson`; Korean peninsula geometries extracted locally.
- Weather: [Open-Meteo](https://open-meteo.com/), weather data under CC BY 4.0; free endpoint is for non-commercial use and subject to provider limits.
- GLB glider, tower, pavilion and lighthouse: original Blender geometry generated for this project.
