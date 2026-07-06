<script setup>
import { computed } from 'vue'
import { useCatalog } from '../composables/useCatalog'
import { useSimClock, formatDayMinutes } from '../composables/useSimClock'
import { useOrbitData } from '../composables/useOrbitData'
import { useGlobeView } from '../composables/useGlobeView'

// Left panel: layer toggles (with live counts + swatches), time-of-day, time-warp, zoom, data-mode
// switch, refresh. Pure reactive UI — reads/writes shared reactive state, never the scene directly.
const { fields } = useCatalog()
const clock = useSimClock()
const orbit = useOrbitData()
const view = useGlobeView()

const total = computed(() => fields.reduce((sum, f) => sum + (f.count || 0), 0))
const clockLabel = computed(() => formatDayMinutes(clock.state.dayMinutes))

function onScrub(event) {
  clock.setDayMinutes(Number(event.target.value))
}

// Zoom slider maps to camera distance, inverted so dragging right zooms IN (nearer = smaller
// distance). Range mirrors OrbitControls' min/max distance.
const ZOOM_MIN = 10
const ZOOM_MAX = 70
const zoomSlider = computed(() => ZOOM_MIN + ZOOM_MAX - view.zoom.distance)
const zoomPct = computed(() =>
  Math.round(((ZOOM_MAX - view.zoom.distance) / (ZOOM_MAX - ZOOM_MIN)) * 100),
)
function onZoom(event) {
  view.setDistance(ZOOM_MIN + ZOOM_MAX - Number(event.target.value))
}
function setMode(mode) {
  orbit.setMode(mode, fields)
}
function refresh() {
  orbit.refresh(fields)
}
</script>

<template>
  <aside class="panel">
    <section class="block">
      <h2 class="block-title">Layers</h2>
      <ul class="layers">
        <li v-for="f in fields" :key="f.id" class="layer">
          <label class="layer-toggle">
            <input type="checkbox" v-model="f.visible" />
            <span class="swatch" :style="{ background: f.color }"></span>
            <span class="layer-label">{{ f.label }}</span>
          </label>
          <span class="layer-count">{{ f.count.toLocaleString() }}</span>
        </li>
      </ul>
      <div class="total">
        <span>Total tracked</span>
        <span class="total-count">{{ total.toLocaleString() }}</span>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Time of day</h2>
      <input
        class="slider"
        type="range"
        min="0"
        max="1439"
        step="1"
        :value="clock.state.dayMinutes"
        @input="onScrub"
      />
      <div class="warp-readout">
        <span class="clock">{{ clockLabel }}</span>
        <span class="hint">Helsinki</span>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Time warp</h2>
      <input
        class="slider"
        type="range"
        min="1"
        max="5000"
        step="1"
        v-model.number="clock.state.warp"
      />
      <div class="warp-readout">
        <span>{{ clock.state.warp.toLocaleString() }}×</span>
        <span class="hint">{{ clock.state.autoRotate ? 'live' : 'enable Auto-rotate' }}</span>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Zoom</h2>
      <input
        class="slider"
        type="range"
        :min="ZOOM_MIN"
        :max="ZOOM_MAX"
        step="1"
        :value="zoomSlider"
        @input="onZoom"
      />
      <div class="warp-readout">
        <span>{{ zoomPct }}%</span>
        <span class="hint">out — in</span>
      </div>
    </section>

    <section class="block">
      <h2 class="block-title">Data source</h2>
      <div class="segmented">
        <button :class="{ active: orbit.state.mode === 'snapshot' }" @click="setMode('snapshot')">
          Snapshot
        </button>
        <button :class="{ active: orbit.state.mode === 'live' }" @click="setMode('live')">
          Live
        </button>
      </div>
      <button class="refresh" @click="refresh">Refresh from CelesTrak</button>
      <p v-if="orbit.state.notice" class="notice" :class="orbit.state.noticeKind">
        {{ orbit.state.notice }}
      </p>
    </section>
  </aside>
</template>

<style scoped>
.panel {
  width: 244px;
  flex: 0 0 244px;
  height: 100%;
  box-sizing: border-box;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  color: #d6deee;
  background: linear-gradient(180deg, rgba(14, 19, 32, 0.72) 0%, rgba(9, 13, 24, 0.6) 100%);
  border-right: 1px solid rgba(148, 176, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.block-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8595b3;
}

.layers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.layer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.layer-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  min-width: 0;
}
.layer-toggle input {
  width: 14px;
  height: 14px;
  accent-color: #4ea1ff;
  cursor: pointer;
  flex: 0 0 auto;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
  box-shadow: 0 0 6px currentColor;
}
.layer-label {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layer-count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #93a1bd;
  flex: 0 0 auto;
}

.total {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 176, 255, 0.08);
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #aab6d0;
}
.total-count {
  font-variant-numeric: tabular-nums;
  color: #e7ecf6;
  font-weight: 600;
}

.slider {
  width: 100%;
  accent-color: #4ea1ff;
  cursor: pointer;
}
.warp-readout {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #e7ecf6;
}
.warp-readout .hint {
  font-size: 11px;
  color: #77839e;
  font-variant-numeric: normal;
}
.warp-readout .clock {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.segmented {
  display: flex;
  gap: 0;
  border: 1px solid rgba(120, 160, 240, 0.2);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}
.segmented button {
  flex: 1;
  font: inherit;
  font-size: 12px;
  padding: 7px 0;
  border: 0;
  background: transparent;
  color: #9aa7c4;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.segmented button.active {
  background: rgba(78, 161, 255, 0.22);
  color: #eaf1ff;
}

.refresh {
  width: 100%;
  font: inherit;
  font-size: 12.5px;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid rgba(120, 160, 240, 0.24);
  background: linear-gradient(180deg, rgba(60, 95, 170, 0.24), rgba(38, 62, 115, 0.18));
  color: #cfe0ff;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.refresh:hover {
  border-color: rgba(150, 185, 255, 0.45);
  background: linear-gradient(180deg, rgba(72, 112, 200, 0.3), rgba(46, 74, 135, 0.22));
}

.notice {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.35;
  padding: 7px 9px;
  border-radius: 6px;
  background: rgba(78, 161, 255, 0.12);
  color: #bcd2f5;
}
.notice.warn {
  background: rgba(255, 179, 0, 0.14);
  color: #ffd98a;
}
</style>
