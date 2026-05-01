// Build-time adapters that turn a parsed soul into ecosystem-specific export
// artifacts. Each adapter takes a normalized `soul` model (built once via
// buildSoulModel) and produces a string ready to write to disk.
//
// Adapters are pure functions — no I/O. The orchestrator
// (scripts/generate-exports.mjs) handles read/write.

const SITE_ORIGIN = 'https://sdmonkey.github.io/soulinthemachine'

// ---------------------------------------------------------------------------
// Soul model — single normalization pass shared by all adapters.
// ---------------------------------------------------------------------------

export function buildSoulModel(fm, body) {
  // Strip the project-injected Vue components from the body before extraction
  // so they don't leak into shipped artifacts (especially the trailing
  // <SoulExport /> at end-of-file, which sits inside the Core Identity section).
  const cleanBody = stripVueTags(body)

  const sections = {
    profile:        extractSection(cleanBody, 'Personality Profile'),
    boons:          extractSection(cleanBody, 'Boons & Perks'),
    flaws:          extractSection(cleanBody, 'Flaws & Quirks'),
    forecast:       extractSection(cleanBody, 'Behavioral Forecast'),
    bestForDetail:  extractSection(cleanBody, 'Best For'),
    avoidForDetail: extractSection(cleanBody, 'Avoid For'),
    coreIdentity:   extractSection(cleanBody, 'Core Identity Instructions')
  }

  const radar = fm.radar || {}
  const topAxes = Object.entries(radar)
    .filter(([, v]) => Number.isInteger(v))
    .sort(([, a], [, b]) => b - a)
    .map(([code, value]) => ({ code, value }))

  return {
    archetype: fm.archetype || 'this persona',
    slug: fm.slug || '',
    inspired_by: fm.inspired_by || '',
    inspired_by_clean: (fm.inspired_by || '').replace(/\s*\([^)]+\)$/, ''),
    think: getThinkLine(body),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    radar,
    best_for: Array.isArray(fm.best_for) ? fm.best_for : [],
    avoid_for: Array.isArray(fm.avoid_for) ? fm.avoid_for : [],
    sections,
    topAxes,
    sourceUrl: fm.slug ? `${SITE_ORIGIN}/souls/${fm.slug}` : SITE_ORIGIN
  }
}

// Drop `<SoulRadar />`, `<SoulQuickExport />`, `<SoulIntegrations />`, and
// `<SoulExport />` tags from a markdown string. These are project-injected
// Vue components that have no meaning outside our VitePress site and would
// confuse downstream tools (Claude Code would render them as literal angle-
// bracket nonsense; OpenClaw would just see noise).
export function stripVueTags(body) {
  return body
    .replace(/^[ \t]*<SoulRadar\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulQuickExport\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulIntegrations\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulExport\b[^>]*\/>[ \t]*\n?/gm, '')
}

// ---------------------------------------------------------------------------
// Existing prose-prompt format (was inline in generate-exports.mjs; moved
// here so the SDK adapters can reuse it as their SYSTEM_PROMPT).
// ---------------------------------------------------------------------------

