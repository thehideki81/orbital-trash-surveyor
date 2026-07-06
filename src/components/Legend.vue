<script setup>
import { computed } from 'vue'
import { useCatalog } from '../composables/useCatalog'
import { useOrbitData } from '../composables/useOrbitData'

// Right panel: per-field legend with the CelesTrak source of each layer, plus provenance
// (snapshot capture date / live indicator) and a short note on the data + propagation model.
const { fields } = useCatalog()
const orbit = useOrbitData()

const SNAPSHOT_DATE = '2026-07-06'
const modeLabel = computed(() => (orbit.state.mode === 'live' ? 'Live · CelesTrak' : `Snapshot · ${SNAPSHOT_DATE}`))
</script>

<template>
  <aside class="legend">
    <section class="block">
      <h2 class="block-title">Sources</h2>
      <ul class="items">
        <li v-for="f in fields" :key="f.id" class="item" :class="{ dim: !f.visible }">
          <span class="swatch" :style="{ background: f.color, color: f.color }"></span>
          <div class="meta">
            <span class="label">{{ f.label }}</span>
            <span class="source">{{ f.source }}</span>
          </div>
          <span class="count">{{ f.count.toLocaleString() }}</span>
        </li>
      </ul>
    </section>

    <section class="block provenance">
      <h2 class="block-title">Data</h2>
      <div class="mode-row">
        <span class="dot" :class="{ live: orbit.state.mode === 'live' }"></span>
        <span>{{ modeLabel }}</span>
      </div>
      <p class="note">
        NORAD two-line elements from the public
        <a href="https://celestrak.org" target="_blank" rel="noopener">CelesTrak</a> GP API,
        propagated per-frame with SGP4. Positions render in the inertial frame; the Earth spins
        by GMST. Debris behind the globe is occluded — a real line-of-sight view.
      </p>
    </section>
  </aside>
</template>

<style scoped>
.legend {
  width: 250px;
  flex: 0 0 250px;
  height: 100%;
  box-sizing: border-box;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  color: #d6deee;
  background: linear-gradient(180deg, rgba(14, 19, 32, 0.72) 0%, rgba(9, 13, 24, 0.6) 100%);
  border-left: 1px solid rgba(148, 176, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.block-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8595b3;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: opacity 0.15s ease;
}
.item.dim {
  opacity: 0.4;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
  box-shadow: 0 0 6px currentColor;
}
.meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}
.label {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.source {
  font-size: 10.5px;
  color: #7c88a4;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #93a1bd;
  flex: 0 0 auto;
}

.mode-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #c3cee2;
  margin-bottom: 10px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7794;
}
.dot.live {
  background: #57e08a;
  box-shadow: 0 0 8px rgba(87, 224, 138, 0.7);
}
.note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #8f9cb8;
}
.note a {
  color: #7fb0ff;
  text-decoration: none;
}
.note a:hover {
  text-decoration: underline;
}
</style>
