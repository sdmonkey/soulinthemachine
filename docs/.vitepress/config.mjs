import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOULS_DIR = path.resolve(__dirname, '..', 'souls')

function readSouls() {
  return fs
    .readdirSync(SOULS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .map((f) => {
      const raw = fs.readFileSync(path.join(SOULS_DIR, f), 'utf-8')
      const { data: fm } = matter(raw)
      return {
        slug: fm.slug || f.replace(/\.md$/, ''),
        archetype: fm.archetype || f,
        inspired_by: fm.inspired_by || '',
        starter_order: typeof fm.starter_order === 'number' ? fm.starter_order : null
      }
    })
    .sort((a, b) => {
      // Curated starters (with starter_order) come first, in numeric order.
      // Non-starters follow, alphabetical by archetype.
      const aStarter = a.starter_order
      const bStarter = b.starter_order
      if (aStarter !== null && bStarter !== null) return aStarter - bStarter
      if (aStarter !== null) return -1
      if (bStarter !== null) return 1
      return a.archetype.localeCompare(b.archetype)
    })
}

function buildSoulsSidebar() {
  const souls = readSouls()
  return [
    { text: 'Gallery', link: '/souls/' },
    ...souls.map((s) => ({
      // The \n + "Think: …" survives Vue interpolation; CSS uses
      // `white-space: pre-line` + `::first-line` to style the two lines differently.
      text: s.inspired_by
        ? `${s.archetype}\nThink: ${s.inspired_by.replace(/\s*\([^)]+\)$/, '')}`
        : s.archetype,
      link: `/souls/${s.slug}`
    }))
  ]
}

export default defineConfig({
  title: 'SoulInTheMachine',
  description: 'A registry of agent personality profiles for AI automation roles.',
  cleanUrls: true,
  appearance: 'dark',

  // Don't treat the generated export bundles in /public/exports/ as VitePress pages.
  srcExclude: ['public/**'],

  // Base path for the site. Defaults to '/'.
  //
  //   • User/org page (username.github.io) or custom domain → leave VITEPRESS_BASE unset.
  //   • Project page (username.github.io/<repo>/) → set VITEPRESS_BASE=/<repo>/ in your
  //     deploy environment. The workflow at .github/workflows/deploy.yml does this for you.
  //
  // For local development just run `npm run docs:dev` — base stays '/'.
  base: process.env.VITEPRESS_BASE || '/',

  themeConfig: {
    nav: [
      { text: 'Souls', link: '/souls/' },
      { text: 'Weave', link: '/weave' },
      { text: 'Schema', link: '/radar-schema' },
      { text: 'Author', link: '/soul-authoring-guide' },
      { text: 'Friction', link: '/machine-soul-friction' }
    ],

    sidebar: [
      {
        text: 'Foundation',
        items: [
          { text: '10-Axis Radar', link: '/radar-schema' },
          { text: 'Authoring Guide', link: '/soul-authoring-guide' },
          { text: 'Machine-Soul Friction', link: '/machine-soul-friction' },
          { text: 'Soul Weaver', link: '/weave' },
          { text: 'Honesty about Claims', link: '/honesty' }
        ]
      },
      {
        text: 'Souls',
        items: buildSoulsSidebar()
      }
    ],

    outline: { level: [2, 3] },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sdmonkey/soulinthemachine' }
    ]
  }
})
