---
name: vue-best-practices
description: Vue 3 best practices for this project — Composition API / `<script setup>` idioms, the reactivity boundary (reactive UI state vs. imperative per-frame mutation), composable design, one-way props/emits flow, computed-over-watch, and `shallowRef` for Three.js/satrec objects. Invoke before editing any `.vue` component or anything under `src/composables/`.
---

# Vue 3 best practices (this project)

Vue 3 + `<script setup>` SFCs, driving a TresJS/Three.js scene. The load-bearing rule is the
**reactivity boundary**: Vue reactivity runs the UI; the per-frame render path is imperative.

## Quick rules
- `<script setup>` only. One responsibility per unit: **component** = render + local UI; **composable** = shared reactive state + behavior; **`lib/`** = pure functions (no Vue, no scene objects).
- **Never mutate a prop.** Props down, events up (`defineProps` / `defineEmits`).
- **`computed` for derived state; `watch` only for side effects.** Don't recompute in a `watch`+`ref`.
- **`shallowRef` for large / non-plain objects** (THREE objects, satrec arrays). Never make a Three.js object or a per-frame value deeply `reactive`.
- **Nothing read every frame goes through reactive state.** Per-frame writes mutate `shallowRef`'d objects / `BufferAttribute`s directly inside `useLoop().onBeforeRender`.
- Comments explain **WHY**, never WHAT; no change-narration, no plan jargon (`plan §7`) in code.

## Component structure
- `<script setup>` with `defineProps({ … })` (typed, `required`/defaults declared) and `defineEmits([...])`. Expose an imperative API with `defineExpose({ … })` only when a parent must drive it each frame (e.g. `Earth.vue`'s `spin`).
- Keep the component's job small: `ControlPanel` reads/writes shared reactive state and never touches the scene; `DebrisField` owns one field's THREE object; `GlobeScene` owns the single render loop. Don't blur these.
- Watch a prop via a getter — `watch(() => props.field.visible, …)` — never a destructured `props.x` (destructuring drops reactivity; use `toRefs`/`toRef` if you must pull one out).
- Lifecycle owns imperative resources: build in `onMounted`, and **always dispose geometry + material** in `onBeforeUnmount` / on rebuild (`disposeObject` pattern in `DebrisField.vue`). No leaks across data-mode/refresh.
- `{ flush: 'post' }` on a `watch` when the effect needs the DOM/material to already exist (see `Earth.vue`'s texture `needsUpdate`).

## Reactivity — the boundary (the most important rule)
- **Reactive** (`ref`/`reactive`/`computed`): UI state only — toggles, sliders (warp, time-of-day), counts, data mode, and construction-time config. This is where Vue earns its keep.
- **Imperative**: SGP4 positions, Earth spin, sun direction — mutate typed arrays / object transforms in the loop, then set `attributes.position.needsUpdate = true`. A reactive object costs ~25× a plain one per access; at 60 fps over thousands of points that is the whole frame budget.
- Keep the hot value out of reactive state entirely: `useSimClock`'s `simTime` is a plain `Date`, only `warp`/`dayMinutes`/`dateLabel` are reactive, and the readout is synced *throttled* from the loop — copy that pattern.
- `:args` (TresJS) is construction-time-immutable — changing it reconstructs the object. Use props/pierced props for mutable values.

## Composables
- Name `useX`; return an object of reactive state + functions. One concern each (`useCatalog` = the fields list, `useOrbitData` = TLE loading, `useSimClock` = the clock, `useBackground` = the star toggle).
- This project uses **module-singleton** composables (state declared at module scope) so every component shares one source of truth — correct here. Only do that for genuinely global state; per-instance state stays inside the function.
- Large mutable data (satrec arrays) lives in plain module vars, not reactive — expose a reactive `revision` counter to signal "rebuild" instead (see `useOrbitData`). 
- Clean up side effects (`onScopeDispose` / the owning component's `onBeforeUnmount`).

## Templates
- Declarative and thin — no heavy logic in the template; derive with `computed`.
- Every `v-for` has a stable `:key`; never `v-if` and `v-for` on the same element.
- `v-model` for two-way UI bindings (checkboxes, sliders); `:value` + `@input` when you need to transform on the way in (see the time-of-day scrub).

## `lib/` stays pure
- Pure functions, framework-free (no Vue, no held scene state): `tle` (parse), `propagate` (SGP4→scene), `frames` (scale/axes), `sun` (solar dir). Trivially unit-testable and reusable.
- **One source of truth** for shared math: the TEME→scene axis map lives in `frames.js` — route every conversion through it, don't re-inline `[x/1000, z/1000, -y/1000]`.

## Bug fixes
- Fix the class, not the symptom, and prefer making the illegal state unrepresentable (typed prop, single source of truth) over a guard. When a suite exists, add a regression test that fails without the fix; `lib/` pure functions are the natural unit-test target.
