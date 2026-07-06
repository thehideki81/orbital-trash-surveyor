<script setup>
import { shallowRef, onMounted, watch } from 'vue'
import { TextureLoader, SRGBColorSpace } from 'three'
import { EARTH_RADIUS_UNITS } from '../lib/frames'
import { useGlobeHover } from '../composables/useGlobeHover'

// Declarative Earth mesh (part of the scene "shell", per the architecture rule). The parent
// loop spins it via the exposed template ref; hover is reported through Tres's own pointer
// events into shared reactive state — no manual DOM or raycasting.

// Texture prime-meridian offset: the equirectangular map has lon=0 at its horizontal center
// (u=0.5), which SphereGeometry places at local +X. GMST is the prime meridian's angle from
// +X (vernal equinox), so rotation.y = gmst lines lon=0 up with the inertial frame — no extra
// offset needed. (Calibrated against the "Greenwich" view; adjust by π if a texture is centered
// on 180°.)
const PRIME_MERIDIAN_OFFSET = 0

const meshRef = shallowRef(null)
const materialRef = shallowRef(null)

// Texture loaded into a reactive ref; until it resolves (or if it 404s) the material falls
// back to a solid ocean-blue so the globe is never black. When it arrives, flag the material
// for a one-time shader recompile so the newly-bound map actually takes effect.
const map = shallowRef(null)
onMounted(() => {
  new TextureLoader().load('/textures/earth.jpg', (tex) => {
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    map.value = tex
  })
})
watch(map, () => {
  if (materialRef.value) materialRef.value.needsUpdate = true
}, { flush: 'post' })

const { hovering } = useGlobeHover()

// Spin about +Y (north pole) by GMST. Called from the parent loop each frame.
function spin(gmst) {
  if (meshRef.value) meshRef.value.rotation.y = gmst + PRIME_MERIDIAN_OFFSET
}

defineExpose({ spin })
</script>

<template>
  <TresMesh
    ref="meshRef"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
  >
    <TresSphereGeometry :args="[EARTH_RADIUS_UNITS, 64, 64]" />
    <TresMeshStandardMaterial
      ref="materialRef"
      :map="map"
      :color="map ? '#ffffff' : '#1b3a5b'"
      :roughness="1"
      :metalness="0"
    />
  </TresMesh>
</template>
