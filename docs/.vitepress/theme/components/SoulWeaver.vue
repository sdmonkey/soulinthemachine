<script setup>
import { reactive, computed, watch, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as existingSouls } from '../../../data/souls.data.js'
import SoulRadar from './SoulRadar.vue'
import { parseSoulMarkdown } from '../lib/soul-parser.js'
import { buildSoulPrompt } from '../lib/soul-prompt.js'

// ---------------------------------------------------------------------------
// Constants — single source of truth, kept in sync with scripts/validate-souls.mjs
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sitm-weaver-draft-v1'

const AXIS_CODES = ['BLD', 'REF', 'AUD', 'DOC', 'CSR', 'NEG', 'VOX', 'OPS', 'GOV', 'ETH']

const AXIS_GROUPS = [
  { id: 'build',       name: 'Build',       axes: ['BLD', 'REF'] },
  { id: 'verify',      name: 'Verify',      axes: ['AUD', 'DOC'] },
  { id: 'communicate', name: 'Communicate', axes: ['CSR', 'NEG', 'VOX'] },
  { id: 'operate',     name: 'Operate',     axes: ['OPS', 'GOV', 'ETH'] }
]

const AXIS_INFO = {
  BLD: { full: 'Build & Synthesis',              hint: 'Generating new code, features, prose from scratch.' },
  REF: { full: 'Refactor & Prune',               hint: 'Reshaping, simplifying, and deleting existing structure.' },
  AUD: { full: 'Audit & Adversarial Review',     hint: 'Paranoid scrutiny — finding flaws and edge cases.' },
  DOC: { full: 'Documentation & Teaching',       hint: 'Explaining, citing, and writing for future readers.' },
  CSR: { full: 'Customer-Facing Warmth',         hint: 'Real-time tone with non-experts; patience and tact.' },
  NEG: { full: 'Negotiation & Coordination',     hint: 'Multi-stakeholder reasoning and trade-off articulation.' },
  VOX: { full: 'Voice & Expressiveness',         hint: 'Personality density in artifacts, regardless of audience.' },
  OPS: { full: 'Operations & Incident Response', hint: 'Calm under pressure; runbook discipline.' },
  GOV: { full: 'Governance & Compliance',        hint: 'Adherence to external rules, runbooks, and policy.' },
  ETH: { full: 'Ethics & Conscience',            hint: 'Internal moral compass, independent of policy.' }
}

const RULES = {
  MIN_BOONS: 3,
  MIN_FLAWS: 3,
  MIN_LOW: 1,
  MIN_HIGH: 1,
  MAX_HIGH: 4,
  MIN_BEST_FOR_DETAIL: 2,
  MIN_AVOID_FOR_DETAIL: 2,
  MIN_CORE_IDENTITY: 3
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function emptyState() {
  return {
    archetype: '',
    slug: '',
    slugAuto: true,
    version: '1.0.0',
    starter_order: null,
    inspired_by: '',
    think: '',
    tags: [],
    radar: Object.fromEntries(AXIS_CODES.map((c) => [c, 5])),
    best_for: [],
    avoid_for: [],
    personality_profile: '',
    boons: [
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ],
    flaws: [
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ],
    forecast: { stress: '', conflict: '', ambiguity: '', wrong_user: '' },
    best_for_detail: [
      { name: '', justification: '' },
      { name: '', justification: '' }
    ],
    avoid_for_detail: [
      { name: '', justification: '' },
      { name: '', justification: '' }
    ],
    caveats: '',
    core_identity: ['', '', '']
  }
}

const state = reactive(emptyState())
const submitted = ref(false)
const copied = ref(false)
const copyError = ref('')

// Auto-derive slug from archetype (until user manually edits the slug field)
watch(
  () => state.archetype,
  (val) => {
    if (state.slugAuto) {
      state.slug = (val || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
  }
)

function onSlugInput() {
  state.slugAuto = false
}

// ---------------------------------------------------------------------------
// LocalStorage persistence
// ---------------------------------------------------------------------------

onMounted(() => {
  if (typeof window === 'undefined') return
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved)
    for (const k of Object.keys(emptyState())) {
      if (parsed[k] !== undefined) state[k] = parsed[k]
    }
  } catch (e) {
    console.warn('[SoulWeaver] could not restore draft:', e)
  }
})

watch(
  state,
  (val) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // storage full / disabled — non-fatal
    }
  },
  { deep: true }
)

// ---------------------------------------------------------------------------
// Tag helpers (comma-separated input bound through computed v-model)
// ---------------------------------------------------------------------------

function makeTagModel(arrayKey, kebab = false) {
  return computed({
    get() {
      return state[arrayKey].join(', ')
    },
    set(val) {
      state[arrayKey] = val
        .split(',')
        .map((s) => {
          let t = s.trim().toLowerCase()
          if (kebab) t = t.replace(/\s+/g, '-')
          return t
        })
        .filter(Boolean)
    }
  })
}

const tagsModel = makeTagModel('tags', false)
const bestForModel = makeTagModel('best_for', true)
const avoidForModel = makeTagModel('avoid_for', true)

// ---------------------------------------------------------------------------
// Validation — mirrors scripts/validate-souls.mjs at the field level
// ---------------------------------------------------------------------------

