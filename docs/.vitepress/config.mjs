import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOULS_DIR = path.resolve(__dirname, '..', 'souls')

// SEO / share-preview constants. The hostname is the deploy origin; combined
// with the configured `base` (set via VITEPRESS_BASE in CI) it produces the
// canonical URLs we put in og:url and the sitemap.
const SITE_HOSTNAME = 'https://sdmonkey.github.io'
const SITE_TITLE = 'SoulInTheMachine'
const SITE_DESCRIPTION =
  'A registry of agent personality profiles for AI automation roles. Predictable unpredictability via designed dispositions, scored on 10 axes, with friction disclosure. Export options for your favorite agent frameworks or tools like OpenClaw, Anthropic, Claude Code, and AutoGen.'
const OG_IMAGE_PATH = '/og-default.svg'

// Cache for soul metadata read off disk during the build. Avoids re-parsing
// each soul .md every time transformPageData fires for that page.
const soulMetaCache = {}
function getSoulMeta(slug) {
  if (slug in soulMetaCache) return soulMetaCache[slug]
  try {
    const filePath = path.join(SOULS_DIR, `${slug}.md`)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const thinkMatch = content.match(/^\*\*Think:\*\*\s+(.+?)\.?\s*$/m)
    soulMetaCache[slug] = {
      archetype: data.archetype || '',
      think: thinkMatch ? thinkMatch[1].trim() : '',
      inspired_by: (data.inspired_by || '').replace(/\s*\([^)]+\)$/, '')
    }
  } catch {
    soulMetaCache[slug] = null
  }
  return soulMetaCache[slug]
}

// Build the canonical URL for a page from its relative path.
// e.g. "souls/the-bitter-mentor.md" → "https://.../souls/the-bitter-mentor"
function canonicalUrl(relativePath, base) {
  let p = relativePath.replace(/\.md$/, '')
  if (p === 'index') p = ''
  else if (p.endsWith('/index')) p = p.slice(0, -5)
  return `${SITE_HOSTNAME}${base}${p}`
}

// Resolve title + description for a page. Souls auto-derive from frontmatter
// + the Think line so we don't need to hand-write description fields for 15
// soul files. Other pages should set `description:` in their frontmatter.
function resolvePageMeta(pageData) {
  const fm = pageData.frontmatter || {}
  const isSoul = pageData.relativePath?.startsWith('souls/the-')

  if (isSoul) {
    const slug = pageData.relativePath.replace(/\.md$/, '').split('/').pop()
    const meta = getSoulMeta(slug)
    if (meta) {
      const title = `${meta.archetype} — ${SITE_TITLE}`
      const desc = meta.think
        ? `Think: ${meta.think}. An agent persona profile inspired by ${meta.inspired_by} — part of the ${SITE_TITLE} registry.`
        : `${meta.archetype} — an agent persona profile in the ${SITE_TITLE} registry.`
      return { title, description: desc }
    }
  }

  const pageTitle = fm.title || pageData.title
  const title = pageTitle ? `${pageTitle} — ${SITE_TITLE}` : SITE_TITLE
  const description = fm.description || fm.tagline || SITE_DESCRIPTION
  return { title, description }
}

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
  title: SITE_TITLE,
  // Top-level `description:` intentionally omitted — VitePress auto-injects
  // a <meta name="description"> from it, and that injection wins de-duplication
  // over per-page descriptions added via transformPageData. By omitting it
  // here, our per-page descriptions are the only ones rendered.
  cleanUrls: true,
  appearance: 'dark',
  lang: 'en-US',

  // Don't treat the generated export bundles in /public/exports/ as VitePress pages.
  srcExclude: ['public/**'],

  // Site-wide <head> tags. Per-page OG/Twitter/canonical are added by
  // transformPageData below.
  head: [
    ['meta', { name: 'theme-color', content: '#14b8a6' }],
    ['meta', { name: 'application-name', content: SITE_TITLE }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],

    // Atkinson Hyperlegible — applied via CSS to the hero wordmark + nav title
    // only (not body), where the lowercase-l / uppercase-I collision in
    // "SoulInTheMachine" is most visible. Body stays on Inter (VitePress's
    // bundled default). preconnect saves a round-trip; font-display: swap
    // keeps text legible during the brief load window.
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap' }]
  ],

  // Auto-generated sitemap.xml at the deployed root, used by search engines.
  // sitemap-ts (the underlying lib) parses hostname through URL() which strips
  // any path, so we have to prepend the base on each item via transformItems.
  sitemap: {
    hostname: SITE_HOSTNAME,
    transformItems: (items) => {
      const base = (process.env.VITEPRESS_BASE || '/').replace(/\/$/, '')
      if (!base) return items
      return items.map((item) => ({
        ...item,
        url: `${base}${item.url.startsWith('/') ? item.url : '/' + item.url}`
      }))
    }
  },

  // Per-page meta-tag injection (OG, Twitter Card, description, canonical).
  // Souls auto-derive their description from the Think line; other pages
  // should set `description:` in frontmatter.
  transformPageData(pageData) {
    const base = process.env.VITEPRESS_BASE || '/'
    const { title, description } = resolvePageMeta(pageData)
    const url = canonicalUrl(pageData.relativePath, base)
    const ogImage = `${SITE_HOSTNAME}${base.replace(/\/$/, '')}${OG_IMAGE_PATH}`

    // Setting `pageData.description` makes VitePress use it for the auto-injected
    // <meta name="description"> — pushing one via head[] would lose to VitePress's
    // own auto-injection during head deduplication.
    pageData.description = description

    pageData.frontmatter ??= {}
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel:  'canonical',            href:    url }],
      ['meta', { property: 'og:title',         content: title }],
      ['meta', { property: 'og:description',   content: description }],
      ['meta', { property: 'og:url',           content: url }],
      ['meta', { property: 'og:image',         content: ogImage }],
      ['meta', { property: 'og:type',          content: pageData.relativePath?.startsWith('souls/the-') ? 'article' : 'website' }],
      ['meta', { name: 'twitter:card',         content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title',        content: title }],
      ['meta', { name: 'twitter:description',  content: description }],
      ['meta', { name: 'twitter:image',        content: ogImage }]
    )
  },

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
