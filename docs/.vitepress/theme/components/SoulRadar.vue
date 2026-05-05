<script setup>
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'

// Each axis has an anchor on /radar-schema. VitePress auto-generates these
// from the H3 headings — they include the literal em dash. Mapped explicitly
// here so we don't depend on slug guessing.
const SCHEMA_ANCHORS = {
  BLD: 'bld-—-build-synthesis',
  REF: 'ref-—-refactor-prune',
  AUD: 'aud-—-audit-adversarial-review',
  DOC: 'doc-—-documentation-teaching',
  CSR: 'csr-—-customer-facing-warmth',
  NEG: 'neg-—-negotiation-coordination',
  VOX: 'vox-—-voice-expressiveness',
  OPS: 'ops-—-operations-incident-response',
  GOV: 'gov-—-governance-compliance',
  ETH: 'eth-—-ethics-conscience'
}

const props = defineProps({
  data: { type: Object, default: null },
  size: { type: Number, default: 380 },
  showLegend: { type: Boolean, default: true },
  showTooltip: { type: Boolean, default: true },
  showAxisLabels: { type: Boolean, default: true },
  highlightHighest: { type: Boolean, default: true }
})

const { frontmatter } = useData()

const radar = computed(() => props.data ?? frontmatter.value?.radar ?? {})

const axes = [
  { code: 'BLD', group: 'build',       label: 'Build & Synthesis',              tagline: 'Generating new code, features, prose from scratch.' },
  { code: 'REF', group: 'build',       label: 'Refactor & Prune',               tagline: 'Reshaping, simplifying, and deleting existing structure.' },
  { code: 'AUD', group: 'verify',      label: 'Audit & Adversarial Review',     tagline: 'Paranoid scrutiny — finding flaws and edge cases.' },
  { code: 'DOC', group: 'verify',      label: 'Documentation & Teaching',       tagline: 'Explaining, citing, and writing for future readers.' },
  { code: 'CSR', group: 'communicate', label: 'Customer-Facing Warmth',         tagline: 'Real-time tone with non-experts; patience and tact.' },
  { code: 'NEG', group: 'communicate', label: 'Negotiation & Coordination',     tagline: 'Multi-stakeholder reasoning and trade-off articulation.' },
  { code: 'VOX', group: 'communicate', label: 'Voice & Expressiveness',         tagline: 'Personality density in artifacts, regardless of audience.' },
  { code: 'OPS', group: 'operate',     label: 'Operations & Incident Response', tagline: 'Calm under pressure; runbook discipline.' },
  { code: 'GOV', group: 'operate',     label: 'Governance & Compliance',        tagline: 'Adherence to external rules, runbooks, and policy.' },
  { code: 'ETH', group: 'operate',     label: 'Ethics & Conscience',            tagline: 'Internal moral compass, independent of policy.' }
]

const groups = [
  { id: 'build',       name: 'Build' },
  { id: 'verify',      name: 'Verify' },
  { id: 'communicate', name: 'Communicate' },
  { id: 'operate',     name: 'Operate' }
]

const GROUP_INFO = {
  build:       { subtitle: 'Creating systems',           detail: 'BLD and REF — appetite for new structure and willingness to remove existing structure.' },
  verify:      { subtitle: 'Checking systems',           detail: 'AUD and DOC — paranoid scrutiny and the impulse to leave artifacts.' },
  communicate: { subtitle: 'Interfacing with the world', detail: 'CSR, NEG, VOX — real-time warmth, multi-stakeholder reasoning, and personality density in artifacts.' },
  operate:     { subtitle: 'Running systems',            detail: 'OPS, GOV, ETH — pressure handling, external rule-following, and internal moral compass.' }
}

const groupName = (id) => groups.find((g) => g.id === id)?.name || id

const cx = 200
const cy = 200
const radius = 130
const scale = radius / 10
const viewBox = '0 0 400 400'

const angle = (i) => (i / axes.length) * Math.PI * 2
const wedgeHalfAngle = (Math.PI * 2) / axes.length / 2

const axisEnd = (i, r = radius) => ({
  x: cx + Math.sin(angle(i)) * r,
  y: cy - Math.cos(angle(i)) * r
})

const labelPos = (i) => axisEnd(i, radius + 22)