const errors = computed(() => {
  const e = {}

  // Identity
  if (!state.archetype.trim()) e.archetype = 'Required'
  else if (!/^The\s+\S/.test(state.archetype.trim())) e.archetype = 'Must begin with "The "'

  if (!state.slug.trim()) e.slug = 'Required'
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(state.slug)) e.slug = 'Must be kebab-case (lowercase, hyphen-separated)'
  else if (existingSouls.some((s) => s.slug === state.slug)) e.slug = `Slug "${state.slug}" already exists in the registry`

  if (!state.inspired_by.trim()) e.inspired_by = 'Required (e.g. "Severus Snape (Harry Potter)")'
  if (!state.think.trim()) e.think = 'Required (e.g. "Severus Snape, but for code review.")'

  if (state.tags.length === 0) e.tags = 'Add at least one tag'
  if (state.best_for.length === 0) e.best_for = 'Add at least one use case'
  if (state.avoid_for.length === 0) e.avoid_for = 'Add at least one anti-use-case'

  // Radar discipline (per the Scoring Discipline rules in the Authoring Guide)
  const lows = AXIS_CODES.filter((c) => state.radar[c] <= 3).length
  const highs = AXIS_CODES.filter((c) => state.radar[c] >= 7).length
  if (lows < RULES.MIN_LOW) {
    e.radar = `Scoring discipline: at least ${RULES.MIN_LOW} axis must be ≤ 3 (currently 0). The dip is what makes the soul useful — it names the trade-off.`
  } else if (highs < RULES.MIN_HIGH) {
    e.radar = `Scoring discipline: at least ${RULES.MIN_HIGH} axis must be ≥ 7 (currently 0). The spike is what you hire the soul for — without one, the persona is uncalibrated and has no characteristic strength.`
  } else if (highs > RULES.MAX_HIGH) {
    e.radar = `Scoring discipline: no more than ${RULES.MAX_HIGH} axes may be ≥ 7 (currently ${highs}). A soul strong everywhere is uncalibrated and has no characteristic failure mode under stress.`
  }

  // Prose
  if (!state.personality_profile.trim()) e.personality_profile = 'Required'

  const validBoons = state.boons.filter((b) => b.name.trim() && b.description.trim()).length
  if (validBoons < RULES.MIN_BOONS) e.boons = `${RULES.MIN_BOONS} required (have ${validBoons} complete)`

  const validFlaws = state.flaws.filter((f) => f.name.trim() && f.description.trim()).length
  if (validFlaws < RULES.MIN_FLAWS) e.flaws = `${RULES.MIN_FLAWS} required (have ${validFlaws} complete)`

  for (const k of ['stress', 'conflict', 'ambiguity', 'wrong_user']) {
    if (!state.forecast[k].trim()) e[`forecast_${k}`] = 'Required'
  }

  const validBestForDetail = state.best_for_detail.filter((b) => b.name.trim() && b.justification.trim()).length
  if (validBestForDetail < RULES.MIN_BEST_FOR_DETAIL) {
    e.best_for_detail = `${RULES.MIN_BEST_FOR_DETAIL} required (have ${validBestForDetail} complete)`
  }
  const validAvoidForDetail = state.avoid_for_detail.filter((a) => a.name.trim() && a.justification.trim()).length
  if (validAvoidForDetail < RULES.MIN_AVOID_FOR_DETAIL) {
    e.avoid_for_detail = `${RULES.MIN_AVOID_FOR_DETAIL} required (have ${validAvoidForDetail} complete)`
  }

  if (!state.caveats.trim()) e.caveats = 'Required'

  const validCore = state.core_identity.filter((s) => s.trim()).length
  if (validCore < RULES.MIN_CORE_IDENTITY) {
    e.core_identity = `${RULES.MIN_CORE_IDENTITY} required (have ${validCore})`
  }

  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)
const errorCount = computed(() => Object.keys(errors.value).length)

// Show field errors only after the user attempts to download
const showErr = (key) => submitted.value && !!errors.value[key]

// Radar dip/spike summary for the live panel
const radarStats = computed(() => {
  const lows = AXIS_CODES.filter((c) => state.radar[c] <= 3)
  const highs = AXIS_CODES.filter((c) => state.radar[c] >= 7)
  return { lows, highs }
})

// Total points = sum of all 10 axis scores. Used as a soft "balance" indicator —
// not enforced (the lows/highs rules are the actual constraints), but compared
// against the range across existing souls so the user can see if their persona
// is wildly more or less capable overall than the curated starter set.
const totalScore = computed(() =>
  AXIS_CODES.reduce((sum, c) => sum + (state.radar[c] || 0), 0)
)

const starterRange = computed(() => {
  const totals = existingSouls.map((s) =>
    AXIS_CODES.reduce((sum, c) => sum + (s.radar?.[c] || 0), 0)
  )
  if (totals.length === 0) return { min: 30, max: 80 }
  return { min: Math.min(...totals), max: Math.max(...totals) }
})

const totalStatus = computed(() => {
  const t = totalScore.value
  const { min, max } = starterRange.value
  if (t < min) return 'low'
  if (t > max) return 'high'
  return 'ok'
})

// ---------------------------------------------------------------------------
// Dynamic list helpers
// ---------------------------------------------------------------------------

const addBoon = () => state.boons.push({ name: '', description: '' })
const removeBoon = (i) => { if (state.boons.length > 1) state.boons.splice(i, 1) }
const addFlaw = () => state.flaws.push({ name: '', description: '' })
const removeFlaw = (i) => { if (state.flaws.length > 1) state.flaws.splice(i, 1) }
const addBestForDetail = () => state.best_for_detail.push({ name: '', justification: '' })
const removeBestForDetail = (i) => { if (state.best_for_detail.length > 1) state.best_for_detail.splice(i, 1) }
const addAvoidForDetail = () => state.avoid_for_detail.push({ name: '', justification: '' })
const removeAvoidForDetail = (i) => { if (state.avoid_for_detail.length > 1) state.avoid_for_detail.splice(i, 1) }
const addCoreIdentity = () => state.core_identity.push('')
const removeCoreIdentity = (i) => { if (state.core_identity.length > 1) state.core_identity.splice(i, 1) }

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function quote(s) { return `"${(s || '').replace(/"/g, '\\"')}"` }
function arr(list) { return `[${list.join(', ')}]` }

