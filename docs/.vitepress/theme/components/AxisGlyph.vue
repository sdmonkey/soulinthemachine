<script setup>
import { computed } from 'vue'

const props = defineProps({
  code: { type: String, required: true },
  size: { type: Number, default: 132 }
})

const axes = [
  { code: 'BLD', group: 'build' },
  { code: 'REF', group: 'build' },
  { code: 'AUD', group: 'verify' },
  { code: 'DOC', group: 'verify' },
  { code: 'CSR', group: 'communicate' },
  { code: 'NEG', group: 'communicate' },
  { code: 'VOX', group: 'communicate' },
  { code: 'OPS', group: 'operate' },
  { code: 'GOV', group: 'operate' },
  { code: 'ETH', group: 'operate' }
]

const axis = computed(() => axes.find((a) => a.code === props.code))
const axisIndex = computed(() => axes.findIndex((a) => a.code === props.code))

const cx = 80
const cy = 80
const radius = 60
const innerR = radius * 0.28  // ~28% offset from center, leaving the code label readable
const wedgeHalf = (Math.PI * 2) / axes.length / 2

const angleFor = (i) => (i / axes.length) * Math.PI * 2

const point = (a, r) => ({
  x: cx + Math.sin(a) * r,
  y: cy - Math.cos(a) * r
})

const activeAngle = computed(() => angleFor(axisIndex.value))

const spokeStart = computed(() => point(activeAngle.value, innerR))
const spokeEnd = computed(() => point(activeAngle.value, radius))

const wedgeOuterStart = computed(() => point(activeAngle.value - wedgeHalf, radius))
const wedgeOuterEnd = computed(() => point(activeAngle.value + wedgeHalf, radius))
const wedgeInnerStart = computed(() => point(activeAngle.value - wedgeHalf, innerR))
const wedgeInnerEnd = computed(() => point(activeAngle.value + wedgeHalf, innerR))

const wedgePath = computed(() => {
  const ois = wedgeOuterStart.value
  const oie = wedgeOuterEnd.value
  const iis = wedgeInnerStart.value
  const iie = wedgeInnerEnd.value
  return `M ${iis.x.toFixed(2)} ${iis.y.toFixed(2)}` +
    ` L ${ois.x.toFixed(2)} ${ois.y.toFixed(2)}` +
    ` A ${radius} ${radius} 0 0 1 ${oie.x.toFixed(2)} ${oie.y.toFixed(2)}` +
    ` L ${iie.x.toFixed(2)} ${iie.y.toFixed(2)} Z`
})

// Dim spokes for context — also offset from center so they don't crowd the label
const dimSpokes = computed(() =>
  axes
    .map((a, i) => ({
      code: a.code,
      x1: point(angleFor(i), innerR).x,
      y1: point(angleFor(i), innerR).y,
      x2: point(angleFor(i), radius).x,
      y2: point(angleFor(i), radius).y
    }))
    .filter((s) => s.code !== props.code)
)

const uid = Math.random().toString(36).slice(2, 9)
const gradId = `axis-glyph-grad-${uid}`
</script>

<template>
  <svg
    v-if="axis"
    :viewBox="`0 0 ${cx * 2} ${cy * 2}`"
    class="axis-glyph"
    :class="`group-${axis.group}`"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    :aria-label="`${axis.code} axis glyph`"
  >
    <defs>
      <radialGradient
        :id="gradId"
        :cx="cx" :cy="cy" :r="radius"
        gradientUnits="userSpaceOnUse"
      >
        <stop :offset="`${(innerR / radius) * 100}%`" stop-color="currentColor" stop-opacity="0.06" />
        <stop offset="65%"  stop-color="currentColor" stop-opacity="0.28" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0.6" />
      </radialGradient>
    </defs>

    <!-- background ring -->
    <circle :cx="cx" :cy="cy" :r="radius" class="bg-ring" />

    <!-- dim context spokes (also offset from center) -->
    <line
      v-for="s in dimSpokes"
      :key="s.code"
      :x1="s.x1" :y1="s.y1"
      :x2="s.x2" :y2="s.y2"
      class="dim-spoke"
    />

    <!-- highlighted wedge (annular, starts at innerR) -->
    <path :d="wedgePath" :fill="`url(#${gradId})`" class="wedge" />

    <!-- highlighted spoke -->
    <line
      :x1="spokeStart.x" :y1="spokeStart.y"
      :x2="spokeEnd.x" :y2="spokeEnd.y"
      class="active-spoke"
    />

    <!-- endpoint marker -->
    <circle :cx="spokeEnd.x" :cy="spokeEnd.y" r="4.5" class="endpoint" />

    <!-- code label inside, now unobstructed -->
    <text :x="cx" :y="cy" text-anchor="middle" dominant-baseline="middle" class="code-label">
      {{ code }}
    </text>
  </svg>
</template>

<style scoped>
.axis-glyph {
  display: inline-block;
  vertical-align: middle;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.axis-glyph.group-build       { color: var(--soul-build); }
.axis-glyph.group-verify      { color: var(--soul-verify); }
.axis-glyph.group-communicate { color: var(--soul-communicate); }
.axis-glyph.group-operate     { color: var(--soul-operate); }

.bg-ring {
  fill: none;
  stroke: var(--vp-c-divider);
  stroke-width: 0.7;
  opacity: 0.55;
}

.dim-spoke {
  stroke: var(--vp-c-divider);
  stroke-width: 0.5;
  opacity: 0.45;
}

.active-spoke {
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.endpoint {
  fill: currentColor;
  stroke: var(--vp-c-bg);
  stroke-width: 1.5;
}

.code-label {
  fill: currentColor;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.08em;
}
</style>
