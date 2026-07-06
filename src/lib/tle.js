import { twoline2satrec } from 'satellite.js'

// The epoch of a satrec (the instant its TLE describes), as a Date. This is the authoritative
// "date of the source data" — used to anchor the simulation clock so the Sun and propagation match
// the data rather than the wall clock.
export function satrecEpoch(satrec) {
  const jd = satrec.jdsatepoch + (satrec.jdsatepochF || 0)
  return new Date((jd - 2440587.5) * 86400000)
}

// Parse a CelesTrak .tle text blob (3-line: name + "1 ..." + "2 ...") into satrecs.
// Tolerant: skips blank lines and any malformed record rather than throwing, so one bad
// element line can't break a whole field. Also accepts bare 2-line pairs (no name).
//
// Returns: [{ name, line1, line2, satrec }]
export function parseTle(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, '')) // trim trailing whitespace only
    .filter((l) => l.length > 0)

  const out = []
  let i = 0
  while (i < lines.length) {
    let name = ''
    // A record is optionally a name line followed by "1 " and "2 " element lines.
    if (!lines[i].startsWith('1 ')) {
      name = lines[i].trim()
      i += 1
    }
    const line1 = lines[i]
    const line2 = lines[i + 1]

    if (!line1 || !line2 || !line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      // Not a valid pair here — advance one line and resync.
      i += 1
      continue
    }

    try {
      const satrec = twoline2satrec(line1, line2)
      // satrec.error !== 0 means SGP4 init failed for this element set.
      if (satrec && satrec.error === 0) {
        out.push({ name: name || `NORAD ${satrec.satnum}`, line1, line2, satrec })
      }
    } catch {
      // skip malformed element set
    }
    i += 2
  }

  return out
}