function renderMarkdown() {
  const fm = []
  fm.push(`archetype: ${quote(state.archetype.trim())}`)
  fm.push(`slug: ${quote(state.slug.trim())}`)
  fm.push(`version: ${quote(state.version || '1.0.0')}`)
  if (state.starter_order != null && Number.isInteger(state.starter_order)) {
    fm.push(`starter_order: ${state.starter_order}`)
  }
  fm.push(`inspired_by: ${quote(state.inspired_by.trim())}`)
  fm.push(`tags: ${arr(state.tags)}`)
  fm.push(`radar:`)
  for (const code of AXIS_CODES) fm.push(`  ${code}: ${state.radar[code]}`)
  fm.push(`best_for: ${arr(state.best_for)}`)
  fm.push(`avoid_for: ${arr(state.avoid_for)}`)

  const boons = state.boons
    .filter((b) => b.name.trim() && b.description.trim())
    .map((b) => `- **${b.name.trim()}:** ${b.description.trim()}`)
    .join('\n')

  const flaws = state.flaws
    .filter((f) => f.name.trim() && f.description.trim())
    .map((f) => `- **${f.name.trim()}:** ${f.description.trim()}`)
    .join('\n')

  const bestForDetail = state.best_for_detail
    .filter((b) => b.name.trim() && b.justification.trim())
    .map((b) => `- **${b.name.trim()}:** ${b.justification.trim()}`)
    .join('\n')

  const avoidForDetail = state.avoid_for_detail
    .filter((a) => a.name.trim() && a.justification.trim())
    .map((a) => `- **${a.name.trim()}:** ${a.justification.trim()}`)
    .join('\n')

  const coreId = state.core_identity
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n')

  const think = state.think.trim().replace(/\.$/, '') + '.'

  return `---
${fm.join('\n')}
---

# ${state.archetype.trim()}

**Think:** ${think}

<SoulRadar />

<SoulQuickExport />

## Personality Profile
${state.personality_profile.trim()}

## Boons & Perks
${boons}

## Flaws & Quirks
${flaws}

## Behavioral Forecast
**Under stress** (production incident, hard deadline, conflicting priorities): ${state.forecast.stress.trim()}

**Under conflict** (user disagrees, peer agent contradicts, spec is ambiguous): ${state.forecast.conflict.trim()}

**Under ambiguity** (underspecified task, missing context, unclear success criteria): ${state.forecast.ambiguity.trim()}

**With a wrong user** (user is mistaken, asking for something harmful, or out of scope): ${state.forecast.wrong_user.trim()}

## Best For
${bestForDetail}

## Avoid For
${avoidForDetail}

## Runtime Caveats
Where the design intent collides with the substrate. See [Machine-Soul Friction](/machine-soul-friction).

${state.caveats.trim()}

## Core Identity Instructions
${coreId}

<SoulExport />
`
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function tryDownload() {
  submitted.value = true
  if (!isValid.value) {
    // Scroll to first error if any field is in error
    setTimeout(() => {
      const firstErr = document.querySelector('.weaver-form .has-error')
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return
  }
  const md = renderMarkdown()
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${state.slug || 'soul'}.md`
  a.click()
  URL.revokeObjectURL(url)
}

async function tryCopy() {
  submitted.value = true
  if (!isValid.value) return
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(renderMarkdown())
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch (err) {
    copyError.value = `Copy failed: ${err.message}`
  }
}

function resetForm() {
  if (typeof window === 'undefined') return
  if (!confirm('Discard this draft and start over? This cannot be undone.')) return
  Object.assign(state, emptyState())
  submitted.value = false
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

// ---------------------------------------------------------------------------
// Autofill flows — both backed by the same parseSoulMarkdown() utility.
// ---------------------------------------------------------------------------

function isStateMostlyEmpty() {
  // Used to decide whether to confirm before overwriting. "Mostly empty" =
  // nothing the user would mourn losing.
  if (state.archetype.trim() || state.inspired_by.trim() || state.think.trim()) return false
  if (state.personality_profile.trim()) return false
  if (state.boons.some((b) => b.name.trim() || b.description.trim())) return false
  if (state.flaws.some((f) => f.name.trim() || f.description.trim())) return false
  return true
}

function applyParsedState(parsed) {
  // Merge parsed state into the reactive `state` object. Keep the slugAuto
  // flag in sync: if the parser produced a slug, treat it as user-set so the
  // archetype watcher doesn't overwrite it.
  for (const key of Object.keys(parsed)) {
    if (key === 'radar') {
      for (const code of AXIS_CODES) {
        if (typeof parsed.radar?.[code] === 'number') state.radar[code] = parsed.radar[code]
      }
    } else if (key === 'forecast') {
      for (const k of ['stress', 'conflict', 'ambiguity', 'wrong_user']) {
        if (typeof parsed.forecast?.[k] === 'string') state.forecast[k] = parsed.forecast[k]
      }
    } else if (Array.isArray(parsed[key])) {
      // Replace arrays wholesale (boons, flaws, tags, etc.)
      state[key] = JSON.parse(JSON.stringify(parsed[key]))
    } else if (parsed[key] !== undefined) {
      state[key] = parsed[key]
    }
  }
  state.slugAuto = false  // parsed slug overrides auto-derivation
  submitted.value = false  // re-arm validation messages for the new content

  // Ensure the dynamic lists have the right minimum lengths the form expects
  if (state.boons.length === 0) state.boons = [{ name: '', description: '' }, { name: '', description: '' }, { name: '', description: '' }]
  if (state.flaws.length === 0) state.flaws = [{ name: '', description: '' }, { name: '', description: '' }, { name: '', description: '' }]
  if (state.best_for_detail.length === 0) state.best_for_detail = [{ name: '', justification: '' }, { name: '', justification: '' }]
  if (state.avoid_for_detail.length === 0) state.avoid_for_detail = [{ name: '', justification: '' }, { name: '', justification: '' }]
  if (state.core_identity.length === 0) state.core_identity = ['', '', '']
}

const autofillSlug = ref('')
const autofillStatus = ref('')   // user-facing status banner
const autofillError = ref('')

async function autofillFromSlug(slug) {
  if (!slug) return
  if (!isStateMostlyEmpty()) {
    if (!confirm('This will overwrite your current draft. Continue?')) {
      autofillSlug.value = ''
      return
    }
  }
  autofillError.value = ''
  autofillStatus.value = `Loading ${slug}…`
  try {
    const res = await fetch(withBase(`/exports/${slug}/soul.md`))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const md = await res.text()
    const { state: parsed, warnings } = parseSoulMarkdown(md)
    applyParsedState(parsed)
    const archetype = parsed.archetype || slug
    autofillStatus.value = warnings.length
      ? `Loaded ${archetype} (${warnings.length} parser note${warnings.length === 1 ? '' : 's'} — review the form).`
      : `Loaded ${archetype}. Edit any field to make it your own.`
    setTimeout(() => { autofillStatus.value = '' }, 5000)
  } catch (err) {
    autofillError.value = `Couldn't autofill: ${err.message}`
  } finally {
    autofillSlug.value = ''
  }
}

watch(autofillSlug, (v) => { if (v) autofillFromSlug(v) })

// ---------------------------------------------------------------------------
// AI round-trip: user describes → copy prompt → paste response → autofill
// ---------------------------------------------------------------------------

const aiDescription = ref('')
const aiPasteback = ref('')
const aiPromptCopied = ref(false)
const aiCopyError = ref('')
const aiParseWarnings = ref([])
const aiParseStatus = ref('')

async function copyAiPrompt() {
  aiCopyError.value = ''
  const prompt = buildSoulPrompt(aiDescription.value)
  try {
    await navigator.clipboard.writeText(prompt)
    aiPromptCopied.value = true
    setTimeout(() => { aiPromptCopied.value = false }, 1800)
  } catch (err) {
    aiCopyError.value = `Couldn't copy to clipboard: ${err.message}`
  }
}

function autofillFromAiResponse() {
  const md = aiPasteback.value.trim()
  if (!md) {
    aiParseStatus.value = 'Paste the AI\'s response above first.'
    aiParseWarnings.value = []
    return
  }
  if (!isStateMostlyEmpty()) {
    if (!confirm('This will overwrite your current draft. Continue?')) return
  }
  const { state: parsed, warnings } = parseSoulMarkdown(md)
  applyParsedState(parsed)
  aiParseWarnings.value = warnings
  aiParseStatus.value = warnings.length
    ? `Autofilled with ${warnings.length} parser note${warnings.length === 1 ? '' : 's'} below — review the form and the validation panel.`
    : `Autofilled cleanly. Review the form before downloading.`
  // Clear the paste-back to free up the textarea (state is now in the form)
  aiPasteback.value = ''
}
</script>

<template>
  <div class="soul-weaver">
    <!-- ============================================================== -->
    <!--  LEFT COLUMN: form                                                -->
    <!-- ============================================================== -->
    <form class="weaver-form" @submit.prevent="tryDownload">

      <!-- Quick start (optional) -->
      <section class="weaver-section quickstart-section">
        <h2 class="section-title">Quick start <span class="section-optional">(optional)</span></h2>
        <p class="section-help">
          Skip ahead by autofilling the form. Building from scratch? Skip this section and start with Identity below.
        </p>

        <details class="quickstart-block">
          <summary class="quickstart-summary">
            <span class="qs-arrow" aria-hidden="true">▸</span>
            <span class="qs-label">Autofill from an existing soul</span>
            <span class="qs-hint">use any of the {{ existingSouls.length }} starter souls as a template</span>
          </summary>
          <div class="quickstart-body">
            <p class="help">Loads the full soul into the form — radar scores, prose, all sections. Useful for forking an archetype or seeing the format by example. Will overwrite the current draft.</p>
            <select v-model="autofillSlug" class="qs-select">
              <option value="">— pick a soul to load —</option>
              <option v-for="s in existingSouls" :key="s.slug" :value="s.slug">
                {{ s.archetype }} — Think: {{ s.inspired_by }}
              </option>
            </select>
            <p v-if="autofillStatus" class="qs-status">{{ autofillStatus }}</p>
            <p v-if="autofillError" class="qs-error" role="alert">{{ autofillError }}</p>
          </div>
        </details>

        <details class="quickstart-block">
          <summary class="quickstart-summary">
            <span class="qs-arrow" aria-hidden="true">▸</span>
            <span class="qs-label">Generate with AI assistance</span>
            <span class="qs-hint">describe the soul → paste into your AI → paste the response back here</span>
          </summary>
          <div class="quickstart-body">
            <p class="help">
              The site is hosted statically so we can't call an AI for you, but we can hand you a structured prompt that any modern model (Claude, ChatGPT, Gemini, local LLM) can use to produce a complete soul. Paste the response back below to autofill the form. Then review and tune.
            </p>

            <div class="ai-step">
              <label>
                <span class="lbl">1. Describe the soul you want <span class="req">*</span></span>
                <textarea
                  v-model="aiDescription"
                  rows="3"
                  placeholder='e.g. "A research librarian who always cites primary sources, hates citing Wikipedia, and gets visibly frustrated when someone paraphrases without attribution. Think: a stricter, less patient version of Hermione Granger."'
                  class="qs-textarea"
                />
              </label>
              <p class="help">A sentence or two is enough. The prompt embeds the schema, rules, and a worked example, so the AI knows the format.</p>
            </div>

            <div class="ai-step">
              <label class="lbl">2. Copy the prompt and paste it into your AI</label>
              <div class="ai-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  :class="{ 'is-copied': aiPromptCopied }"
                  @click="copyAiPrompt"
                  :disabled="!aiDescription.trim()"
                >
                  {{ aiPromptCopied ? 'Copied — paste into your AI' : 'Copy AI prompt' }}
                </button>
              </div>
              <p v-if="aiCopyError" class="qs-error" role="alert">{{ aiCopyError }}</p>
              <p class="help">The prompt is ~3K tokens. Fits any modern model. Output is the soul.md file content.</p>
            </div>

            <div class="ai-step">
              <label>
                <span class="lbl">3. Paste the AI's response here</span>
                <textarea
                  v-model="aiPasteback"
                  rows="6"
                  placeholder="Paste the entire markdown the AI produced, starting with --- frontmatter ---"
                  class="qs-textarea"
                  spellcheck="false"
                />
              </label>
              <div class="ai-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="autofillFromAiResponse"
                  :disabled="!aiPasteback.trim()"
                >
                  Autofill form from response
                </button>
              </div>
              <p v-if="aiParseStatus" class="qs-status">{{ aiParseStatus }}</p>
              <ul v-if="aiParseWarnings.length" class="qs-warnings">
                <li v-for="(w, i) in aiParseWarnings" :key="i">{{ w }}</li>
              </ul>
            </div>
          </div>
        </details>
      </section>

      <!-- Identity -->
      <section class="weaver-section">
        <h2 class="section-title">Identity</h2>

        <div class="field" :class="{ 'has-error': showErr('archetype') }">
          <label>
            <span class="lbl">Archetype name <span class="req">*</span></span>
            <input v-model="state.archetype" type="text" placeholder='The Bitter Mentor' />
          </label>
          <p v-if="showErr('archetype')" class="err-msg">{{ errors.archetype }}</p>
          <p class="help">Must begin with "The ". This is the canonical name; the inspiration goes in the next field.</p>
        </div>

        <div class="field-row">
          <div class="field" :class="{ 'has-error': showErr('slug') }">
            <label>
              <span class="lbl">Slug <span class="req">*</span></span>
              <input v-model="state.slug" type="text" placeholder="the-bitter-mentor" @input="onSlugInput" />
            </label>
            <p v-if="showErr('slug')" class="err-msg">{{ errors.slug }}</p>
            <p class="help">Filename in <code>docs/souls/</code>. Auto-derived from archetype until you edit it.</p>
          </div>

          <div class="field">
            <label>
              <span class="lbl">Version</span>
              <input v-model="state.version" type="text" placeholder="1.0.0" />
            </label>
          </div>
        </div>

        <div class="field" :class="{ 'has-error': showErr('inspired_by') }">
          <label>
            <span class="lbl">Inspired by <span class="req">*</span></span>
            <input v-model="state.inspired_by" type="text" placeholder='Severus Snape (Harry Potter)' />
          </label>
          <p v-if="showErr('inspired_by')" class="err-msg">{{ errors.inspired_by }}</p>
          <p class="help">Character + source. Searchable filter in the gallery; appears under the archetype name in the sidebar.</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('think') }">
          <label>
            <span class="lbl">Think line <span class="req">*</span></span>
            <input v-model="state.think" type="text" placeholder='Severus Snape, but for code review' />
          </label>
          <p v-if="showErr('think')" class="err-msg">{{ errors.think }}</p>
          <p class="help">One short sentence that lands the persona. Will render as <code>**Think:** &lt;text&gt;.</code></p>
        </div>
      </section>

      <!-- Tags + use cases -->
      <section class="weaver-section">
        <h2 class="section-title">Tags & Use Cases</h2>

        <div class="field" :class="{ 'has-error': showErr('tags') }">
          <label>
            <span class="lbl">Descriptive tags <span class="req">*</span></span>
            <input v-model="tagsModel" type="text" placeholder="reviewer, security, harsh, expert, mentor" />
          </label>
          <p v-if="showErr('tags')" class="err-msg">{{ errors.tags }}</p>
          <p class="help">Comma-separated. Free-form descriptive labels (search target).</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('best_for') }">
          <label>
            <span class="lbl">Best for (use cases) <span class="req">*</span></span>
            <input v-model="bestForModel" type="text" placeholder="code-review, security-audit, devils-advocate" />
          </label>
          <p v-if="showErr('best_for')" class="err-msg">{{ errors.best_for }}</p>
          <p class="help">Comma-separated. Spaces auto-converted to hyphens. Drives the gallery's "Use case" filter.</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('avoid_for') }">
          <label>
            <span class="lbl">Avoid for <span class="req">*</span></span>
            <input v-model="avoidForModel" type="text" placeholder="customer-support, onboarding, pair-programming-with-juniors" />
          </label>
          <p v-if="showErr('avoid_for')" class="err-msg">{{ errors.avoid_for }}</p>
          <p class="help">Comma-separated, kebab-case auto-applied. The deliberate trade-offs.</p>
        </div>
      </section>

      <!-- Radar -->
      <section class="weaver-section">
        <h2 class="section-title">Radar Scores</h2>
        <p class="section-help">
          Score each axis 1–10. The polygon updates live on the right.
        </p>

        <aside class="why-callout">
          <p class="why-title">Why aren't all-10s allowed?</p>
          <p>
            A persona without trade-offs is uncalibrated — it has no characteristic failure mode under stress, so it just becomes a generic helpful assistant, defeating the point of having a persona at all. The <strong>dip</strong> tells you what you're trading away; the <strong>spikes</strong> tell you what you're hiring it for. That tension is the whole project thesis: <em>predictable unpredictability</em> requires real flaws to surface.
          </p>
          <p>
            The <a :href="withBase('/soul-authoring-guide#_5-scoring-discipline')">Scoring Discipline</a> rules codify this symmetrically:
          </p>
          <ul>
            <li><strong>At least one axis ≤ 3</strong> — names the trade-off the soul makes</li>
            <li><strong>At least one axis ≥ 7</strong> — names the strength the soul is hired for</li>
            <li><strong>No more than four axes ≥ 7</strong> — keeps the persona shaped, not generically capable</li>
          </ul>
          <p class="why-budget">
            <strong>Total points</strong> across all 10 axes is a soft balance check, shown live on the right.
            The {{ existingSouls.length }} starter souls range from <strong>{{ starterRange.min }}</strong> to <strong>{{ starterRange.max }}</strong>.
            Drift far outside that and the persona is either underdrawn or unrealistically capable.
          </p>
        </aside>

        <div v-if="showErr('radar')" class="banner-error">{{ errors.radar }}</div>

        <div class="radar-grid">
          <div
            v-for="g in AXIS_GROUPS"
            :key="g.id"
            class="radar-group"
            :class="`group-${g.id}`"
          >
            <h3 class="radar-group-name">{{ g.name }}</h3>
            <div v-for="code in g.axes" :key="code" class="radar-row">
              <span class="r-code">{{ code }}</span>
              <div class="r-info">
                <span class="r-full">{{ AXIS_INFO[code].full }}</span>
                <span class="r-hint">{{ AXIS_INFO[code].hint }}</span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                v-model.number="state.radar[code]"
                :class="`group-${g.id}`"
              />
              <span class="r-value">{{ state.radar[code] }}</span>
            </div>
          </div>
        </div>

      </section>

      <!-- Personality profile -->
      <section class="weaver-section">
        <h2 class="section-title">Personality Profile</h2>
        <p class="section-help">3–5 sentences naming the central tension: what this soul is willing to trade away in exchange for what it's good at.</p>
        <div class="field" :class="{ 'has-error': showErr('personality_profile') }">
          <textarea
            v-model="state.personality_profile"
            rows="5"
            placeholder="A technically formidable reviewer who treats every submission as guilty until proven innocent…"
          />
          <p v-if="showErr('personality_profile')" class="err-msg">{{ errors.personality_profile }}</p>
        </div>
      </section>

      <!-- Boons -->
      <section class="weaver-section">
        <h2 class="section-title">Boons & Perks</h2>
        <p class="section-help">{{ RULES.MIN_BOONS }}+ named strengths. Each: short title, one-sentence description.</p>
        <div v-if="showErr('boons')" class="banner-error">{{ errors.boons }}</div>

        <div v-for="(b, i) in state.boons" :key="`boon-${i}`" class="bullet-row">
          <input v-model="b.name" type="text" class="bullet-name" placeholder="Pre-emptive distrust" />
          <input v-model="b.description" type="text" class="bullet-desc" placeholder="Reads inputs as adversarial, specs as wrong, happy paths as traps." />
          <button type="button" class="row-remove" @click="removeBoon(i)" :disabled="state.boons.length <= 1" aria-label="Remove">×</button>
        </div>
        <button type="button" class="row-add" @click="addBoon">+ Add boon</button>
      </section>

      <!-- Flaws -->
      <section class="weaver-section">
        <h2 class="section-title">Flaws & Quirks</h2>
        <p class="section-help">
          {{ RULES.MIN_FLAWS }}+ behaviors that bubble up under stress. Each should share a root with one of the boons —
          same trait, different output. See <a :href="withBase('/soul-authoring-guide#_4-how-to-write-a-flaw-that-bubbles-up')">How to write a flaw that bubbles up</a>.
        </p>
        <div v-if="showErr('flaws')" class="banner-error">{{ errors.flaws }}</div>

        <div v-for="(f, i) in state.flaws" :key="`flaw-${i}`" class="bullet-row">
          <input v-model="f.name" type="text" class="bullet-name" placeholder="Slips from technical to personal critique" />
          <input v-model="f.description" type="text" class="bullet-desc" placeholder="When reviewing junior work, escalates from 'this code does X wrong' to 'you do X wrong' without noticing the line." />
          <button type="button" class="row-remove" @click="removeFlaw(i)" :disabled="state.flaws.length <= 1" aria-label="Remove">×</button>
        </div>
        <button type="button" class="row-add" @click="addFlaw">+ Add flaw</button>
      </section>

      <!-- Forecast -->
      <section class="weaver-section">
        <h2 class="section-title">Behavioral Forecast</h2>
        <p class="section-help">Two to three sentences for each trigger.</p>

        <div class="field" :class="{ 'has-error': showErr('forecast_stress') }">
          <label>
            <span class="lbl">Under stress <span class="req">*</span></span>
            <textarea v-model="state.forecast.stress" rows="3" placeholder="Becomes terser and more dismissive. Will identify the root cause faster than anyone else…" />
          </label>
          <p v-if="showErr('forecast_stress')" class="err-msg">{{ errors.forecast_stress }}</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('forecast_conflict') }">
          <label>
            <span class="lbl">Under conflict <span class="req">*</span></span>
            <textarea v-model="state.forecast.conflict" rows="3" placeholder="Treats disagreement as a competence claim and escalates the technical specificity…" />
          </label>
          <p v-if="showErr('forecast_conflict')" class="err-msg">{{ errors.forecast_conflict }}</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('forecast_ambiguity') }">
          <label>
            <span class="lbl">Under ambiguity <span class="req">*</span></span>
            <textarea v-model="state.forecast.ambiguity" rows="3" placeholder="Refuses to proceed without specification. Returns the task with a list of resolved/unresolved questions…" />
          </label>
          <p v-if="showErr('forecast_ambiguity')" class="err-msg">{{ errors.forecast_ambiguity }}</p>
        </div>

        <div class="field" :class="{ 'has-error': showErr('forecast_wrong_user') }">
          <label>
            <span class="lbl">With a wrong user <span class="req">*</span></span>
            <textarea v-model="state.forecast.wrong_user" rows="3" placeholder="Says so, plainly, with the specific reason. Does not soften…" />
          </label>
          <p v-if="showErr('forecast_wrong_user')" class="err-msg">{{ errors.forecast_wrong_user }}</p>
        </div>
      </section>

      <!-- Best For (detail) -->
      <section class="weaver-section">
        <h2 class="section-title">Best For (detail)</h2>
        <p class="section-help">{{ RULES.MIN_BEST_FOR_DETAIL }}+ roles with one-sentence justification each.</p>
        <div v-if="showErr('best_for_detail')" class="banner-error">{{ errors.best_for_detail }}</div>

        <div v-for="(b, i) in state.best_for_detail" :key="`bfd-${i}`" class="bullet-row">
          <input v-model="b.name" type="text" class="bullet-name" placeholder="Code review (security-sensitive)" />
          <input v-model="b.justification" type="text" class="bullet-desc" placeholder="AUD 9 means the bug gets found. CSR 1 means the author won't enjoy it, but the diff will be safer." />
          <button type="button" class="row-remove" @click="removeBestForDetail(i)" :disabled="state.best_for_detail.length <= 1" aria-label="Remove">×</button>
        </div>
        <button type="button" class="row-add" @click="addBestForDetail">+ Add role</button>
      </section>

      <!-- Avoid For (detail) -->
      <section class="weaver-section">
        <h2 class="section-title">Avoid For (detail)</h2>
        <p class="section-help">{{ RULES.MIN_AVOID_FOR_DETAIL }}+ anti-recommendations.</p>
        <div v-if="showErr('avoid_for_detail')" class="banner-error">{{ errors.avoid_for_detail }}</div>

        <div v-for="(a, i) in state.avoid_for_detail" :key="`afd-${i}`" class="bullet-row">
          <input v-model="a.name" type="text" class="bullet-name" placeholder="Customer support" />
          <input v-model="a.justification" type="text" class="bullet-desc" placeholder="CSR 1 is not a tunable parameter here. New users will leave." />
          <button type="button" class="row-remove" @click="removeAvoidForDetail(i)" :disabled="state.avoid_for_detail.length <= 1" aria-label="Remove">×</button>
        </div>
        <button type="button" class="row-add" @click="addAvoidForDetail">+ Add</button>
      </section>

      <!-- Runtime Caveats -->
      <section class="weaver-section">
        <h2 class="section-title">Runtime Caveats</h2>
        <p class="section-help">
          Where this soul's design collides with the substrate. Pick from the seven categories on the
          <a :href="withBase('/machine-soul-friction')">Machine-Soul Friction</a> page (Helpfulness Pull, Memory Boundary,
          No Background Reflection, Voice Sanitization, Tool Dependency, Context Window Limit, Persona Re-Grounding).
          Format each as <code>- **Category (severity):** specific manifestation.</code>
        </p>
        <div class="field" :class="{ 'has-error': showErr('caveats') }">
          <textarea
            v-model="state.caveats"
            rows="6"
            placeholder='- **Memory boundary (high):** "Concedes days later in a different context" requires persistent memory across sessions…
