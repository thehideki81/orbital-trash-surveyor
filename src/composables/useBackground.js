import { ref } from 'vue'

// Shared toggle for the Milky Way star-map background. The header flips it; the scene applies
// it to scene.background. Plain reactive UI state.
const showBackground = ref(true)

export function useBackground() {
  return { showBackground }
}