const wedgePath = (i) => {
  const theta = angle(i)
  const a0 = theta - wedgeHalfAngle
  const a1 = theta + wedgeHalfAngle
  const sx = cx + Math.sin(a0) * radius
  const sy = cy - Math.cos(a0) * radius
  const ex = cx + Math.sin(a1) * radius
  const ey = cy - Math.cos(a1) * radius
  return `M ${cx} ${cy} L ${sx.toFixed(2)} ${sy.toFixed(2)} A ${radius} ${radius} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
}

const polygonPoints = computed(() =>
  axes
    .map((axis, i) => {
      const v = radar.value[axis.code] ?? 0
      const r = v * scale
      const x = cx + Math.sin(angle(i)) * r
      const y = cy - Math.cos(angle(i)) * r
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
)

const vertexPoints = computed(() =>
  axes.map((axis, i) => {
    const v = radar.value[axis.code] ?? 0
    const r = v * scale
    return {
      ...axis,
      index: i,
      value: v,
      x: cx + Math.sin(angle(i)) * r,
      y: cy - Math.cos(angle(i)) * r
    }
  })
)

const defaultHighest = computed(() => {
  const entries = vertexPoints.value
  if (entries.length === 0) return null
  return entries.reduce((max, cur) => (cur.value > max.value ? cur : max), entries[0])
})

const hovered = ref(null)
const setHover = (axis) => { hovered.value = axis }
const clearHover = () => { hovered.value = null }

// Group-level state. Two refs:
//   - hoveredGroup: ephemeral, set by mouseenter; drives the bounce animation
//   - activeGroup:  hovered group, falling back to the group of the soul's
//                   highest-scoring axis. Drives the chip's bold/color state
//                   and the inline description panel — so the idle radar shows
//                   the soul's "best" group rather than a generic prompt.
const hoveredGroup = ref(null)
const setHoverGroup = (id) => { hoveredGroup.value = id }
const clearHoverGroup = () => { hoveredGroup.value = null }

const defaultGroup = computed(() =>
  props.highlightHighest ? defaultHighest.value?.group || null : null
)

const activeGroup = computed(() => hoveredGroup.value ?? defaultGroup.value)

const activeAxis = computed(() =>
  hovered.value ?? (props.highlightHighest ? defaultHighest.value : null)
)

const activeScore = computed(() =>
  activeAxis.value ? radar.value[activeAxis.value.code] ?? 0 : null
)

const isActive = (axis) => activeAxis.value?.code === axis.code

const schemaHref = (axis) => {
  const anchor = SCHEMA_ANCHORS[axis.code]
  return anchor ? withBase(`/radar-schema#${anchor}`) : null
}

// Unique gradient/clip ids per instance to avoid collisions when multiple radars share a page.
const uid = Math.random().toString(36).slice(2, 9)
const clipId = `radar-clip-${uid}`
const gradId = (group, level) => `radar-grad-${group}-${level}-${uid}`
</script>

