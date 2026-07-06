// Low-precision solar position: the Sun's unit direction in ECI (equatorial) coordinates for a
// given instant, mapped into scene axes so it lines up with the GMST-oriented Earth. Good to a
// fraction of a degree — plenty for a correct-looking day/night terminator.
//
// Algorithm: NOAA / U.S. Naval Observatory "Approximate Solar Coordinates".

const DEG = Math.PI / 180

export function sunSceneDirection(date) {
  const jd = date.getTime() / 86400000 + 2440587.5 // Unix ms → Julian Date
  const n = jd - 2451545.0 // days since J2000.0

  const L = (280.46 + 0.9856474 * n) * DEG // mean longitude
  const g = (357.528 + 0.9856003 * n) * DEG // mean anomaly
  const lambda = L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG // ecliptic longitude
  const eps = (23.439 - 0.0000004 * n) * DEG // obliquity of the ecliptic

  // Sun unit vector in ECI equatorial frame (X = vernal equinox, Z = north pole).
  const x = Math.cos(lambda)
  const y = Math.cos(eps) * Math.sin(lambda)
  const z = Math.sin(eps) * Math.sin(lambda)

  // ECI → scene axes (same mapping as frames.js: x, z, -y). Scene +Y = north pole.
  return [x, z, -y]
}