export function toProsePrompt(soul) {
  const out = []
  out.push(`SYSTEM PROMPT — ${soul.archetype}`)
  if (soul.think) out.push(`Think: ${soul.think}.`)
  out.push('')
  out.push(`You are ${soul.archetype}. The sections below describe who you are, what`)
  out.push('you do well, the flaws you should let surface, and the directives that')
  out.push('govern your behavior. Treat the Core Identity Instructions as binding.')
  out.push('')

  pushSection(out, 'PERSONALITY',                                      soul.sections.profile)
  pushSection(out, 'STRENGTHS — use these to do the work well',        soul.sections.boons)
  pushSection(out, 'FLAWS — let these bubble up, especially under stress', soul.sections.flaws)
  pushSection(out, 'BEHAVIORAL FORECAST',                              soul.sections.forecast)
  pushSection(out, 'BEST DEPLOYED FOR',                                soul.sections.bestForDetail)
  pushSection(out, 'AVOID FOR',                                        soul.sections.avoidForDetail)
  pushSection(out, 'CORE IDENTITY INSTRUCTIONS',                       soul.sections.coreIdentity)

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ---------------------------------------------------------------------------
// OpenClaw `SOUL.md` adapter
// Format: plain markdown with sections # Persona / # Tone / # Core Instructions.
// Hard cap 12,000 chars; aim for ~200–500 words. No project-internal frontmatter.
// Reference: https://docs.openclaw.ai/concepts/system-prompt
// ---------------------------------------------------------------------------

export function toOpenClaw(soul) {
  const lines = []

  lines.push('# Persona')
  lines.push('')
  lines.push(`You are **${soul.archetype}**.${soul.think ? ` Think: ${soul.think}.` : ''}`)
  lines.push('')
  if (soul.sections.profile) {
    lines.push(flattenInline(soul.sections.profile))
    lines.push('')
  }

  // Tone — derived from the FIRST sentence or two of each Boon and Flaw bullet.
  // OpenClaw's "Tone" section wants short stylistic direction, not full prose.
  const toneLines = deriveToneLines(soul)
  if (toneLines.length) {
    lines.push('# Tone')
    lines.push('')
    for (const t of toneLines) lines.push(`- ${t}`)
    lines.push('')
  }

  lines.push('# Core Instructions')
  lines.push('')
  if (soul.sections.coreIdentity) {
    lines.push(flattenInline(soul.sections.coreIdentity))
    lines.push('')
  }

  // Bubble-up disclosure: characteristic ways the persona surfaces under
  // stress. This is the project's thesis — keep it near the directives.
  if (soul.sections.flaws) {
    lines.push('# Surfaces Under Stress')
    lines.push('')
    lines.push('These behaviors are characteristic of this persona, not defects to suppress:')
    lines.push('')
    lines.push(flattenInline(soul.sections.flaws))
    lines.push('')
  }

  lines.push('---')
  lines.push(`Source: ${soul.sourceUrl}`)
  lines.push('')

  let out = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'

  // Enforce OpenClaw's 12K char limit. If we exceed it, drop the
  // "Surfaces Under Stress" appendix first; if still over, truncate
  // Personality narrative. (None of the 15 starter souls should ever hit
  // this; this is defensive against future longer souls.)
  if (out.length > 12000) {
    out = lines
      .filter((l, i, arr) => {
        const idx = arr.indexOf('# Surfaces Under Stress')
        if (idx === -1) return true
        return i < idx
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  }

  return out
}

function deriveToneLines(soul) {
  const tone = []
  // Pull the bullet name + first sentence of each boon and flaw — these are
  // the most stylistic pieces of the persona prose.
  for (const block of [soul.sections.boons, soul.sections.flaws]) {
    if (!block) continue
    for (const line of block.split('\n')) {
      const m = line.match(/^-\s+\*\*([^*:]+):\*\*\s+([^.]+\.)/)
      if (m) tone.push(`${m[1].trim()}: ${flattenInline(m[2].trim())}`)
    }
  }
  return tone.slice(0, 8) // Cap to keep the section tight
}

// ---------------------------------------------------------------------------
// Claude Code `CLAUDE.md` adapter
// Format: free-form markdown, advisory, target ≤200 lines. Directive tone.
// Reference: https://code.claude.com/docs/en/best-practices
// ---------------------------------------------------------------------------

export function toClaudeMd(soul) {
  const lines = []

  lines.push(`# ${soul.archetype}`)
  lines.push('')
  if (soul.think) {
    lines.push(`*Think: ${soul.think}.*`)
    lines.push('')
  }

  // Brief identity paragraph — first ~3 sentences of profile, max
  if (soul.sections.profile) {
    let compressed = soul.sections.profile.split('. ').slice(0, 3).join('. ').trim()
    if (!compressed.endsWith('.')) compressed += '.'
    lines.push(flattenInline(compressed))
    lines.push('')
  }

  lines.push('## Operating Instructions')
  lines.push('')
  if (soul.sections.coreIdentity) {
    lines.push(flattenInline(soul.sections.coreIdentity))
    lines.push('')
  }

  if (soul.sections.bestForDetail) {
    lines.push('## Best Deployed For')
    lines.push('')
    lines.push(flattenInline(soul.sections.bestForDetail))
    lines.push('')
  }

  if (soul.sections.avoidForDetail) {
    lines.push('## Avoid For')
    lines.push('')
    lines.push(flattenInline(soul.sections.avoidForDetail))
    lines.push('')
  }

  // Score profile — small fingerprint so reviewers know the persona's shape
  if (soul.topAxes.length) {
    const top3 = soul.topAxes.slice(0, 3).map((a) => `${a.code} ${a.value}`).join(', ')
    const bot1 = soul.topAxes[soul.topAxes.length - 1]
    lines.push('## Score Profile')
    lines.push('')
    lines.push(`Spikes: ${top3}. Dip: ${bot1.code} ${bot1.value}.`)
    lines.push('')
  }

  lines.push('---')
  lines.push(`Source: ${soul.sourceUrl}`)
  lines.push('')

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// ---------------------------------------------------------------------------
// Anthropic Agent SDK — Python snippet adapter
// Reference: https://platform.claude.com/docs/en/agent-sdk/overview
// ---------------------------------------------------------------------------

export function toAgentSdkPython(soul) {
  const systemPrompt = toProsePrompt(soul).trim()
  const allowedTools = JSON.stringify(suggestAllowedTools(soul))

  return `"""
${soul.archetype} — Anthropic Agent SDK persona

This file ships a Claude agent pre-configured with this soul as its system
prompt. The system prompt itself (SYSTEM_PROMPT below) is the load-bearing
artifact — if your tooling differs, copy that string and discard this
boilerplate.

Setup:
    pip install claude-agent-sdk anyio
    export ANTHROPIC_API_KEY=...

Run:
    python soul-agent-sdk.py "your task here"

Soul source: ${soul.sourceUrl}
"""

import sys
import anyio
from claude_agent_sdk import query, ClaudeAgentOptions

# The soul as a system prompt. Copy this verbatim into any other tool that
# accepts a system-prompt string (Claude API \`system\`, OpenAI custom GPT,
# Anthropic console workbench, Cursor rules, etc).
SYSTEM_PROMPT = """${escapeForPyTripleQuote(systemPrompt)}"""

# Heuristic tools allowlist derived from this soul's \`best_for\` tags.
# Tighten this for your specific deployment — fewer tools is safer.
SUGGESTED_ALLOWED_TOOLS = ${allowedTools}


async def main(user_prompt: str) -> None:
    options = ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        allowed_tools=SUGGESTED_ALLOWED_TOOLS,
    )
    async for message in query(prompt=user_prompt, options=options):
        # Print whatever the agent emits. In a real deployment you'd route
        # tool-use messages to your tool runtime and assistant messages to
        # your UI layer. See the SDK docs for the full message schema.
        print(message)


if __name__ == "__main__":
    user_prompt = " ".join(sys.argv[1:]) or "Introduce yourself in two sentences."
    anyio.run(main, user_prompt)
`
}

// ---------------------------------------------------------------------------
// Anthropic Agent SDK — TypeScript snippet adapter
// ---------------------------------------------------------------------------

export function toAgentSdkTypeScript(soul) {
  const systemPrompt = toProsePrompt(soul).trim()
  const allowedTools = JSON.stringify(suggestAllowedTools(soul))

  return `/**
 * ${soul.archetype} — Anthropic Agent SDK persona
 *
 * This file ships a Claude agent pre-configured with this soul as its system
 * prompt. The SYSTEM_PROMPT constant is the load-bearing artifact — if your
 * tooling differs, copy that string and discard this boilerplate.
 *
 * Setup:
 *   npm install @anthropic-ai/claude-agent-sdk
 *   export ANTHROPIC_API_KEY=...
 *
 * Run:
 *   npx tsx soul-agent-sdk.ts "your task here"
 *
 * Soul source: ${soul.sourceUrl}
 */

import { query } from '@anthropic-ai/claude-agent-sdk'

// The soul as a system prompt. Copy verbatim into any other tool that
// accepts a system-prompt string.
const SYSTEM_PROMPT = \`${escapeForTsTemplateLiteral(systemPrompt)}\`

// Heuristic tools allowlist derived from this soul's \`best_for\` tags.
// Tighten for your specific deployment — fewer tools is safer.
const SUGGESTED_ALLOWED_TOOLS = ${allowedTools}

async function main(userPrompt: string): Promise<void> {
  for await (const message of query({
    prompt: userPrompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: SUGGESTED_ALLOWED_TOOLS
    }
  })) {
    // Route tool-use messages to your tool runtime and assistant messages
    // to your UI layer. See SDK docs for the full message schema.
    console.log(message)
  }
}

const userPrompt = process.argv.slice(2).join(' ') || 'Introduce yourself in two sentences.'
main(userPrompt).catch((err) => {
  console.error(err)
  process.exit(1)
})
`
}

// ---------------------------------------------------------------------------
// Heuristic tool-allowlist suggestion based on soul's best_for tags.
// Conservative defaults; deployers should narrow further for their use case.
// ---------------------------------------------------------------------------

function suggestAllowedTools(soul) {
  const tags = new Set(soul.best_for.map((t) => t.toLowerCase()))
  const tools = new Set()

  // Read is universal — every persona benefits from being able to read context
  tools.add('Read')
  tools.add('Grep')
  tools.add('Glob')

  const has = (...needles) => needles.some((n) => [...tags].some((t) => t.includes(n)))

  if (has('refactor', 'prune', 'declutter', 'cleanup', 'lint', 'edit')) {
    tools.add('Edit')
    tools.add('Bash')
  }
  if (has('audit', 'security', 'review', 'forensics', 'incident', 'sre', 'ops', 'runbook')) {
    tools.add('Bash')
  }
  if (has('research', 'documentation', 'fact-checking', 'citation', 'knowledge')) {
    tools.add('WebFetch')
  }
  if (has('orchestrat', 'coordin', 'multi-team')) {
    tools.add('WebFetch')
  }

  return [...tools].sort()
}

// ---------------------------------------------------------------------------
// Helpers (also used by the orchestrator)
// ---------------------------------------------------------------------------

export function extractSection(body, heading) {
  const safeHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startRe = new RegExp(`^##\\s+${safeHeading}\\s*\\n`, 'm')
  const startMatch = body.match(startRe)
  if (!startMatch) return ''
  const start = startMatch.index + startMatch[0].length
  const rest = body.slice(start)
  const nextH2 = rest.match(/^## /m)
  const end = nextH2 ? start + nextH2.index : body.length
  return body.slice(start, end).trim()
}

export function getThinkLine(body) {
  const m = body.match(/^\*\*Think:\*\*\s+([^\n]+)/m)
  return m ? m[1].trim().replace(/\.$/, '') : ''
}

export function flattenInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<![*])\*([^*]+)\*(?![*])/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

function pushSection(out, heading, content) {
  if (!content) return
  out.push(heading)
  out.push(flattenInline(content))
  out.push('')
}

function escapeForPyTripleQuote(s) {
  // Escape any literal triple-quote in content; Python source can't contain
  // an unescaped """ inside a """-delimited string.
  return s.replace(/"""/g, '\\"\\"\\"')
}

function escapeForTsTemplateLiteral(s) {
  // Escape backslash, backtick, and ${ } template placeholders.
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}