- **Voice sanitization (high):** VOX 8 paired with CSR 1 — RLHF politeness pull will soften commit messages…
- **Helpfulness pull (medium):** CSR 1 and NEG 2 are below the default trough…'
          />
          <p v-if="showErr('caveats')" class="err-msg">{{ errors.caveats }}</p>
        </div>
      </section>

      <!-- Core Identity -->
      <section class="weaver-section">
        <h2 class="section-title">Core Identity Instructions</h2>
        <p class="section-help">
          The copy-paste system prompt. Imperative, second person, ~10 lines. {{ RULES.MIN_CORE_IDENTITY }}+ required.
          This is what users actually deploy.
        </p>
        <div v-if="showErr('core_identity')" class="banner-error">{{ errors.core_identity }}</div>

        <div v-for="(line, i) in state.core_identity" :key="`ci-${i}`" class="numbered-row">
          <span class="num">{{ i + 1 }}.</span>
          <input v-model="state.core_identity[i]" type="text" class="bullet-desc" placeholder="You are The Bitter Mentor. Your role is to find what's wrong, not to make the author feel good about it." />
          <button type="button" class="row-remove" @click="removeCoreIdentity(i)" :disabled="state.core_identity.length <= 1" aria-label="Remove">×</button>
        </div>
        <button type="button" class="row-add" @click="addCoreIdentity">+ Add instruction</button>
      </section>
    </form>

    <!-- ============================================================== -->
    <!--  RIGHT COLUMN: sticky preview + actions                            -->
    <!-- ============================================================== -->
    <aside class="weaver-preview">
      <div class="preview-radar">
        <SoulRadar
          :data="state.radar"
          :size="320"
          :show-legend="true"
          :show-tooltip="false"
          :show-axis-labels="true"
          :highlight-highest="true"
        />
      </div>

      <div class="preview-stats">
        <div class="stat">
          <span class="stat-label">Dips (≤ 3)</span>
          <span class="stat-value" :class="{ ok: radarStats.lows.length >= RULES.MIN_LOW, bad: radarStats.lows.length < RULES.MIN_LOW }">
            {{ radarStats.lows.length }} / {{ RULES.MIN_LOW }}+
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Spikes (≥ 7)</span>
          <span class="stat-value" :class="{ ok: radarStats.highs.length >= RULES.MIN_HIGH && radarStats.highs.length <= RULES.MAX_HIGH, bad: radarStats.highs.length < RULES.MIN_HIGH || radarStats.highs.length > RULES.MAX_HIGH }">
            {{ radarStats.highs.length }} / {{ RULES.MIN_HIGH }}–{{ RULES.MAX_HIGH }}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Total</span>
          <span class="stat-value" :class="totalStatus" :title="`Sum of all 10 axes. Starter souls range ${starterRange.min}–${starterRange.max}.`">
            {{ totalScore }}
            <span class="stat-range">/ {{ starterRange.min }}–{{ starterRange.max }}</span>
          </span>
        </div>
      </div>

      <div class="preview-status" :class="{ 'is-valid': isValid, 'is-invalid': !isValid }">
        <template v-if="isValid">
          <span class="status-icon" aria-hidden="true">✓</span>
          <span>All checks passing — ready to export.</span>
        </template>
        <template v-else>
          <span class="status-icon" aria-hidden="true">!</span>
          <span><strong>{{ errorCount }}</strong> issue{{ errorCount === 1 ? '' : 's' }} remaining.</span>
        </template>
      </div>

      <details v-if="!isValid && submitted" class="preview-errors">
        <summary>Show details</summary>
        <ul>
          <li v-for="(msg, key) in errors" :key="key">{{ msg }}</li>
        </ul>
      </details>

      <div class="preview-actions">
        <button type="button" class="btn btn-primary" @click="tryDownload">
          Download <code>{{ state.slug || 'soul' }}.md</code>
        </button>
        <button type="button" class="btn btn-secondary" :class="{ 'is-copied': copied }" @click="tryCopy">
          {{ copied ? 'Copied' : 'Copy markdown' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="resetForm">Reset draft</button>
      </div>

      <p v-if="copyError" class="copy-error" role="alert">{{ copyError }}</p>

      <p class="preview-footnote">
        Drafts auto-save to your browser's localStorage. Refresh-safe; not synced across devices.
        After download, drop the file into <code>docs/souls/</code> and open a PR.
      </p>
    </aside>
  </div>
</template>

<style scoped>
/* ============================ Layout ============================ */

.soul-weaver {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 2rem;
  align-items: start;
  margin: 1.5rem 0 3rem;
}

.weaver-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
}

.weaver-preview {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

@media (max-width: 1024px) {
  .soul-weaver {
    grid-template-columns: 1fr;
  }
  .weaver-preview {
    position: static;
    order: -1;
  }
}

/* ============================ Sections ============================ */

.weaver-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: none;
  padding: 0;
}

.section-help {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1.5;
}

.section-help a {
  color: var(--vp-c-brand-1);
}

/* ============================ Fields ============================ */

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.lbl {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  margin-bottom: 0.3rem;
}

.req {
  color: var(--vp-c-brand-1);
}

.help {
  margin: 0;
  font-size: 0.78rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  line-height: 1.45;
}

.help code {
  font-size: 0.78em;
  padding: 0.05em 0.35em;
  background: var(--vp-c-bg);
  border-radius: 3px;
}

input[type="text"],
input[type="number"],
select,
textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
  font-size: 0.92rem;
  line-height: 1.5;
}

