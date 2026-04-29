// Client-side parser that turns a soul.md string into the SoulWeaver's state shape.
//
// Used for two flows:
//   1. "Autofill from existing soul" — fetch /exports/<slug>/soul.md, parse, fill form
//   2. "Autofill from AI response"  — user pastes LLM output, parse, fill form
//
// Designed to be lenient: extracts what it can, leaves unrecognized parts empty,
// and reports what it couldn't parse via `warnings`. Never throws.
//
// Note: NOT a full YAML parser. Handles only the subset our soul.md files use
// (single-line strings/numbers, bracket arrays, an indented `radar:` block).

const AXIS_CODES = ['BLD', 'REF', 'AUD', 'DOC', 'CSR', 'NEG', 'VOX', 'OPS', 'GOV', 'ETH']

const STRING_KEYS = ['archetype', 'slug', 'version', 'inspired_by']
const ARRAY_KEYS = ['tags', 'best_for', 'avoid_for']

export function emptyState() {
  return {
    archetype: '',
    slug: '',
    version: '1.0.0',
    starter_order: null,
    inspired_by: '',
    think: '',
    tags: [],
    radar: Object.fromEntries(AXIS_CODES.map((c) => [c, 5])),
    best_for: [],
    avoid_for: [],
    personality_profile: '',
    boons: [],
    flaws: [],
    forecast: { stress: '', conflict: '', ambiguity: '', wrong_user: '' },
    best_for_detail: [],
    avoid_for_detail: [],
    caveats: '',
    core_identity: []
  }
}

export function parseSoulMarkdown(md) {
  const warnings = []
  const state = emptyState()

  if (!md || typeof md !== 'string') {
    warnings.push('No content provided.')
    return { state, warnings }
  }

  // 1. Split frontmatter from body
  const fmMatch = md.match(/^---\s*\n([\s\S]+?)\n---\s*\n?([\s\S]*)$/)
  let body = md
  if (fmMatch) {
    parseFrontmatter(fmMatch[1], state, warnings)
    body = fmMatch[2] || ''
  } else {
    warnings.push('No YAML frontmatter found — required fields will be empty.')
  }

  // 2. Strip embedded VitePress component tags from the body — they're not content.
  const cleanBody = body.replace(/<\/?Soul[A-Z][a-zA-Z]*\s*\/?>/g, '')

  // 3. Extract the Think line (first match wins)
  const thinkMatch = cleanBody.match(/^\*\*Think:\*\*\s+(.+?)\s*$/m)
  state.think = thinkMatch ? thinkMatch[1].trim().replace(/\.$/, '') : ''
  if (!state.think) warnings.push('Could not find a "**Think:** ..." line.')

  // 4. Extract structured sections
  state.personality_profile = trim(extractSection(cleanBody, 'Personality Profile'))
  state.boons = parseNamedBullets(extractSection(cleanBody, 'Boons & Perks'), 'description')
  state.flaws = parseNamedBullets(extractSection(cleanBody, 'Flaws & Quirks'), 'description')
  state.forecast = parseForecast(extractSection(cleanBody, 'Behavioral Forecast'))
  state.best_for_detail = parseNamedBullets(extractSection(cleanBody, 'Best For'), 'justification')
  state.avoid_for_detail = parseNamedBullets(extractSection(cleanBody, 'Avoid For'), 'justification')
  state.caveats = trimCaveats(extractSection(cleanBody, 'Runtime Caveats'))
  state.core_identity = parseNumberedList(extractSection(cleanBody, 'Core Identity Instructions'))

  // 5. Tally what's missing for the warnings list
  if (!state.personality_profile)               warnings.push('Personality Profile section was empty or missing.')
  if (state.boons.length === 0)                 warnings.push('No "- **Name:** description" bullets found in Boons & Perks.')
  if (state.flaws.length === 0)                 warnings.push('No "- **Name:** description" bullets found in Flaws & Quirks.')
  if (state.core_identity.length === 0)         warnings.push('No numbered items found in Core Identity Instructions.')

  return { state, warnings }
}

// ----------------------------------------------------------------------------

