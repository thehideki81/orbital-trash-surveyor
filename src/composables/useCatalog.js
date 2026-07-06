import { reactive } from 'vue'
import catalogData from '../../data/catalog.json'

// Single source of truth for both the scene v-for and the UI. Imports catalog.json at build
// time (Vite JSON import) so adding a field = append one entry + drop a .tle (no code change;
// the reactive fields[] then drives a new DebrisField AND its toggle/legend row automatically).

// Derive a human-readable source label from the CelesTrak liveUrl query (GROUP=... / CATNR=...).
function sourceLabel(liveUrl) {
  try {
    const q = new URL(liveUrl).searchParams
    if (q.has('GROUP')) return `GROUP=${q.get('GROUP')}`
    if (q.has('CATNR')) return `CATNR=${q.get('CATNR')}`
    if (q.has('INTDES')) return `INTDES=${q.get('INTDES')}`
  } catch {
    /* ignore malformed URL */
  }
  return 'CelesTrak'
}

// Module-level singleton so every component shares one reactive fields[] array.
const fields = reactive(
  catalogData.map((f) => ({
    ...f,
    visible: f.enabled !== false, // initial visibility from `enabled`
    count: 0, // live object count, set by useOrbitData once loaded
    source: sourceLabel(f.liveUrl),
  })),
)

export function useCatalog() {
  return { fields }
}
