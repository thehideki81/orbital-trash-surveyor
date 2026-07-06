<script setup>
import { shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useLoop } from '@tresjs/core'
import { useSimClock } from '../composables/useSimClock'
import { useOrbitData } from '../composables/useOrbitData'
import { positionsInto, positionOf } from '../lib/propagate'

// One field = one draw call. "points" fields are a single THREE.Points over a preallocated
// Float32Array (reused every frame); the "marker" field (ISS) is a small sphere plus an orbit
// trail Line. Built imperatively and mounted via <primitive>, per the architecture rule.
const props = defineProps({ field: { type: Object, required: true } })

const clock = useSimClock()
const orbit = useOrbitData()

const object = shallowRef(null) // THREE.Points | THREE.Group

// points state
let pointsGeom = null
let pointsPos = null

// marker state
let markerMesh = null
let trailGeom = null
let trailPos = null
const TRAIL_SEGMENTS = 400
const TRAIL_STEP_MS = 14_000 // ~14 s/segment → ~90 min ≈ one LEO orbit
const trailDate = new Date() // reused each frame (allocation-free trail sampling)

// Throttle propagation to ~20 Hz, and skip entirely while the sim clock is paused (positions
// don't change) — keeps the hot path light with thousands of objects.
const RECOMPUTE_INTERVAL = 0.05
let accum = 0
let lastSimMs = null

function disposeObject() {
  const o = object.value
  if (!o) return
  o.traverse?.((n) => {
    n.geometry?.dispose?.()
    n.material?.dispose?.()
  })
  object.value = null
  pointsGeom = pointsPos = markerMesh = trailGeom = trailPos = null
}

function buildPoints(records) {
  const n = records.length
  pointsPos = new Float32Array(3 * n)
  pointsGeom = new THREE.BufferGeometry()
  pointsGeom.setAttribute('position', new THREE.BufferAttribute(pointsPos, 3))
  const material = new THREE.PointsMaterial({
    color: props.field.color,
    size: props.field.size ?? 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
  })
  const points = new THREE.Points(pointsGeom, material)
  points.frustumCulled = false // positions live in the buffer; bounds aren't meaningful
  object.value = points
}

function buildMarker() {
  const group = new THREE.Group()
  markerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: props.field.color }),
  )
  group.add(markerMesh)

  trailPos = new Float32Array(3 * TRAIL_SEGMENTS)
  trailGeom = new THREE.BufferGeometry()
  trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeom.setDrawRange(0, 0)
  const trail = new THREE.Line(
    trailGeom,
    new THREE.LineBasicMaterial({ color: props.field.color, transparent: true, opacity: 0.55 }),
  )
  group.add(trail)
  object.value = group
}

function rebuild() {
  disposeObject()
  const records = orbit.getRecords(props.field.id)
  if (!records || records.length === 0) return
  if (props.field.render === 'marker') buildMarker()
  else buildPoints(records)
  if (object.value) object.value.visible = props.field.visible
  lastSimMs = null // force a recompute on the next frame
}

function update(now) {
  const records = orbit.getRecords(props.field.id)
  if (!records) return

  if (props.field.render === 'marker') {
    const iss = records[0]
    const p = positionOf(iss, now)
    if (p) markerMesh.position.set(p[0], p[1], p[2])
    // Redraw the whole trail by sampling the orbit backwards in time (smooth, no ring-buffer seam).
    let seg = 0
    for (let k = TRAIL_SEGMENTS - 1; k >= 0; k--) {
      trailDate.setTime(now.getTime() - k * TRAIL_STEP_MS)
      const q = positionOf(iss, trailDate)
      if (q) {
        const o = seg * 3
        trailPos[o] = q[0]
        trailPos[o + 1] = q[1]
        trailPos[o + 2] = q[2]
        seg++
      }
    }
    trailGeom.setDrawRange(0, seg)
    trailGeom.attributes.position.needsUpdate = true
  } else {
    positionsInto(records, now, pointsPos)
    pointsGeom.attributes.position.needsUpdate = true
  }
}

// Reflect visibility toggles cheaply (no rebuild).
watch(
  () => props.field.visible,
  (v) => {
    if (object.value) object.value.visible = v
  },
)

// Rebuild whenever this field's data changes (initial load, mode switch, refresh).
watch(() => orbit.revision[props.field.id], rebuild)

onMounted(() => {
  orbit.load(props.field) // load this field's snapshot; bumps revision → rebuild
})

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  if (!object.value || !props.field.visible) return
  accum += delta
  const now = clock.now()
  const simMs = now.getTime()
  const timeChanged = simMs !== lastSimMs
  // First compute always runs; after that, only when time advanced and the throttle elapsed.
  if (lastSimMs !== null && (!timeChanged || accum < RECOMPUTE_INTERVAL)) return
  update(now)
  accum = 0
  lastSimMs = simMs
})

onBeforeUnmount(disposeObject)
</script>

<template>
  <primitive v-if="object" :object="object" />
</template>
