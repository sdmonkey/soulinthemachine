#!/usr/bin/env node
// Generates per-soul export artifacts into docs/public/exports/<slug>/
//   - soul.md           — curated artifact, VitePress tags stripped
//   - soul-prompt.txt   — prose-flattened system prompt
//   - soul.json         — frontmatter only
//
// Run before vitepress dev/build so the SoulExport component has files to link to.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOULS_DIR = path.join(ROOT, 'docs', 'souls')
const EXPORTS_DIR = path.join(ROOT, 'docs', 'public', 'exports')

function listSoulFiles() {
  return fs
    .readdirSync(SOULS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
}

function stripVitePressTags(body) {
  // Remove <SoulRadar />, <SoulExport />, and any other Vue tags we inject.
  return body
    .replace(/^[ \t]*<SoulRadar\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulExport\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}

function reconstructMarkdown(frontmatterRaw, body) {
  return `---\n${frontmatterRaw.trim()}\n---\n\n${stripVitePressTags(body)}`
}

function flattenInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<![*])\*([^*]+)\*(?![*])/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

function extractSection(body, heading) {
  // Match `## Heading` to next `## ` or end-of-string.
  const re = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\Z)`, 'm')
  const m = body.match(re)
  return m ? m[1].trim() : ''
}

function getThinkLine(body) {
  const m = body.match(/^\*\*Think:\*\*\s+([^\n]+)/m)
  return m ? m[1].trim().replace(/\.$/, '') : ''
}

function buildPrompt(fm, body) {
  const archetype = fm.archetype || 'this persona'
  const think = getThinkLine(body)
  const sections = {
    profile:    extractSection(body, 'Personality Profile'),
    boons:      extractSection(body, 'Boons & Perks'),
    flaws:      extractSection(body, 'Flaws & Quirks'),
    forecast:   extractSection(body, 'Behavioral Forecast'),
    bestFor:    extractSection(body, 'Best For'),
    avoidFor:   extractSection(body, 'Avoid For'),
    coreId:     extractSection(body, 'Core Identity Instructions')
  }

  const out = []
  out.push(`SYSTEM PROMPT — ${archetype}`)
  if (think) out.push(`Think: ${think}.`)
  out.push('')
  out.push('You are ' + archetype + '. The sections below describe who you are, what')
  out.push('you do well, the flaws you should let surface, and the directives that')
  out.push('govern your behavior. Treat the Core Identity Instructions as binding.')
  out.push('')

  if (sections.profile) {
    out.push('PERSONALITY')
    out.push(flattenInline(sections.profile))
    out.push('')
  }

  if (sections.boons) {
    out.push('STRENGTHS — use these to do the work well')
    out.push(flattenInline(sections.boons))
    out.push('')
  }

  if (sections.flaws) {
    out.push('FLAWS — let these bubble up, especially under stress')
    out.push(flattenInline(sections.flaws))
    out.push('')
  }

  if (sections.forecast) {
    out.push('BEHAVIORAL FORECAST')
    out.push(flattenInline(sections.forecast))
    out.push('')
  }

  if (sections.bestFor) {
    out.push('BEST DEPLOYED FOR')
    out.push(flattenInline(sections.bestFor))
    out.push('')
  }

  if (sections.avoidFor) {
    out.push('AVOID FOR')
    out.push(flattenInline(sections.avoidFor))
    out.push('')
  }

  if (sections.coreId) {
    out.push('CORE IDENTITY INSTRUCTIONS')
    out.push(flattenInline(sections.coreId))
    out.push('')
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function generateForFile(filename) {
  const fullPath = path.join(SOULS_DIR, filename)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data: fm, content: body, matter: rawFrontmatter } = matter(raw)

  const slug = fm.slug || filename.replace(/\.md$/, '')
  const outDir = path.join(EXPORTS_DIR, slug)
  ensureDir(outDir)

  // soul.md — reconstruct without VitePress tags
  fs.writeFileSync(
    path.join(outDir, 'soul.md'),
    reconstructMarkdown(rawFrontmatter, body)
  )

  // soul-prompt.txt — flattened system prompt
  fs.writeFileSync(
    path.join(outDir, 'soul-prompt.txt'),
    buildPrompt(fm, body)
  )

  // soul.json — frontmatter only
  fs.writeFileSync(
    path.join(outDir, 'soul.json'),
    JSON.stringify(fm, null, 2) + '\n'
  )

  return slug
}

function main() {
  // Clean prior exports — keeps the dir in sync with current souls.
  fs.rmSync(EXPORTS_DIR, { recursive: true, force: true })
  ensureDir(EXPORTS_DIR)

  const files = listSoulFiles()
  const generated = files.map(generateForFile)

  // Index file so the export root is browsable / curlable.
  const index = {
    generated_at: new Date().toISOString(),
    souls: generated.map((slug) => ({
      slug,
      files: ['soul.md', 'soul-prompt.txt', 'soul.json'].map((f) => `/exports/${slug}/${f}`)
    }))
  }
  fs.writeFileSync(
    path.join(EXPORTS_DIR, 'index.json'),
    JSON.stringify(index, null, 2) + '\n'
  )

  console.log(`Generated exports for ${generated.length} souls in ${path.relative(ROOT, EXPORTS_DIR)}`)
}

main()