textarea {
  resize: vertical;
  min-height: 4em;
  font-family: var(--vp-font-family-base);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft, rgba(94, 234, 212, 0.18));
}

.field.has-error input,
.field.has-error textarea,
.field.has-error select {
  border-color: var(--vp-c-danger-1, #ef4444);
}

.err-msg {
  margin: 0;
  color: var(--vp-c-danger-1, #ef4444);
  font-size: 0.78rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.banner-error {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--vp-c-danger-soft, rgba(239, 68, 68, 0.1));
  border: 1px solid var(--vp-c-danger-1, #ef4444);
  color: var(--vp-c-danger-1, #ef4444);
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* Pedagogical callout — explains the WHY of the scoring rules so new authors
 * don't think the constraints are arbitrary. Placed inline above the radar
 * sliders so the explanation arrives before the limits do. */
.why-callout {
  padding: 0.85rem 1rem;
  border-radius: 6px;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
.why-callout p {
  margin: 0 0 0.55rem;
}
.why-callout p:last-child {
  margin-bottom: 0;
}
.why-callout .why-title {
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}
.why-callout .why-budget {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 0.82rem;
}
.why-callout strong {
  color: var(--vp-c-text-1);
}
.why-callout em {
  color: var(--vp-c-brand-1);
  font-style: italic;
}
.why-callout a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.why-callout ul {
  margin: 0.4rem 0 0.6rem;
  padding-left: 1.3rem;
}
.why-callout li {
  margin-bottom: 0.25rem;
}

/* ============================ Radar grid ============================ */

.radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.85rem;
}

.radar-group {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.radar-group.group-build       { color: var(--soul-build); }
.radar-group.group-verify      { color: var(--soul-verify); }
.radar-group.group-communicate { color: var(--soul-communicate); }
.radar-group.group-operate     { color: var(--soul-operate); }

.radar-group-name {
  margin: 0 0 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: currentColor;
  border: none;
  padding: 0;
}

.radar-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr 5rem 1.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
}

.r-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 0.85rem;
  color: currentColor;
}

.r-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.r-full {
  font-size: 0.78rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-hint {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.radar-row input[type="range"] {
  width: 100%;
  accent-color: currentColor;
  cursor: pointer;
}

.r-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: right;
  color: currentColor;
}

.preset-row {
  margin-top: 0.5rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--vp-c-divider);
}

/* ============================ Bullet rows ============================ */

.bullet-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(0, 2fr) 2rem;
  gap: 0.5rem;
  align-items: start;
}

@media (max-width: 720px) {
  .bullet-row {
    grid-template-columns: 1fr 2rem;
  }
  .bullet-row .bullet-name {
    grid-column: 1 / -2;
  }
  .bullet-row .bullet-desc {
    grid-column: 1 / -2;
  }
  .bullet-row .row-remove {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
}

.numbered-row {
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  gap: 0.5rem;
  align-items: center;
}

.num {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  text-align: right;
}

.row-remove,
.row-add {
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-2);
  transition: border-color 0.14s ease, color 0.14s ease;
}

.row-remove {
  width: 2rem;
  height: 2rem;
  padding: 0;
  font-size: 1.2rem;
  line-height: 1;
}
.row-remove:hover:not(:disabled) {
  border-color: var(--vp-c-danger-1, #ef4444);
  color: var(--vp-c-danger-1, #ef4444);
}
.row-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.row-add {
  align-self: flex-start;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
}
.row-add:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* ============================ Preview panel ============================ */

.preview-radar {
  display: flex;
  justify-content: center;
}

.preview-stats {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.stat-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.stat-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 0.95rem;
}

.stat-value.ok   { color: var(--soul-build, #14b8a6); }
.stat-value.bad  { color: var(--vp-c-danger-1, #ef4444); }
.stat-value.low,
.stat-value.high { color: var(--soul-verify, #d97706); }
.stat-range {
  font-weight: 400;
  font-size: 0.7rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  margin-left: 0.15rem;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid transparent;
}
.preview-status.is-valid {
  background: var(--vp-c-brand-soft, rgba(94, 234, 212, 0.14));
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.preview-status.is-invalid {
  background: var(--vp-c-danger-soft, rgba(239, 68, 68, 0.1));
  color: var(--vp-c-danger-1, #ef4444);
  border-color: var(--vp-c-danger-1, #ef4444);
}

.status-icon {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 1rem;
}

.preview-errors {
  font-size: 0.78rem;
}
.preview-errors > summary {
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.04em;
}
.preview-errors ul {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
  color: var(--vp-c-danger-1, #ef4444);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.preview-errors li {
  margin-bottom: 0.25rem;
}

/* ============================ Action buttons ============================ */

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: var(--vp-font-family-base);
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-brand-1);
}
.btn-primary:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.btn-secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.btn-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.btn-secondary.is-copied {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: transparent;
  font-size: 0.78rem;
  padding: 0.4rem 0.6rem;
}
.btn-ghost:hover {
  color: var(--vp-c-danger-1, #ef4444);
}

.btn code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
  font-weight: 600;
  background: transparent;
  padding: 0;
}

.copy-error {
  margin: 0;
  font-size: 0.78rem;
  color: var(--vp-c-danger-1, #ef4444);
}

.preview-footnote {
  margin: 0;
  font-size: 0.72rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  line-height: 1.5;
}
.preview-footnote code {
  font-size: 0.85em;
  background: var(--vp-c-bg);
  padding: 0.05em 0.3em;
  border-radius: 3px;
}

/* ============================ Quick Start section ============================ */

.quickstart-section {
  border-color: var(--vp-c-brand-1);
}

.section-optional {
  font-weight: 400;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.04em;
  margin-left: 0.4rem;
}

.quickstart-block {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  margin-top: 0.25rem;
  overflow: hidden;
}

.quickstart-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
  list-style: none;
  transition: background 0.14s ease, color 0.14s ease;
}

.quickstart-summary::-webkit-details-marker {
  display: none;
}

.quickstart-summary:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.quickstart-block[open] > .quickstart-summary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
}

.qs-arrow {
  display: inline-block;
  width: 0.9rem;
  text-align: center;
  font-size: 0.85rem;
  line-height: 1;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  transition: transform 0.18s ease, color 0.14s ease;
}

.quickstart-block[open] > .quickstart-summary .qs-arrow {
  transform: rotate(90deg);
  color: var(--vp-c-brand-1);
}

.qs-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.qs-hint {
  text-transform: none;
  letter-spacing: normal;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  font-size: 0.75rem;
}

.quickstart-body {
  padding: 0.85rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.qs-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
  font-size: 0.92rem;
}

.qs-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.ai-step {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.ai-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.qs-status {
  margin: 0;
  font-size: 0.82rem;
  color: var(--vp-c-brand-1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.qs-error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--vp-c-danger-1, #ef4444);
}

.qs-warnings {
  margin: 0.25rem 0 0;
  padding-left: 1.2rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.qs-warnings li {
  margin-bottom: 0.2rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
