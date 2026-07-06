<script setup>
import { shallowRef, watch, onBeforeUnmount } from 'vue'
import { TextureLoader, SRGBColorSpace, EquirectangularReflectionMapping, MathUtils } from 'three'
import { useLoop, useTresContext } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import { gstime } from 'satellite.js'
import Earth from './Earth.vue'
import DebrisField from './DebrisField.vue'
import { useSimClock } from '../composables/useSimClock'
import { useGlobeView } from '../composables/useGlobeView'
import { useCatalog } from '../composables/useCatalog'
import { useBackground } from '../composables/useBackground'
import { sunSceneDirection } from '../lib/sun'

// GlobeScene owns the single render loop: advance the sim clock, spin the Earth by GMST, and
// update each visible debris field. All per-frame work here is imperative — no reactive props
// are written in the hot path (plan §7).

const clock = useSimClock()
const earth = shallowRef(null)
const SUN_DISTANCE = 100
// The "sun": a declarative <TresDirectionalLight> whose position we set each frame to the real
// solar direction — template ref + imperative hot-path update, the same pattern as the Earth mesh.
const sun = shallowRef(null)

// Catalog-driven fields: each entry renders a DebrisField automatically (data-driven — adding a
// catalog entry + .tle adds a field with no code change).
const { fields } = useCatalog()

const ctx = useTresContext()
const { camera, controls, scene, sizes } = ctx

// --- render loop ------------------------------------------------------------------------
// While NOT auto-rotating, keep the globe visually fixed as the user scrubs time: rotate the
// camera's azimuth by the same GMST change the Earth undergoes, so the same face stays centered
// (debris then sweep over a stationary-looking globe). During auto-rotate we let the globe spin.
let lastGmst = null
let readoutAccum = 0
let zoomAccum = 0

function trackEarthSpin(deltaGmst) {
  const cam = camera.activeCamera.value
  if (!cam) return
  // Rotate the camera position by the SAME Y rotation the Earth mesh undergoes (Ry(Δgmst)),
  // so the relative geometry — and thus the visible face — is unchanged. Preserves the user's
  // current latitude and zoom (Ry keeps y and radius).
  const cos = Math.cos(deltaGmst)
  const sin = Math.sin(deltaGmst)
  const { x, z } = cam.position
  cam.position.x = x * cos + z * sin
  cam.position.z = -x * sin + z * cos
  cam.lookAt(0, 0, 0)
  controls.value?.update()
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const auto = clock.state.autoRotate
  const now = auto ? clock.advance(delta) : clock.now()
  const gmst = gstime(now)
  earth.value?.spin(gmst)

  // Point the "sun" directional light at the real solar direction for this instant, so the
  // day/night terminator is physically correct and tracks the time-of-day scrub.
  if (sun.value) {
    const s = sunSceneDirection(now)
    sun.value.position.set(s[0] * SUN_DISTANCE, s[1] * SUN_DISTANCE, s[2] * SUN_DISTANCE)
  }

  if (lastGmst === null) lastGmst = gmst
  if (!auto && gmst !== lastGmst) trackEarthSpin(gmst - lastGmst) // compensate on time scrub
  lastGmst = gmst

  if (auto) {
    readoutAccum += delta
    if (readoutAccum >= 0.1) {
      clock.syncDayMinutes()
      readoutAccum = 0
    }
  }

  // Reflect mouse-wheel zoom back into the slider (throttled; only writes on change).
  zoomAccum += delta
  if (zoomAccum >= 0.1) {
    const cam = camera.activeCamera.value
    if (cam) {
      const d = Math.round(cam.position.length())
      if (d !== zoom.distance) zoom.distance = d
    }
    zoomAccum = 0
  }
})

