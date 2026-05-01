#!/usr/bin/env node
// Generates per-soul export artifacts into docs/public/exports/<slug>/
//
// Per soul, seven files:
//   Generic:
//     - soul.md            — curated artifact, VitePress tags stripped
//     - soul-prompt.txt    — prose-flattened system prompt
//     - soul.json          — frontmatter only
//   Drop-in for tools:
//     - soul-openclaw.md   — OpenClaw bootstrap SOUL.md
//     - soul-claude.md     — Claude Code CLAUDE.md
//     - soul-agent-sdk.py  — Anthropic Agent SDK (Python)
//     - soul-agent-sdk.ts  — Anthropic Agent SDK (TypeScript)
//
// Run before vitepress dev/build so the SoulExport component has files to
// link to. Adapters live in scripts/lib/export-adapters.mjs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

import {
  buildSoulModel,
  toProsePrompt,
  toOpenClaw,
  toClaudeMd,
  toAgentSdkPython,
  toAgentSdkTypeScript
} from './lib/export-adapters.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOULS_DIR = path.join(ROOT, 'docs', 'souls')
const EXPORTS_DIR = path.join(ROOT, 'docs', 'public', 'exports')

// All seven export filenames, declared once and used for both the file
// writes and the public index.json so they stay in sync.
const EXPORT_FILES = [
  'soul.md',
  'soul-prompt.txt',
  'soul.json',
  'soul-openclaw.md',
  'soul-claude.md',
  'soul-agent-sdk.py',
  'soul-agent-sdk.ts'
]

function listSoulFiles() {
  return fs
    .readdirSync(SOULS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
}

function stripVitePressTags(body) {
  // Remove any custom Vue components we inject into soul markdown — these
  // shouldn't appear in shipped artifacts.
  return body
    .replace(/^[ \t]*<SoulRadar\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulQuickExport\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulIntegrations\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/^[ \t]*<SoulExport\b[^>]*\/>[ \t]*\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}

function reconstructMarkdown(frontmatterRaw, body) {
  return `---\n${frontmatterRaw.trim()}\n---\n\n${stripVitePressTags(body)}`
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

  const soul = buildSoulModel(fm, body)

  // Generic exports
  fs.writeFileSync(path.join(outDir, 'soul.md'),         reconstructMarkdown(rawFrontmatter, body))
  fs.writeFileSync(path.join(outDir, 'soul-prompt.txt'), toProsePrompt(soul))
  fs.writeFileSync(path.join(outDir, 'soul.json'),       JSON.stringify(fm, null, 2) + '\n')

  // Drop-in for tools
  fs.writeFileSync(path.join(outDir, 'soul-openclaw.md'),   toOpenClaw(soul))
  fs.writeFileSync(path.join(outDir, 'soul-claude.md'),     toClaudeMd(soul))
  fs.writeFileSync(path.join(outDir, 'soul-agent-sdk.py'),  toAgentSdkPython(soul))
  fs.writeFileSync(path.join(outDir, 'soul-agent-sdk.ts'),  toAgentSdkTypeScript(soul))

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
      files: EXPORT_FILES.map((f) => `/exports/${slug}/${f}`)
    }))
  }
  fs.writeFileSync(
    path.join(EXPORTS_DIR, 'index.json'),
    JSON.stringify(index, null, 2) + '\n'
  )

  console.log(
    `Generated ${EXPORT_FILES.length} export files for ${generated.length} souls in ${path.relative(ROOT, EXPORTS_DIR)}`
  )
}

main()
