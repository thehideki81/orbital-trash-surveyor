// Coordinate frame + scale helpers shared by the Earth and every debris field.
//
// Scene scale: 1 unit = 1000 km. SGP4 returns positions in TEME km; we treat TEME as
// ECI for this visual POC (see plan §11/§13) and only the Earth spins (by GMST).
//
// Axis mapping: SGP4/TEME is Z-up (north pole = +Z). Three.js is Y-up. We map
//   scene.x =  eci.x / 1000
//   scene.y =  eci.z / 1000      (north pole -> +Y)
//   scene.z = -eci.y / 1000      (keep right-handed)
// The SAME mapping is applied to the Earth's spin axis (+Y) so the poles line up.

export const KM_PER_UNIT = 1000
export const EARTH_RADIUS_KM = 6371
export const EARTH_RADIUS_UNITS = EARTH_RADIUS_KM / KM_PER_UNIT // 6.371

// Write a single TEME/ECI km vector {x,y,z} into a Float32Array at offset `i*3`,
// converting to scene units + axes. Allocation-free (no intermediate objects).
export function eciToSceneInto(arr, i, ex, ey, ez) {
  const o = i * 3
  arr[o] = ex / KM_PER_UNIT
  arr[o + 1] = ez / KM_PER_UNIT
  arr[o + 2] = -ey / KM_PER_UNIT
}

// Convenience for one-off conversions (e.g. the ISS marker); returns a 3-tuple.
export function eciToScene({ x, y, z }) {
  return [x / KM_PER_UNIT, z / KM_PER_UNIT, -y / KM_PER_UNIT]
}
