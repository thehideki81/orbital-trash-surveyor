import { ref } from 'vue'

// Shared hover state for the globe. Set by the Earth mesh's Tres pointer events, consumed by
// the viewport to drive its cursor. A tiny singleton so the scene and the layout stay decoupled
// without prop-drilling. Plain reactive UI state (not a per-frame value) — reactivity is correct.
const hovering = ref(false)

export function useGlobeHover() {
  return { hovering }
}
