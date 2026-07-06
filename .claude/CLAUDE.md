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

## Working rules
- **Consult the skills.** Before editing `components/`, `composables/`, or `lib/`, load
  **`vue-best-practices`**; before planning or self-reviewing, load **`principal-engineer`**; for any
  non-trivial/multi-file change, load **`planning`**. They encode the reactivity boundary, the
  one-draw-call rule, and the catalog contract — don't reinvent them from the code.
- **Verification before done (MANDATORY).** After any code edit, run `npm run build`; for a visual or
  behavioral change, confirm it in the running app via `/start` (don't infer render behavior from
  source). Never end a response that edited a file without verifying. Verify = confirm state, not
  improve it — when asked to review, report; don't edit files that are already correct.
- **The reactivity boundary is a contract.** Reactive Vue state is UI-only; per-frame SGP4/spin/sun
  updates mutate `BufferAttribute`s / `shallowRef`'d objects inside `onBeforeRender` — never a reactive
  prop read per frame. Keep the hot path allocation-free.
- **The catalog is the source of truth for fields.** Adding a debris field is a `data/catalog.json`
  entry + a `.tle` — never a component edit, never a hardcoded field id in a component.
- **Comments explain WHY, never WHAT** — no change-narration ("replaces…", "plan §…"), no jargon in
  code. Would it still make sense in two years?
- **Self-update, not memory.** When a correction reveals a gap, update `.claude/` (CLAUDE.md or a
  skill), never memory — one short paragraph per rule; when in doubt it earns its tokens, drop it.
- **Token discipline.** Run checks once, not in a loop; read captured output rather than re-running.
  Stop immediately when told to stop.

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
