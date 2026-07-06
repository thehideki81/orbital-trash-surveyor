import { ref, reactive } from 'vue'

// Bridge between the header/panel UI (outside the canvas) and the scene camera (inside it).
// The UI can't reach the Tres context, so it bumps reactive counters and the scene watches them
// — idiomatic one-way reactive triggers, no imperative cross-component calls.
const alignRequest = ref(0)

// Camera zoom (distance to the globe). `distance` mirrors the live camera distance so the slider
// reflects mouse-wheel zoom; bumping `applyRequest` asks the scene to push `distance` onto the
// camera. Kept in sync both ways by GlobeScene.
const zoom = reactive({ distance: 20, applyRequest: 0 })

export function useGlobeView() {
  const alignToGreenwich = () => {
    alignRequest.value++
  }
  const setDistance = (d) => {
    zoom.distance = d
    zoom.applyRequest++
  }
  return { alignRequest, zoom, alignToGreenwich, setDistance }
}