// --- responsive framing -----------------------------------------------------------------
// Frame the whole orbital envelope (debris shells reach well beyond the globe), with margin, so
// nothing clips on any side. The camera sits back at DEFAULT_DISTANCE (vertical half-extent
// ≈ 25·tan(22.5°) ≈ 10.4 units vs the globe's 6.371), giving space around the debris.
// Three's fov is vertical, so a narrow window would crop horizontally — keep it "contained" by
// using the reference vfov in landscape and widening it in portrait so the horizontal extent is
// preserved. Independent of zoom (depends only on aspect).
const DEFAULT_DISTANCE = 20
// Stable array reference for the camera's initial position. A fresh inline literal like
// `[0, 0, DEFAULT_DISTANCE]` is recreated every render and re-applied by Tres, which would reset
// the camera (clobbering the Greenwich alignment) on any reactive update. A stable const isn't
// re-applied, so alignment and OrbitControls own the camera after mount.
const CAMERA_START = [0, 0, DEFAULT_DISTANCE]
const REF_VFOV = 45
function updateFraming(aspect) {
  const cam = camera.activeCamera.value
  if (!cam || !aspect) return
  const halfRef = MathUtils.degToRad(REF_VFOV) / 2
  const vfov = aspect >= 1 ? REF_VFOV : MathUtils.radToDeg(2 * Math.atan(Math.tan(halfRef) / aspect))
  cam.fov = Math.min(vfov, 100)
  cam.updateProjectionMatrix()
}
watch(() => sizes.aspectRatio.value, updateFraming, { immediate: true })
// Also apply once the camera exists (aspect may settle after the camera mounts).
watch(() => camera.activeCamera.value, () => updateFraming(sizes.aspectRatio.value))

// --- Milky Way background ----------------------------------------------------------------
// Equirectangular star map applied as scene.background; toggled from the header. Kept off the
// clear-color so it can be turned off cleanly.
const { showBackground } = useBackground()
const starMap = shallowRef(null)
new TextureLoader().load('/textures/milkyway.jpg', (tex) => {
  tex.colorSpace = SRGBColorSpace
  tex.mapping = EquirectangularReflectionMapping
  starMap.value = tex
  applyBackground()
})
function applyBackground() {
  const s = scene.value
  if (!s) return
  s.background = showBackground.value ? starMap.value : null
}
watch(showBackground, applyBackground)
watch(() => scene.value, applyBackground)
onBeforeUnmount(() => starMap.value?.dispose())

// --- Greenwich alignment ----------------------------------------------------------------
// Point the camera at the prime meridian. The meridian's inertial direction is (cos g, sin g, 0)
// in ECI → (cos g, 0, -sin g) in scene axes. We move the CAMERA there (not the globe) so orbits
// stay physically consistent. Used on first render and by the header's "Greenwich" button.
const { alignRequest, zoom } = useGlobeView()

// Zoom slider ⇄ camera distance. Applying scales the camera position to the requested distance
// (direction preserved); the loop reflects mouse-wheel zoom back into the slider.
function applyDistance(d) {
  const cam = camera.activeCamera.value
  if (!cam) return
  const len = cam.position.length()
  if (len > 0) cam.position.multiplyScalar(d / len)
  cam.lookAt(0, 0, 0)
  controls.value?.update()
}
watch(() => zoom.applyRequest, () => applyDistance(zoom.distance))

function alignToGreenwich() {
  const cam = camera.activeCamera.value
  if (!cam) return
  const g = gstime(clock.now())
  const dist = cam.position.length() || DEFAULT_DISTANCE
  cam.position.set(Math.cos(g) * dist, 0, -Math.sin(g) * dist)
  cam.up.set(0, 1, 0)
  cam.lookAt(0, 0, 0)
  const c = controls.value
  if (c) {
    c.target.set(0, 0, 0)
    c.update()
  }
  lastGmst = g
}

watch(alignRequest, alignToGreenwich)
watch(() => camera.activeCamera.value, (cam) => { if (cam) alignToGreenwich() }, { immediate: true })
</script>

<template>
  <TresPerspectiveCamera :position="CAMERA_START" :fov="45" :near="0.1" :far="1000" />
  <OrbitControls :min-distance="10" :max-distance="70" :enable-pan="false" />

  <TresAmbientLight :intensity="0.28" />
  <TresDirectionalLight ref="sun" color="#fff8f0" :intensity="1.7" />

  <Earth ref="earth" />

  <DebrisField v-for="f in fields" :key="f.id" :field="f" />
</template>