<template>
  <div class="soul-radar-wrapper" :class="{ 'no-legend': !showLegend, 'no-tooltip': !showTooltip }">
    <svg
      :viewBox="viewBox"
      class="soul-radar"
      :style="{ width: size + 'px', maxWidth: '100%' }"
      role="img"
      aria-label="Persona radar chart, 10 functional axes"
    >
      <defs>
        <!-- Faint backdrop gradients, one per group. Stops styled by CSS class. -->
        <radialGradient
          v-for="g in groups"
          :key="`faint-${g.id}`"
          :id="gradId(g.id, 'faint')"
          :cx="cx" :cy="cy" :r="radius"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   :class="`stop-color-${g.id} stop-faint-inner`" />
          <stop offset="60%"  :class="`stop-color-${g.id} stop-faint-mid`" />
          <stop offset="100%" :class="`stop-color-${g.id} stop-faint-outer`" />
        </radialGradient>
        <!-- Strong (polygon-clipped) gradients, one per group -->
        <radialGradient
          v-for="g in groups"
          :key="`strong-${g.id}`"
          :id="gradId(g.id, 'strong')"
          :cx="cx" :cy="cy" :r="radius"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   :class="`stop-color-${g.id} stop-strong-inner`" />
          <stop offset="55%"  :class="`stop-color-${g.id} stop-strong-mid`" />
          <stop offset="100%" :class="`stop-color-${g.id} stop-strong-outer`" />
        </radialGradient>
        <clipPath :id="clipId">
          <polygon :points="polygonPoints" />
        </clipPath>
      </defs>

      <!-- Faint group-colored sector backdrop, always visible -->
      <g class="sector-backdrop">
        <path
          v-for="(axis, i) in axes"
          :key="`bg-${axis.code}`"
          :d="wedgePath(i)"
          :fill="`url(#${gradId(axis.group, 'faint')})`"
          class="sector"
          :class="[`group-${axis.group}`, { 'group-hovered': hoveredGroup === axis.group }]"
          @mouseenter="setHoverGroup(axis.group)"
          @mouseleave="clearHoverGroup"
        />
      </g>

      <!-- reference rings -->
      <circle
        v-for="r in [2, 4, 6, 8, 10]"
        :key="r"
        :cx="cx" :cy="cy"
        :r="r * scale"
        class="ring"
      />

      <!-- axis spokes -->
      <line
        v-for="(axis, i) in axes"
        :key="`spoke-${axis.code}`"
        :x1="cx" :y1="cy"
        :x2="axisEnd(i).x" :y2="axisEnd(i).y"
        class="spoke"
        :class="`group-${axis.group}`"
      />

      <!-- Saturated group sectors clipped to polygon shape — the multi-colored fill -->
      <g :clip-path="`url(#${clipId})`">
        <path
          v-for="(axis, i) in axes"
          :key="`fg-${axis.code}`"
          :d="wedgePath(i)"
          :fill="`url(#${gradId(axis.group, 'strong')})`"
          class="sector"
          :class="[`group-${axis.group}`, { 'group-hovered': hoveredGroup === axis.group }]"
          @mouseenter="setHoverGroup(axis.group)"
          @mouseleave="clearHoverGroup"
        />
      </g>

      <!-- polygon outline -->
      <polygon :points="polygonPoints" class="soul-polygon" />

      <!-- per-axis interactive groups: invisible hit area + vertex + label -->
      <g
        v-for="(v, i) in vertexPoints"
        :key="`hit-${v.code}`"
        class="axis-group"
        :class="[`group-${v.group}`, { 'is-active': isActive(v) }]"
        @mouseenter="setHover(v)"
        @mouseleave="clearHover"
        @focus="setHover(v)"
        @blur="clearHover"
        :tabindex="showAxisLabels ? 0 : -1"
        :aria-label="`${v.code} ${v.label}, score ${v.value}`"
      >
        <!-- wide invisible hit area along the axis line, extending past the label -->
        <line
          v-if="showAxisLabels"
          :x1="cx" :y1="cy"
          :x2="axisEnd(i, radius + 28).x" :y2="axisEnd(i, radius + 28).y"
          stroke="transparent" stroke-width="22"
          class="hit-line"
        />
        <!-- vertex dot -->
        <circle :cx="v.x" :cy="v.y" :r="isActive(v) ? 6 : 4" class="vertex" />
        <!-- axis label -->
        <text
          v-if="showAxisLabels"
          :x="labelPos(i).x" :y="labelPos(i).y"
          text-anchor="middle"
          dominant-baseline="middle"
          class="axis-label"
        >
          {{ v.code }}
        </text>
      </g>
    </svg>

    <div v-if="showLegend" class="soul-radar-legend">
      <button
        v-for="g in groups"
        :key="g.id"
        type="button"
        class="legend-chip"
        :class="[
          `group-${g.id}`,
          {
            'is-active':   activeGroup === g.id,
            'is-bouncing': hoveredGroup === g.id
          }
        ]"
        @mouseenter="setHoverGroup(g.id)"
        @mouseleave="clearHoverGroup"
        @focus="setHoverGroup(g.id)"
        @blur="clearHoverGroup"
        :aria-label="`${g.name} — ${GROUP_INFO[g.id].subtitle}`"
      >
        <span class="dot" />
        {{ g.name }}
      </button>
    </div>

    <div
      v-if="showLegend"
      class="group-info"
      :class="{ 'is-active': activeGroup, 'is-default': activeGroup && !hoveredGroup }"
      aria-live="polite"
    >
      <template v-if="activeGroup">
        <span class="gi-name" :class="`group-${activeGroup}`">{{ groupName(activeGroup) }}</span>
        <span class="gi-subtitle">
          {{ GROUP_INFO[activeGroup].subtitle }}
          <span v-if="!hoveredGroup" class="gi-default-tag">— this soul's strongest group</span>
        </span>
        <span class="gi-detail">{{ GROUP_INFO[activeGroup].detail }}</span>
      </template>
      <template v-else>
        <span class="gi-prompt">Hover a group sector or chip for context.</span>
      </template>
    </div>

    <div
      v-if="showTooltip"
      class="soul-radar-tooltip"
      :class="{ 'is-active': activeAxis }"
      aria-live="polite"
    >
      <template v-if="activeAxis">
        <span class="tt-code" :class="`group-${activeAxis.group}`">{{ activeAxis.code }}</span>
        <span class="tt-score">{{ activeScore }}</span>
        <span class="tt-label">{{ activeAxis.label }}</span>
        <span class="tt-tagline">{{ activeAxis.tagline }}</span>
        <a
          v-if="schemaHref(activeAxis)"
          :href="schemaHref(activeAxis)"
          class="tt-link"
        >Read full definition →</a>
      </template>
      <template v-else>
        <span class="tt-prompt">Hover or focus an axis for details.</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.soul-radar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.5rem 0 2rem;
}
.soul-radar-wrapper.no-legend.no-tooltip {
  margin: 0;
}