function parseFrontmatter(text, state, warnings) {
  const lines = text.split('\n')
  let inRadar = false

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim()) {
      inRadar = false
      continue
    }

    // Inside radar block: lines are indented with axis: number
    if (inRadar && /^\s+\S/.test(line)) {
      const m = line.match(/^\s+([A-Z]{3}):\s*(\d+)\s*$/)
      if (m && AXIS_CODES.includes(m[1])) {
        const v = parseInt(m[2], 10)
        if (Number.isInteger(v) && v >= 1 && v <= 10) state.radar[m[1]] = v
      }
      continue
    }

    // Top-level key — ends radar block if we were in one
    inRadar = false

    const kv = line.match(/^([a-z_]+):\s*(.*)$/i)
    if (!kv) continue
    const [, key, raw] = kv
    const value = raw.trim()

    if (key === 'radar') {
      inRadar = value === '' // only multi-line if value empty
      continue
    }

    if (STRING_KEYS.includes(key)) {
      state[key] = unquote(value)
    } else if (ARRAY_KEYS.includes(key)) {
      state[key] = parseArrayValue(value)
    } else if (key === 'starter_order') {
      const n = parseInt(value, 10)
      state[key] = Number.isInteger(n) ? n : null
    }
    // Unknown keys ignored silently — could be future fields
  }

  // Sanity: did we get any radar data?
  const radarPresent = AXIS_CODES.some((c) => state.radar[c] !== 5)
  if (!radarPresent) warnings.push('No radar block parsed — all axes default to 5.')
}

function unquote(s) {
  return s.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
}

function parseArrayValue(value) {
  const m = value.match(/^\[(.*)\]$/)
  if (!m) return []
  return m[1]
    .split(',')
    .map((s) => unquote(s.trim()))
    .filter(Boolean)
}

// ----------------------------------------------------------------------------

function extractSection(body, heading) {
  const safe = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startRe = new RegExp(`^##\\s+${safe}\\s*\\n`, 'm')
  const startMatch = body.match(startRe)
  if (!startMatch) return ''
  const start = startMatch.index + startMatch[0].length
  const rest = body.slice(start)
  const nextH2 = rest.match(/^## /m)
  const end = nextH2 ? start + nextH2.index : body.length
  return body.slice(start, end).trim()
}

function trim(text) {
  return (text || '').trim()
}

function trimCaveats(text) {
  if (!text) return ''
  // Strip the standard "Where the design intent..." preamble line if present
  return text
    .replace(/^Where the design intent collides with the substrate\.[^\n]*\n+/m, '')
    .trim()
}

function parseNamedBullets(sectionContent, descKey) {
  if (!sectionContent) return []
  const out = []
  for (const line of sectionContent.split('\n')) {
    const m = line.match(/^-\s+\*\*([^*:]+):\*\*\s+(.+)$/)
    if (m) out.push({ name: m[1].trim(), [descKey]: m[2].trim() })
  }
  return out
}

function parseForecast(sectionContent) {
  const result = { stress: '', conflict: '', ambiguity: '', wrong_user: '' }
  if (!sectionContent) return result

  // Each subsection starts with **Under stress** / **Under conflict** / etc.,
  // optionally followed by a parenthetical, then a colon, then text running
  // to the next bold prefix or end of section.
  const triggers = [
    { key: 'stress',     prefix: 'Under stress' },
    { key: 'conflict',   prefix: 'Under conflict' },
    { key: 'ambiguity',  prefix: 'Under ambiguity' },
    { key: 'wrong_user', prefix: 'With a wrong user' }
  ]

  for (let i = 0; i < triggers.length; i++) {
    const { key, prefix } = triggers[i]
    const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match: **Prefix** [optional parenthetical]: <content>
    const re = new RegExp(
      `\\*\\*${safePrefix}\\*\\*[^:]*:\\s*([\\s\\S]+?)(?=\\n\\s*\\*\\*(?:Under |With )|$)`,
      'i'
    )
    const m = sectionContent.match(re)
    if (m) result[key] = m[1].trim()
  }

  return result
}

function parseNumberedList(sectionContent) {
  if (!sectionContent) return []
  const out = []
  for (const line of sectionContent.split('\n')) {
    const m = line.match(/^\s*\d+\.\s+(.+)$/)
    if (m) out.push(m[1].trim())
  }
  return out
}
