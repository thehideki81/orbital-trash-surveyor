<script setup>
import { TresCanvas } from '@tresjs/core'
import GlobeScene from './components/GlobeScene.vue'
import AppHeader from './components/AppHeader.vue'
import ControlPanel from './components/ControlPanel.vue'
import Legend from './components/Legend.vue'
import { useGlobeHover } from './composables/useGlobeHover'

// Layout: a top header, then a row of [control panel | viewport | legend]. The viewport flexes
// so the globe centers in the gap between the panels — they never occlude it, at any width.
// The cursor over the viewport reflects globe hover (shared reactive state from Earth's Tres
// pointer events).
const { hovering } = useGlobeHover()
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <div class="body">
      <ControlPanel />
      <main class="viewport" :style="{ cursor: hovering ? 'move' : 'default' }">
        <TresCanvas clear-color="#05070f">
          <GlobeScene />
        </TresCanvas>
      </main>
      <Legend />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}
/* The viewport takes the space between the two panels; the canvas sizes to this box
   (ResizeObserver), so the globe is always centered and never occluded. */
.viewport {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
</style>
