#!/usr/bin/env node
// Validates every soul .md file in docs/souls/ against the authoring rules
// codified in docs/soul-authoring-guide.md (the "Scoring Discipline" section
// and the canonical template — frontmatter fields + body sections).
//
// Exits 0 if all souls pass, 1 if any fail. Prints a per-soul report with
// specific errors so failures are actionable.
//
// Run via: `npm run validate` or `node scripts/validate-souls.mjs`.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOULS_DIR = path.join(ROOT, 'docs', 'souls')

const AXIS_CODES = ['BLD', 'REF', 'AUD', 'DOC', 'CSR', 'NEG', 'VOX', 'OPS', 'GOV', 'ETH']

const REQUIRED_FRONTMATTER = [
  'archetype',
  'slug',
  'version',
  'inspired_by',
  'tags',
  'radar',
  'best_for',
  'avoid_for'
]

const REQUIRED_SECTIONS = [
  'Personality Profile',
  'Boons & Perks',
  'Flaws & Quirks',
  'Behavioral Forecast',
  'Best For',
  'Avoid For',
  'Runtime Caveats',
  'Core Identity Instructions'
]

// Scoring Discipline thresholds, from the Authoring Guide
const MIN_BOONS = 3
const MIN_FLAWS = 3
const MIN_LOW_AXES  = 1   // at least one axis ≤ 3 — the dip names the trade-off
const MIN_HIGH_AXES = 1   // at least one axis ≥ 7 — the spike names the strength
const MAX_HIGH_AXES = 4   // no more than four axes ≥ 7 — keeps the persona shaped

function listSoulFiles() {
  return fs
    .readdirSync(SOULS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validateFrontmatter(fm, filename) {
  const errors = []
  const expectedSlug = filename.replace(/\.md$/, '')

  for (const field of REQUIRED_FRONTMATTER) {
    const v = fm[field]
    if (v === undefined || v === null || v === '') {
      errors.push(`Missing frontmatter field: ${field}`)
    }
  }

  if (fm.slug && fm.slug !== expectedSlug) {
    errors.push(`slug "${fm.slug}" does not match filename (expected "${expectedSlug}")`)
  }

  if (fm.archetype && !/^The /.test(fm.archetype)) {
    errors.push(`archetype "${fm.archetype}" should begin with "The " (per naming convention)`)
  }

  if (fm.tags !== undefined && !Array.isArray(fm.tags)) {
    errors.push(`tags must be an array`)
  }

  if (fm.best_for !== undefined && !Array.isArray(fm.best_for)) {
    errors.push(`best_for must be an array`)
  }

  if (fm.avoid_for !== undefined && !Array.isArray(fm.avoid_for)) {
    errors.push(`avoid_for must be an array`)
  }

  if (fm.starter_order !== undefined && !Number.isInteger(fm.starter_order)) {
    errors.push(`starter_order must be an integer when present`)
  }

  return errors
}

function validateRadar(radar) {
  const errors = []

  if (!radar || typeof radar !== 'object') {
    return ['radar block missing or not an object']
  }

  // All ten axes present, integer 1–10
  for (const code of AXIS_CODES) {
    const v = radar[code]
    if (v === undefined) {
      errors.push(`radar.${code}: missing`)
    } else if (!Number.isInteger(v) || v < 1 || v > 10) {
      errors.push(`radar.${code}: must be integer 1–10, got ${JSON.stringify(v)}`)
    }
  }

  // Reject extra keys to catch typos like "ADU" or "OP"
  const extras = Object.keys(radar).filter((k) => !AXIS_CODES.includes(k))
  if (extras.length) {
    errors.push(`radar has unrecognized axis codes: ${extras.join(', ')}`)
  }

  // Scoring Discipline rules — only check if all values are valid integers in range
  const validScores = AXIS_CODES
    .map((c) => radar[c])
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 10)

  if (validScores.length === AXIS_CODES.length) {
    const lows = validScores.filter((v) => v <= 3).length
    const highs = validScores.filter((v) => v >= 7).length

    if (lows < MIN_LOW_AXES) {
      errors.push(
        `Scoring discipline: at least ${MIN_LOW_AXES} axis must be ≤ 3 (the dip is what makes the soul useful) — currently 0`
      )
    }
    if (highs < MIN_HIGH_AXES) {
      errors.push(
        `Scoring discipline: at least ${MIN_HIGH_AXES} axis must be ≥ 7 (the spike is what you hire the soul for) — currently 0`
      )
    }
    if (highs > MAX_HIGH_AXES) {
      errors.push(
        `Scoring discipline: no more than ${MAX_HIGH_AXES} axes may be ≥ 7 (a soul strong everywhere is uncalibrated) — currently ${highs}`
      )
    }
  }

  return errors
}

function findSection(body, heading) {
  // Locate the heading, then take everything up to the next ## heading or EOF.
  // Manual slicing is more reliable than relying on \Z (not a JS regex feature).
  const startRe = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*\\n`, 'm')
  const startMatch = body.match(startRe)
  if (!startMatch) return null
  const start = startMatch.index + startMatch[0].length
  const rest = body.slice(start)
  const nextH2 = rest.match(/^## /m)
  const end = nextH2 ? start + nextH2.index : body.length
  return body.slice(start, end)
}

function validateSections(body) {
  const errors = []
  for (const section of REQUIRED_SECTIONS) {
    if (findSection(body, section) === null) {
      errors.push(`Missing section: ## ${section}`)
    }
  }
  return errors
}

