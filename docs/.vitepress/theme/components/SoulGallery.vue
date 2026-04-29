<script setup>
import { ref, computed, reactive } from 'vue'
import { withBase } from 'vitepress'
import { data as souls } from '../../../data/souls.data.js'
import SoulRadar from './SoulRadar.vue'

const AXIS_CODES = ['BLD', 'REF', 'AUD', 'DOC', 'CSR', 'NEG', 'VOX', 'OPS', 'GOV', 'ETH']

const AXIS_GROUPS = [
  { id: 'build',       name: 'Build',       axes: ['BLD', 'REF'] },
  { id: 'verify',      name: 'Verify',      axes: ['AUD', 'DOC'] },
  { id: 'communicate', name: 'Communicate', axes: ['CSR', 'NEG', 'VOX'] },
  { id: 'operate',     name: 'Operate',     axes: ['OPS', 'GOV', 'ETH'] }
]

const groupOf = (code) => AXIS_GROUPS.find((g) => g.axes.includes(code))?.id

// Filter / sort state
const search = ref('')
const selectedUseCases = ref([])
const minScores = reactive(Object.fromEntries(AXIS_CODES.map((c) => [c, 0])))
const sortBy = ref('starter')

// Aggregate union of best_for tags across all souls — drives the use-case chips.
const allUseCases = computed(() => {
  const set = new Set()
  souls.forEach((s) => s.best_for.forEach((t) => set.add(t)))
  return Array.from(set).sort()
})

const matchesUseCase = (s) =>
  selectedUseCases.value.length === 0 ||
  selectedUseCases.value.some((t) => s.best_for.includes(t))

const matchesScores = (s) => {
  for (const code of AXIS_CODES) {
    const min = minScores[code]
    if (min > 0 && (s.radar[code] ?? 0) < min) return false
  }
  return true
}

const matchesSearch = (s) => {
  const q = search.value.trim().toLowerCase()
  if (!q) return true
  const haystack = [s.archetype, s.inspired_by, s.think, ...s.tags].join(' ').toLowerCase()
  return haystack.includes(q)
}

const filtered = computed(() => {
  let out = souls.filter((s) => matchesSearch(s) && matchesUseCase(s) && matchesScores(s))

  const sb = sortBy.value
  if (sb === 'starter') {
    out = [...out].sort((a, b) => {
      if (a.starter_order != null && b.starter_order != null) return a.starter_order - b.starter_order
      if (a.starter_order != null) return -1
      if (b.starter_order != null) return 1
      return a.archetype.localeCompare(b.archetype)
    })
  } else if (sb === 'name') {
    out = [...out].sort((a, b) => a.archetype.localeCompare(b.archetype))
  } else if (AXIS_CODES.includes(sb)) {
    out = [...out].sort((a, b) => (b.radar[sb] ?? 0) - (a.radar[sb] ?? 0))
  }

  return out
})

const hasActiveFilters = computed(() =>
  search.value.trim().length > 0 ||
  selectedUseCases.value.length > 0 ||
  AXIS_CODES.some((c) => minScores[c] > 0)
)

const activeScoreCount = computed(() =>
  AXIS_CODES.filter((c) => minScores[c] > 0).length
)

function toggleUseCase(t) {
  const i = selectedUseCases.value.indexOf(t)
  if (i >= 0) selectedUseCases.value.splice(i, 1)
  else selectedUseCases.value.push(t)
}

function resetFilters() {
  search.value = ''
  selectedUseCases.value = []
  for (const c of AXIS_CODES) minScores[c] = 0
  sortBy.value = 'starter'
}

function clearUseCases() {
  selectedUseCases.value = []
}

function clearScoreThresholds() {
  for (const c of AXIS_CODES) minScores[c] = 0
}

const prettyTag = (t) => t.replace(/-/g, ' ')
const soulHref = (slug) => withBase(`/souls/${slug}`)
</script>

