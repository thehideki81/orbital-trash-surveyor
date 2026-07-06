# Orbital Trash Surveyor

Browser-based 3D visualization: a rotating Earth with the ISS and orbital-debris
fields rendered at their real orbits, propagated from NORAD TLE data (CelesTrak).
POC. **Adding more debris fields must stay trivial (data-driven).**

## Status
**Implemented — working POC.** See `README.md` for features/run and `data/README.md` for data
provenance.

## Stack
- **Vite + Vue 3** (`<script setup>` SFCs)
- **TresJS** (`@tresjs/core`) — declarative Vue custom-renderer for Three.js; **`@tresjs/cientos`** for `<OrbitControls>`/helpers
- **`three`** (peer dep of Tres)
- **`satellite.js`** — SGP4 propagation of TLEs → ECI position/velocity, plus `gstime` (GMST)
- **Data**: CelesTrak GP API — snapshot `.tle` files committed in `data/` + optional live refresh

## Architecture — the core rule (declarative shell, imperative hot path)
- **Declarative Tres** for the scene shell only: `<TresCanvas>`, `<TresPerspectiveCamera>`, cientos `<OrbitControls>`, ambient + a Sun `<TresDirectionalLight>` (repositioned per frame → real day/night terminator), and the Earth (`<TresMesh>`). The star field is the equirectangular `scene.background` (`public/textures/milkyway.jpg`), not a scene object.
- **Imperative `THREE.Points` via `<primitive :object="…">`** for each debris field — one `BufferGeometry` / one draw call for thousands of fragments. ISS = a marker + orbit trail, also imperative via `<primitive>`.
- **Reactivity boundary (perf-critical, from TresJS docs — reactive obj ≈2M ops/s vs plain ≈50M ops/s):**
  - **Reactive** Vue state ONLY for UI (field toggles, time-warp, data mode, counts) and initial config.
  - **Per-frame** SGP4 position updates and Earth spin **mutate BufferAttributes / `shallowRef`'d objects directly** inside `useLoop().onBeforeRender` — **never** via reactive props.
- `:args` only for construction-time immutable values (changing `:args` reconstructs the object).

## Extensibility (mandatory requirement)
Debris fields are data-driven via **`data/catalog.json`**. To add a field: drop a `<name>.tle`
snapshot in `data/` and add one catalog entry. The reactive `fields[]` then renders both a new
`<DebrisField>` scene layer AND its toggle/legend row automatically — **no component edits**.
Each entry carries both a bundled `file` and a `liveUrl`, so sources toggle independently and
non-CelesTrak providers can be added later by pointing `liveUrl` elsewhere.

## Vite requirement (do not omit)
`vite.config.js` must spread Tres's template-compiler options so Tres custom elements compile:
```js
import { templateCompilerOptions } from '@tresjs/core'
// plugins: [vue({ ...templateCompilerOptions })]
```

## Run / verify
- **`/start`** — installs deps if needed, launches the Vite dev server on the fixed port **5173**
  (`--strictPort`), and prints the accessible URL (**http://localhost:5173/**). **`/stop`** kills it.
- Manual equivalent: `npm install` → `npm run dev -- --port 5173 --strictPort` → open the URL.
- **Verified behavior:** GMST-lit Earth with a day/night terminator; ISS marker + trail; five debris
  clouds (see As-built); field toggles + star-map toggle + time-of-day scrubber (Helsinki default) +
  time-warp + Snapshot⇄Live + Refresh all work; live counts update; adding a `catalog.json` entry +
  `.tle` adds a field with no code change (verified live).

## Implementation notes
- **Fields:** `iss`, `cosmos-2251`, `iridium-33`, `fengyun-1c`, `analyst` (uncorrelated / unidentified
  tracked objects). Any CelesTrak group works — add e.g. `GROUP=cosmos-1408-debris` as a catalog entry.
- **Sim clock:** the date is anchored to the TLE **epoch** so SGP4 stays accurate; the **time-of-day**
  defaults to the current **Helsinki (Finland)** local time and is scrubbable. `simTime` is UTC and kept
  out of reactive state (per the reactivity boundary).
- **Star map:** `scene.background` = `public/textures/milkyway.jpg` (Solar System Scope 8k, CC BY 4.0),
  toggled from the header.
- **Deps:** `@tresjs/cientos` tracks Tres **core v5** (v4 is incompatible).
- **Data loading:** snapshots via `import.meta.glob('../../data/*.tle', {query:'?raw'})` + a JSON import
  of `catalog.json`; Live mode `fetch()`es each `liveUrl` with snapshot fallback.

## Conventions
- CelesTrak is public / no-auth — **no secrets** anywhere.
- Keep the `onBeforeRender` hot path allocation-free where practical (reuse vectors/typed arrays).
- Data files in `data/` are snapshots; capture date is documented in `data/README.md`.
