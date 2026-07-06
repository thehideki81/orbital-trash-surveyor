<script setup>
import { useSimClock } from '../composables/useSimClock'
import { useGlobeView } from '../composables/useGlobeView'
import { useBackground } from '../composables/useBackground'

// Minimal top bar: project name on the left, view controls on the right.
// The checkboxes bind directly to shared reactive UI flags; the Greenwich button frames the
// camera on the prime meridian via a shared reactive trigger.
const clock = useSimClock()
const { alignToGreenwich } = useGlobeView()
const { showBackground } = useBackground()
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <span class="mark" aria-hidden="true"></span>
      <h1 class="title">Orbital Trash Surveyor</h1>
    </div>

    <div class="date" title="Date of the orbital source data (TLE epoch)">{{ clock.state.dateLabel }}</div>

    <div class="controls">
      <label class="toggle">
        <input type="checkbox" v-model="showBackground" />
        <span>Star map</span>
      </label>

      <label class="toggle">
        <input type="checkbox" v-model="clock.state.autoRotate" />
        <span>Auto-rotate</span>
      </label>

      <button class="greenwich" type="button" title="Align the view with the Greenwich meridian" @click="alignToGreenwich">
        Greenwich
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 10;
  flex: 0 0 52px;
  height: 52px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 16px;
  padding: 0 20px;
  box-sizing: border-box;
  /* distinct deep indigo/violet header (still dark mode), near-flat gradient + hairline border */
  background: linear-gradient(
    180deg,
    rgba(26, 20, 47, 0.86) 0%,
    rgba(23, 17, 42, 0.82) 100%
  );
  border-bottom: 1px solid rgba(168, 148, 255, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #e7ecf6;
  user-select: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
}

.date {
  justify-self: center;
  font-size: 12.5px;
  letter-spacing: 0.08em;
  color: #9aa7c4;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* small glowing accent dot, subtle radial gradient */
.mark {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #7fb2ff, #2b6bd6 70%);
  box-shadow: 0 0 8px rgba(78, 161, 255, 0.6);
}

.title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #eef3ff, #a9c2ee);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-self: end;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: #c7d2e6;
  cursor: pointer;
}

.toggle input {
  width: 15px;
  height: 15px;
  accent-color: #4ea1ff;
  cursor: pointer;
}

.greenwich {
  font: inherit;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: #cfe0ff;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid rgba(120, 160, 240, 0.28);
  background: linear-gradient(
    180deg,
    rgba(70, 110, 190, 0.28) 0%,
    rgba(40, 70, 130, 0.18) 100%
  );
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.greenwich:hover {
  border-color: rgba(150, 185, 255, 0.5);
  background: linear-gradient(
    180deg,
    rgba(85, 130, 220, 0.36) 0%,
    rgba(50, 85, 155, 0.24) 100%
  );
}

.greenwich:active {
  background: rgba(60, 95, 165, 0.4);
}
</style>