<template>
  <section class="soul-gallery">
    <!-- Filter bar -->
    <div class="gallery-controls">
      <div class="control-row">
        <div class="control search">
          <label for="soul-search" class="control-label">Search</label>
          <input
            id="soul-search"
            v-model="search"
            type="search"
            placeholder="Name, Think:, or tag…"
            class="search-input"
            autocomplete="off"
          />
        </div>

        <div class="control sort">
          <label for="soul-sort" class="control-label">Sort by</label>
          <select id="soul-sort" v-model="sortBy" class="sort-select">
            <option value="starter">Starter order</option>
            <option value="name">Archetype name</option>
            <optgroup label="Highest score on…">
              <option
                v-for="axis in AXIS_CODES"
                :key="axis"
                :value="axis"
              >{{ axis }}</option>
            </optgroup>
          </select>
        </div>
      </div>

      <details v-if="allUseCases.length" class="control-block facet-section">
        <summary class="facet-summary">
          <span class="facet-arrow" aria-hidden="true">▸</span>
          <span class="facet-label">Use case</span>
          <span class="facet-hint">{{ allUseCases.length }} options</span>
          <button
            v-if="selectedUseCases.length"
            type="button"
            class="facet-count is-clearable"
            :aria-label="`Clear ${selectedUseCases.length} selected use cases`"
            @click.stop.prevent="clearUseCases"
          >
            <span>{{ selectedUseCases.length }} selected</span>
            <span class="facet-count-x" aria-hidden="true">×</span>
          </button>
        </summary>
        <div class="chip-list">
          <button
            v-for="t in allUseCases"
            :key="t"
            type="button"
            class="chip"
            :class="{ 'is-selected': selectedUseCases.includes(t) }"
            @click="toggleUseCase(t)"
          >{{ prettyTag(t) }}</button>
        </div>
      </details>

      <details class="control-block facet-section score-thresholds">
        <summary class="facet-summary">
          <span class="facet-arrow" aria-hidden="true">▸</span>
          <span class="facet-label">Score thresholds</span>
          <span class="facet-hint">drag to require min score on an axis</span>
          <button
            v-if="activeScoreCount > 0"
            type="button"
            class="facet-count is-clearable"
            :aria-label="`Clear ${activeScoreCount} active score thresholds`"
            @click.stop.prevent="clearScoreThresholds"
          >
            <span>{{ activeScoreCount }} active</span>
            <span class="facet-count-x" aria-hidden="true">×</span>
          </button>
        </summary>
        <div class="score-grid">
          <div
            v-for="g in AXIS_GROUPS"
            :key="g.id"
            class="score-group"
            :class="`group-${g.id}`"
          >
            <span class="score-group-name">{{ g.name }}</span>
            <div
              v-for="code in g.axes"
              :key="code"
              class="score-row"
            >
              <span class="score-axis">{{ code }}</span>
              <input
                type="range" min="0" max="10" step="1"
                v-model.number="minScores[code]"
                class="score-slider"
                :class="`group-${g.id}`"
                :aria-label="`${code} minimum score`"
              />
              <span class="score-value" :class="{ 'is-active': minScores[code] > 0 }">
                {{ minScores[code] === 0 ? '·' : '≥&nbsp;' + minScores[code] }}
              </span>
            </div>
          </div>
        </div>
      </details>

      <div class="filter-status">
        <span class="result-count">
          <strong>{{ filtered.length }}</strong> of {{ souls.length }} souls
        </span>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="reset-btn"
          @click="resetFilters"
        >Clear filters</button>
      </div>
    </div>

    <!-- Results grid -->
    <div v-if="filtered.length" class="gallery-grid">
      <a
        v-for="s in filtered"
        :key="s.slug"
        :href="soulHref(s.slug)"
        class="gallery-card"
      >
        <div class="card-radar">
          <SoulRadar
            :data="s.radar"
            :size="170"
            :show-legend="false"
            :show-tooltip="false"
            :show-axis-labels="false"
            :highlight-highest="false"
          />
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ s.archetype }}</h3>
          <p v-if="s.think" class="card-think">Think: {{ s.think }}</p>
          <ul v-if="s.best_for.length" class="card-tags">
            <li
              v-for="t in s.best_for.slice(0, 3)"
              :key="t"
              class="card-tag"
            >{{ prettyTag(t) }}</li>
          </ul>
        </div>
      </a>
    </div>

    <p v-else class="empty-state">
      No souls match the current filters.
      <button type="button" class="reset-link" @click="resetFilters">Clear filters</button>
      to see all {{ souls.length }}.
    </p>
  </section>
</template>

<style scoped>
.soul-gallery {
  margin: 1.5rem 0 3rem;
}