.soul-radar {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow: visible;
}

/* Sector wedges — fill comes from per-group gradients defined in <defs>.
 * Each sector also carries a group-color stroke that's invisible by default
 * (stroke-opacity 0) and fades in on hover, giving a clear, theme-agnostic
 * edge that contrasts even when the gradient fill itself is near-transparent. */
.sector {
  stroke-width: 1.2;
  stroke-opacity: 0;
  cursor: pointer;
  transition: filter 0.18s ease, stroke-opacity 0.18s ease;
}
.sector.group-build       { stroke: var(--soul-build); }
.sector.group-verify      { stroke: var(--soul-verify); }
.sector.group-communicate { stroke: var(--soul-communicate); }
.sector.group-operate     { stroke: var(--soul-operate); }

/* Hover: noticeable in both light and dark themes.
 * - Brightness + saturation lifts the faint backdrop out of near-transparency.
 * - Stroke fades in to give the wedge a clear, group-colored edge — the part
 *   that actually carries the contrast against any background. */
.sector.group-hovered {
  filter: brightness(1.35) saturate(1.5);
  stroke-opacity: 0.7;
}

/* Per-group stop colors — applied to gradient stops by class.
   Critical: stops live inside <defs> so currentColor inheritance from the
   referencing path doesn't work; we style stops directly here. */
.stop-color-build       { stop-color: var(--soul-build); }
.stop-color-verify      { stop-color: var(--soul-verify); }
.stop-color-communicate { stop-color: var(--soul-communicate); }
.stop-color-operate     { stop-color: var(--soul-operate); }

/* Faint backdrop: visible everywhere, sets up the group regions */
.stop-faint-inner  { stop-opacity: 0.03; }
.stop-faint-mid    { stop-opacity: 0.10; }
.stop-faint-outer  { stop-opacity: 0.22; }

/* Strong: clipped to polygon, "darker toward extremes" effect */
.stop-strong-inner { stop-opacity: 0.12; }
.stop-strong-mid   { stop-opacity: 0.42; }
.stop-strong-outer { stop-opacity: 0.74; }

.ring {
  fill: none;
  stroke: var(--vp-c-divider);
  stroke-width: 0.6;
  opacity: 0.5;
}

.spoke {
  stroke-width: 0.7;
  opacity: 0.5;
}
.spoke.group-build       { stroke: var(--soul-build); }
.spoke.group-verify      { stroke: var(--soul-verify); }
.spoke.group-communicate { stroke: var(--soul-communicate); }
.spoke.group-operate     { stroke: var(--soul-operate); }

.soul-polygon {
  fill: none;
  stroke: var(--vp-c-text-1);
  stroke-width: 1.4;
  stroke-linejoin: round;
  opacity: 0.85;
  pointer-events: none;
}

.axis-group {
  cursor: pointer;
  outline: none;
}

.axis-group .vertex {
  stroke: var(--vp-c-bg);
  stroke-width: 1;
  transition: r 0.14s ease;
}
.axis-group.group-build       .vertex { fill: var(--soul-build); }
.axis-group.group-verify      .vertex { fill: var(--soul-verify); }
.axis-group.group-communicate .vertex { fill: var(--soul-communicate); }
.axis-group.group-operate     .vertex { fill: var(--soul-operate); }

.axis-group .axis-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  pointer-events: none;
  transition: font-size 0.14s ease, font-weight 0.14s ease;
}
.axis-group.group-build       .axis-label { fill: var(--soul-build); }
.axis-group.group-verify      .axis-label { fill: var(--soul-verify); }
.axis-group.group-communicate .axis-label { fill: var(--soul-communicate); }
.axis-group.group-operate     .axis-label { fill: var(--soul-operate); }

