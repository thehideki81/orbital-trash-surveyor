import { reactive } from 'vue'

// The simulation clock.
//  - `state.warp` / `state.autoRotate` / `state.dayMinutes` / `state.dateLabel` are REACTIVE (UI).
//  - `simTime` and `referenceDate` are imperative Dates; `simTime` changes every frame, so it is
//    kept OUT of reactive state (per-frame reactivity would be a perf hazard, plan §7).
//
// The DATE is anchored to the source data (the TLE epoch, set via setDataDate) so the Sun and
// SGP4 propagation match the data rather than the wall clock. The time-of-day is expressed in
// Finnish local time (Europe/Helsinki) and defaults to the current Finnish time-of-day.

const TZ = 'Europe/Helsinki'

// Offset (ms) of the timezone from UTC at the given instant (positive east of UTC).
function tzOffsetMs(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(date)
  const p = {}
  for (const part of parts) p[part.type] = part.value
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
  return asUTC - date.getTime()
}

// Helsinki wall-clock minute-of-day for an instant.
function helsinkiMinutesOf(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const p = {}
  for (const part of parts) p[part.type] = part.value
  return (+p.hour % 24) * 60 + +p.minute
}

// Helsinki calendar Y/M/D for an instant.
function helsinkiYMD(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(date)
  const p = {}
  for (const part of parts) p[part.type] = part.value
  return { y: +p.year, m: +p.month, d: +p.day }
}

// Absolute instant for "the reference date (Helsinki) at the given minute-of-day".
function helsinkiDateAt(baseDate, minutes) {
  const { y, m, d } = helsinkiYMD(baseDate)
  const asUTC = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0)
  return new Date(asUTC - tzOffsetMs(baseDate))
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(date)
}

// Format a minute-of-day as HH:MM.
export function formatDayMinutes(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(Math.round(minutes) % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// Module-level singleton so every component shares one clock. Until the data loads, the reference
// date falls back to "now" so the scene renders immediately; setDataDate then anchors it.
let referenceDate = new Date()
const state = reactive({
  warp: 300,
  autoRotate: false,
  dayMinutes: helsinkiMinutesOf(referenceDate), // defaults to current Finnish time-of-day
  dateLabel: formatDate(referenceDate),
})
let simTime = helsinkiDateAt(referenceDate, state.dayMinutes)

// Advance one frame (seconds since last frame). Returns the current sim Date.
function advance(delta) {
  simTime = new Date(simTime.getTime() + delta * state.warp * 1000)
  return simTime
}

function now() {
  return simTime
}

// Anchor the simulation date to the source data (the TLE epoch), keeping the chosen time-of-day.
function setDataDate(date) {
  if (!date || Number.isNaN(date.getTime())) return
  referenceDate = date
  state.dateLabel = formatDate(date)
  simTime = helsinkiDateAt(referenceDate, state.dayMinutes)
}

// User scrubbed the time-of-day slider: set the clock to that Helsinki time on the reference date.
function setDayMinutes(minutes) {
  state.dayMinutes = minutes
  simTime = helsinkiDateAt(referenceDate, minutes)
}

// Keep the reactive readout in step with the advancing clock (called throttled from the loop).
function syncDayMinutes() {
  state.dayMinutes = helsinkiMinutesOf(simTime)
}

export function useSimClock() {
  return { state, advance, now, setDataDate, setDayMinutes, syncDayMinutes }
}
