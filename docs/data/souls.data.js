// VitePress build-time data loader. Reads every soul markdown file in
// docs/souls/, parses frontmatter + a few body sections, and exposes the
// resulting array as the default `data` import for components.
//
// Files ending in `.data.js` are auto-detected by VitePress; the `watch`
// glob enables HMR when soul files change in dev.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOULS_DIR = path.resolve(__dirname, '..', 'souls')

function extractSection(body, heading) {
  const safeHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^##\\s+${safeHeading}\\s*\\n([\\s\\S]+?)(?=\\n^##\\s|\\n*$)`, 'm')
  const m = body.match(re)
  return m ? m[1].trim() : ''
}

function firstParagraph(text) {
  const para = text.split(/\n\s*\n/)[0] || ''
  return para.replace(/\s+/g, ' ').trim()
}

function loadSouls() {
  return fs
    .readdirSync(SOULS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .map((f) => {
      const raw = fs.readFileSync(path.join(SOULS_DIR, f), 'utf-8')
      const { data: fm, content: body } = matter(raw)

      const thinkMatch = body.match(/^\*\*Think:\*\*\s+(.+?)\.?\s*$/m)
      const think = thinkMatch ? thinkMatch[1].trim() : ''

      const profile = extractSection(body, 'Personality Profile')
      const blurb = firstParagraph(profile)

      return {
        slug: fm.slug || f.replace(/\.md$/, ''),
        archetype: fm.archetype || '',
        inspired_by: fm.inspired_by || '',
        starter_order: typeof fm.starter_order === 'number' ? fm.starter_order : null,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        radar: fm.radar && typeof fm.radar === 'object' ? fm.radar : {},
        best_for: Array.isArray(fm.best_for) ? fm.best_for : [],
        avoid_for: Array.isArray(fm.avoid_for) ? fm.avoid_for : [],
        think,
        blurb
      }
    })
    .sort((a, b) => {
      // Default order matches sidebar: starters first by starter_order, then alpha.
      if (a.starter_order != null && b.starter_order != null) return a.starter_order - b.starter_order
      if (a.starter_order != null) return -1
      if (b.starter_order != null) return 1
      return a.archetype.localeCompare(b.archetype)
    })
}

export default {
  watch: ['../souls/*.md'],
  load() {
    return loadSouls()
  }
}