function countNamedBullets(sectionContent) {
  if (!sectionContent) return 0
  // Count lines like:  - **Name:** description
  return (sectionContent.match(/^-\s+\*\*[^*\n]+:\*\*/gm) || []).length
}

function validateBoonsAndFlaws(body) {
  const errors = []
  const boons = countNamedBullets(findSection(body, 'Boons & Perks'))
  const flaws = countNamedBullets(findSection(body, 'Flaws & Quirks'))
  if (boons < MIN_BOONS) {
    errors.push(
      `Boons & Perks: at least ${MIN_BOONS} named bullets required (found ${boons}). Format: "- **Name:** description"`
    )
  }
  if (flaws < MIN_FLAWS) {
    errors.push(
      `Flaws & Quirks: at least ${MIN_FLAWS} named bullets required (found ${flaws}). Format: "- **Name:** description"`
    )
  }
  return errors
}

function validateThinkLine(body) {
  const errors = []
  if (!/^\*\*Think:\*\*\s+\S+/m.test(body)) {
    errors.push(`Missing "**Think:** ..." line near the top of the body`)
  }
  return errors
}

function validateOne(filename) {
  const fullPath = path.join(SOULS_DIR, filename)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data: fm, content: body } = matter(raw)

  const errors = []
  errors.push(...validateFrontmatter(fm, filename))
  errors.push(...validateRadar(fm.radar))
  errors.push(...validateSections(body))
  errors.push(...validateBoonsAndFlaws(body))
  errors.push(...validateThinkLine(body))

  return { filename, archetype: fm.archetype || filename, errors }
}

function main() {
  const files = listSoulFiles()
  if (files.length === 0) {
    console.error(`No soul files found in ${path.relative(ROOT, SOULS_DIR)}`)
    process.exit(1)
  }

  const results = files.map(validateOne)

  for (const r of results) {
    if (r.errors.length === 0) {
      console.log(`  \x1b[32m✓\x1b[0m ${r.filename}  \x1b[2m${r.archetype}\x1b[0m`)
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${r.filename}  \x1b[2m${r.archetype}\x1b[0m`)
      for (const err of r.errors) {
        console.log(`      \x1b[31m·\x1b[0m ${err}`)
      }
    }
  }

  const failed = results.filter((r) => r.errors.length > 0)
  console.log()
  console.log(`  ${results.length - failed.length}/${results.length} souls valid`)

  if (failed.length > 0) {
    console.error(`\n  \x1b[31mValidation failed: ${failed.length} soul(s) with errors\x1b[0m`)
    process.exit(1)
  }
}

main()
