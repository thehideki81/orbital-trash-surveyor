import { reactive } from 'vue'
import { parseTle, satrecEpoch } from '../lib/tle'
import { useSimClock } from './useSimClock'

// Loads and holds the parsed satrec set for every field. Snapshots are bundled via Vite's
// import.meta.glob (raw text) so adding a data/*.tle is auto-discovered — no code change. Live
// mode re-fetches each field's liveUrl and falls back to the snapshot on any failure.
//
// The satrec arrays are large and mutated in the hot path, so they are kept OUT of reactive
// state. Components observe a per-field `revision` counter (reactive) to know when to rebuild;
// `state` (mode/notice) and each field's `count` are the only reactive, UI-facing bits.

const tleModules = import.meta.glob('../../data/*.tle', { query: '?raw', import: 'default' })
const snapshotByFile = {}
for (const path in tleModules) {
  snapshotByFile[path.split('/').pop()] = tleModules[path]
}

const records = {} // id -> [{ name, line1, line2, satrec }]  (non-reactive)
const revision = reactive({}) // id -> number, bumped when a field's records change
const state = reactive({ mode: 'snapshot', notice: '', noticeKind: 'info' })

const clock = useSimClock()
let dataDateAnchored = false

let noticeTimer = null
function setNotice(message, kind = 'info') {
  state.notice = message
  state.noticeKind = kind
  clearTimeout(noticeTimer)
  if (message) noticeTimer = setTimeout(() => (state.notice = ''), 4500)
}

function getRecords(id) {
  return records[id]
}

async function readSnapshot(field) {
  const loader = snapshotByFile[field.file]
  if (!loader) throw new Error(`snapshot "${field.file}" is not bundled`)
  return loader()
}

async function readLive(field) {
  const res = await fetch(field.liveUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// Load one field's TLEs for the current data mode; returns the parsed records.
async function load(field) {
  let text
  let fellBack = false
  try {
    text = state.mode === 'live' ? await readLive(field) : await readSnapshot(field)
  } catch (err) {
    if (state.mode === 'live') {
      fellBack = true
      text = await readSnapshot(field) // never block render on the network
    } else {
      throw err
    }
  }
  const recs = parseTle(text)
  records[field.id] = recs
  field.count = recs.length
  revision[field.id] = (revision[field.id] || 0) + 1

  // Anchor the sim clock's date to the source data's epoch. Prefer the ISS marker (the hero
  // object) as the canonical reference; otherwise the first field to load seeds it.
  if (recs.length && (!dataDateAnchored || field.render === 'marker')) {
    clock.setDataDate(satrecEpoch(recs[0].satrec))
    dataDateAnchored = true
  }

  if (fellBack) setNotice(`Live fetch failed for ${field.label} — using snapshot.`, 'warn')
  return recs
}

async function loadAll(fields) {
  await Promise.all(fields.map((f) => load(f).catch(() => {})))
}

// Switch snapshot <-> live and reload everything.
async function setMode(mode, fields) {
  if (mode === state.mode) return
  state.mode = mode
  setNotice(mode === 'live' ? 'Fetching live data from CelesTrak…' : 'Loading snapshots…')
  await loadAll(fields)
  if (state.noticeKind !== 'warn') {
    setNotice(mode === 'live' ? 'Live data loaded.' : 'Snapshot data loaded.')
  }
}

// Refresh button: re-fetch the current mode's sources.
async function refresh(fields) {
  setNotice(state.mode === 'live' ? 'Refreshing from CelesTrak…' : 'Reloading snapshots…')
  await loadAll(fields)
  if (state.noticeKind !== 'warn') {
    setNotice(state.mode === 'live' ? 'Refreshed from CelesTrak.' : 'Snapshots reloaded.')
  }
}

export function useOrbitData() {
  return { state, revision, getRecords, load, loadAll, setMode, refresh }
}