/* Controls */
.gallery-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  margin-bottom: 1.5rem;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1 1 220px;
}
.control-block {
  flex-basis: 100%;
}

.control-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.search-input,
.sort-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-family: var(--vp-font-family-base);
}
.search-input:focus,
.sort-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft, rgba(94, 234, 212, 0.18));
}

/* Use-case chips */
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
}
.chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.chip.is-selected {
  background: var(--vp-c-brand-soft, rgba(94, 234, 212, 0.18));
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Collapsible facet sections (use-case, score thresholds) */
.facet-section {
  margin-top: 0.1rem;
}
.facet-section > .facet-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-2);
  list-style: none;
  transition: border-color 0.14s ease, background 0.14s ease, color 0.14s ease;
}
.facet-section > .facet-summary::-webkit-details-marker {
  display: none;
}
.facet-section > .facet-summary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}
.facet-section[open] > .facet-summary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.facet-arrow {
  display: inline-block;
  width: 0.9rem;
  text-align: center;
  font-size: 0.85rem;
  line-height: 1;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  transition: transform 0.18s ease, color 0.14s ease;
}
.facet-section[open] > .facet-summary .facet-arrow {
  transform: rotate(90deg);
  color: var(--vp-c-brand-1);
}

.facet-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.facet-hint {
  text-transform: none;
  letter-spacing: normal;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  font-size: 0.75rem;
}

.facet-count {
  margin-left: auto;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--vp-c-brand-soft, rgba(94, 234, 212, 0.18));
  color: var(--vp-c-brand-1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Clearable variant: count badge becomes a destructive-action chip */
.facet-count.is-clearable {
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0.4rem 0.15rem 0.6rem;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.facet-count-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.12);
  color: currentColor;
  transition: background 0.14s ease, color 0.14s ease;
}

.facet-count.is-clearable:hover,
.facet-count.is-clearable:focus-visible {
  background: var(--vp-c-danger-soft, rgba(239, 68, 68, 0.14));
  color: var(--vp-c-danger-1, #ef4444);
  border-color: var(--vp-c-danger-1, #ef4444);
  outline: none;
}
.facet-count.is-clearable:hover .facet-count-x,
.facet-count.is-clearable:focus-visible .facet-count-x {
  background: var(--vp-c-danger-1, #ef4444);
  color: var(--vp-c-bg);
}

/* Body of each facet section sits below the summary with a small inset */
.facet-section[open] > .chip-list,
.facet-section[open] > .score-grid {
  margin-top: 0.75rem;
  padding: 0.25rem 0.25rem 0.5rem;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.score-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}
.score-group.group-build       { color: var(--soul-build); }
.score-group.group-verify      { color: var(--soul-verify); }
.score-group.group-communicate { color: var(--soul-communicate); }
.score-group.group-operate     { color: var(--soul-operate); }

.score-group-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: currentColor;
  margin-bottom: 0.15rem;
}

.score-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr 3.5rem;
  align-items: center;
  gap: 0.5rem;
}

.score-axis {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 600;
  font-size: 0.78rem;
  color: currentColor;
}

.score-slider {
  width: 100%;
  accent-color: currentColor;
  cursor: pointer;
}

.score-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  text-align: right;
}
.score-value.is-active {
  color: currentColor;
  font-weight: 700;
}

/* Status row */
.filter-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  padding-top: 0.25rem;
}
.result-count strong {
  color: var(--vp-c-text-1);
}
.reset-btn {
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.3rem 0.7rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.78rem;
  font-family: var(--vp-font-family-base);
  transition: border-color 0.14s ease, color 0.14s ease;
}
.reset-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}

.gallery-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  padding: 1rem 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: border-color 0.14s ease, transform 0.14s ease, background 0.14s ease;
}
.gallery-card:hover,
.gallery-card:focus-visible {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  outline: none;
}

.card-radar {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
  pointer-events: none; /* radar is decorative on card; click target is the card */
}

.card-body {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0 0.25rem;
}

.card-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.card-think {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-style: italic;
  line-height: 1.4;
}

.card-tags {
  list-style: none;
  padding: 0;
  margin: 0.4rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
}
.card-tag {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.68rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.02em;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}
.reset-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  text-decoration: underline;
  font: inherit;
}
</style>