.axis-group.is-active .axis-label,
.axis-group:focus-visible .axis-label {
  font-size: 13px;
  font-weight: 700;
}

.axis-group:focus-visible .vertex {
  stroke-width: 2;
  stroke: var(--vp-c-brand-1);
}

/* Legend */
.soul-radar-legend {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-family: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  color: var(--vp-c-text-2);
  transition: color 0.18s ease, border-color 0.18s ease, font-weight 0.18s ease;
}
.legend-chip .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.legend-chip.group-build       .dot { background: var(--soul-build); }
.legend-chip.group-verify      .dot { background: var(--soul-verify); }
.legend-chip.group-communicate .dot { background: var(--soul-communicate); }
.legend-chip.group-operate     .dot { background: var(--soul-operate); }

/* Bounce-once + bold when the group is hovered — applies whether the hover
 * source was the sector wedge in the radar or the chip itself. */
@keyframes legend-chip-bounce {
  0%   { transform: translateY(0); }
  30%  { transform: translateY(-5px); }
  55%  { transform: translateY(0); }
  78%  { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

/* `.is-active` covers both hover and "this soul's best group" default —
 * applies bold + color, no animation (so the radar doesn't bounce on page load).
 * `.is-bouncing` is added only on actual hover and triggers the once-off bounce. */
.legend-chip.is-active {
  font-weight: 700;
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.legend-chip.is-bouncing {
  animation: legend-chip-bounce 0.5s ease-out;
}
.legend-chip.is-active.group-build       { color: var(--soul-build); }
.legend-chip.is-active.group-verify      { color: var(--soul-verify); }
.legend-chip.is-active.group-communicate { color: var(--soul-communicate); }
.legend-chip.is-active.group-operate     { color: var(--soul-operate); }

.legend-chip.is-active .dot {
  transform: scale(1.35);
  box-shadow: 0 0 0 3px var(--vp-c-bg);
}

.legend-chip:focus-visible {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

/* Group-info panel — shows when any group is active. Mirrors the
 * axis tooltip's fixed-height pattern so the layout doesn't jump. */
.group-info {
  margin-top: 0.5rem;
  min-height: 3rem;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.6rem;
  row-gap: 0.2rem;
  align-items: baseline;
  width: clamp(280px, 92%, 440px);
  transition: opacity 0.18s ease, border-color 0.18s ease;
}
.group-info:not(.is-active) {
  opacity: 0.55;
}
.group-info.is-active {
  border-color: var(--vp-c-brand-soft, var(--vp-c-divider));
}

.gi-name {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.gi-name.group-build       { color: var(--soul-build); }
.gi-name.group-verify      { color: var(--soul-verify); }
.gi-name.group-communicate { color: var(--soul-communicate); }
.gi-name.group-operate     { color: var(--soul-operate); }

.gi-subtitle {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.gi-default-tag {
  font-weight: 400;
  font-style: italic;
  color: var(--vp-c-text-2);
  font-size: 11px;
  margin-left: 0.4rem;
}

.gi-detail {
  grid-column: 1 / -1;
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-style: italic;
}

.gi-prompt {
  grid-column: 1 / -1;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  text-align: center;
}

/* Tooltip */
.soul-radar-tooltip {
  margin-top: 0.75rem;
  min-height: 3.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.7rem;
  row-gap: 0.2rem;
  align-items: center;
  width: clamp(280px, 92%, 440px);
  transition: opacity 0.14s ease, border-color 0.14s ease;
}
.soul-radar-tooltip:not(.is-active) {
  opacity: 0.55;
}
.soul-radar-tooltip.is-active {
  border-color: var(--vp-c-brand-soft, var(--vp-c-divider));
}
.tt-code {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.06em;
}
.tt-code.group-build       { color: var(--soul-build); }
.tt-code.group-verify      { color: var(--soul-verify); }
.tt-code.group-communicate { color: var(--soul-communicate); }
.tt-code.group-operate     { color: var(--soul-operate); }
.tt-score {
  font-weight: 700;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}
.tt-label {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.tt-tagline {
  grid-column: 1 / -1;
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-style: italic;
}
.tt-link {
  grid-column: 1 / -1;
  margin-top: 0.15rem;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  align-self: start;
}
.tt-link:hover {
  text-decoration: underline;
}
.tt-prompt {
  grid-column: 1 / -1;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  text-align: center;
}
</style>
