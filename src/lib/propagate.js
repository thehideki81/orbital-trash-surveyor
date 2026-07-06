import { propagate } from 'satellite.js'
import { eciToSceneInto } from './frames'

// Propagate every satrec to `date` and write scene-space XYZ into a preallocated
// Float32Array (3 floats per object). Allocation-free on the hot path: no per-frame
// object creation, reuses the caller's typed array.
//
// Objects that fail to propagate (decayed / NaN) are written as NaN, which Three.js skips
// when rendering points — so a dead fragment simply doesn't draw rather than snapping to origin.
//
// Returns the count of successfully propagated objects (for live UI counts).
export function positionsInto(records, date, positions) {
  let live = 0
  for (let i = 0; i < records.length; i++) {
    const o = i * 3
    let pv
    try {
      pv = propagate(records[i].satrec, date)
    } catch {
      pv = null
    }
    const p = pv && pv.position
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)) {
      eciToSceneInto(positions, i, p.x, p.y, p.z)
      live++
    } else {
      positions[o] = NaN
      positions[o + 1] = NaN
      positions[o + 2] = NaN
    }
  }
  return live
}

// Single-object variant for the ISS marker: returns a scene-space [x,y,z] or null.
export function positionOf(record, date) {
  let pv
  try {
    pv = propagate(record.satrec, date)
  } catch {
    return null
  }
  const p = pv && pv.position
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return null
  return [p.x / 1000, p.z / 1000, -p.y / 1000]
}
