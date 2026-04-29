# SoulInTheMachine

A registry of agent personality profiles for AI automation roles. Built on the thesis that **predictable unpredictability** matters: a soul's flaws bubble up under stress, and that's the feature, not the bug. A "Paranoid Auditor" finds more real bugs than a "Helpful" one — we let you deploy with the trade.

**Live site:** [`https://sdmonkey.github.io/soulinthemachine/`](https://sdmonkey.github.io/soulinthemachine/)

## What's here

- **15 starter souls** — full profiles, radar scores, behavioral forecasts, runtime caveats, and copy-pasteable system prompts. Browse them at [`docs/souls/`](docs/souls/) or via the [Gallery](https://sdmonkey.github.io/soulinthemachine/souls/) on the live site.
- **10-axis functional radar schema** mapping psychological traits to operational dispositions, grouped Build / Verify / Communicate / Operate. ([`docs/radar-schema.md`](docs/radar-schema.md))
- **Machine-Soul Friction framework** — seven categories disclosing where each soul's design intent collides with the substrate (helpfulness pull, memory boundary, no background reflection, voice sanitization, tool dependency, context window limit, persona re-grounding). ([`docs/machine-soul-friction.md`](docs/machine-soul-friction.md))
- **Soul Weaver** — interactive form-based authoring tool with live radar preview, real-time validation, and an AI round-trip flow (describe → copy prompt → paste response → autofill). ([`docs/weave.md`](docs/weave.md))
- **Three export formats per soul** — full markdown artifact, prose-flattened system prompt, JSON for programmatic use. Generated at build time into `docs/public/exports/<slug>/` and downloadable from each soul page.
- **Interactive gallery** with text search, use-case filter, score thresholds, sort by axis, and per-card mini-radars.
- **Honesty about Claims** — explicit disclosure of which claims are research-supported vs. observational vs. design opinion vs. subjective interpretation. ([`docs/honesty.md`](docs/honesty.md))

## Quick start

```bash
npm install
npm run docs:dev          # http://localhost:5173
```

## Adding a soul

Three paths, in order of decreasing convenience:

**1. Soul Weaver with AI assistance** *(easiest)*. Open [`/weave/`](https://sdmonkey.github.io/soulinthemachine/weave) on the live site. Expand "Generate with AI assistance," describe the soul you want in a sentence or two, click **Copy AI prompt**, paste into Claude / ChatGPT / Gemini, paste the response back, and click **Autofill from response**. Review and tune in the form (the radar updates live), then **Download** the soul.md.

**2. Soul Weaver from scratch**. Same form, fill in fields manually. The form validates as you go — required fields, scoring discipline, minimum boon/flaw counts.

**3. Hand-author a markdown file**:

1. Read the [Authoring Guide](docs/soul-authoring-guide.md) — especially the *How to write a flaw that bubbles up* and *Scoring discipline* sections.
2. Copy the template from §2 of that guide.
3. Save as `docs/souls/<slug>.md` (kebab-case archetype name, e.g. `the-bitter-mentor.md`).
4. Fill in frontmatter and body sections. If it should appear in the curated starter set, add `starter_order: <N>`.
5. Run the validator:
   ```bash
   npm run validate
   ```
   It checks frontmatter completeness, all 10 axes scored as integers 1–10, the scoring discipline rules (≥1 axis ≤ 3, ≥1 axis ≥ 7, ≤4 axes ≥ 7), required body sections, and minimum boon/flaw counts.
6. Preview locally with `npm run docs:dev`, then open a PR. CI runs the validator on every push.

## Project layout

```
docs/
  souls/                   — one .md file per soul (the registry, currently 15)
  data/
    souls.data.js          — VitePress build-time data loader (powers the gallery + sidebar)
  .vitepress/
    config.mjs             — site config, auto-generated sidebar, env-driven base path
    theme/
      components/          — SoulRadar, AxisGlyph, SoulGallery, SoulWeaver,
                             SoulExport, SoulQuickExport, HomeRadarShowcase
      lib/
        soul-parser.js     — client-side soul.md parser (used by Weaver autofill)
        soul-prompt.js     — LLM prompt template (used by Weaver AI round-trip)
      custom.css           — terminal-leaning theme overrides + group color variables
  index.md                 — home page
  weave.md                 — Soul Weaver page (form + live radar + AI round-trip)
  radar-schema.md          — the 10-axis rubric with calibration anchors + AxisGlyph illustrations
  soul-authoring-guide.md  — template, naming convention, scoring discipline, flaw-writing rules
  machine-soul-friction.md — the seven-category friction framework and per-soul caveat format
  honesty.md               — what's research-supported vs. observational vs. opinion
  souls/index.md           — gallery page (uses the SoulGallery component)
scripts/
  generate-exports.mjs     — pre-build: writes per-soul exports to docs/public/exports/
  validate-souls.mjs       — schema + scoring discipline + section validation for all souls
.github/workflows/
  deploy.yml               — validate → build → deploy to GitHub Pages on push to main
```

## Scripts

| Command | What it does |
|---|---|
| `npm run docs:dev` | Local dev server with HMR |
| `npm run docs:build` | Production build (validates + generates exports + VitePress build) |
| `npm run docs:preview` | Serve the production build locally |
| `npm run validate` | Run soul validator only |
| `npm test` | Alias for `validate` |
| `npm run prepare-exports` | Manually regenerate the export bundles |

## Scoring discipline (the §5 rules)

Four rules, all enforced by the validator:

1. **Every soul has at least one score ≤ 3** — the dip names the trade-off.
2. **Every soul has at least one score ≥ 7** — the spike names the strength.
3. **No soul scores ≥ 7 on more than four axes** — strong everywhere is uncalibrated.
4. **All scores are integers 1–10**.

The first two are symmetric on purpose: every soul has both a characteristic strength *and* a characteristic trade-off. That's the project's thesis at the rule level.

## Deploying to GitHub Pages

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys on every push to `main`.

**One-time setup** in the repo settings:
- *Settings → Pages → Source* = `GitHub Actions`

**Base path** is controlled by the `VITEPRESS_BASE` env var in the workflow. This repo deploys to `https://sdmonkey.github.io/soulinthemachine/`, so it's set to `/soulinthemachine/`. If you fork to a different repo name, update that env var to match.

Local development always uses `/`; the env var only kicks in during CI builds.

## Stack

- [VitePress 1.x](https://vitepress.dev/) for the static site framework
- Vue 3 for the interactive components
- [`gray-matter`](https://github.com/jonschlinkert/gray-matter) for frontmatter parsing in build scripts and the data loader
- A small, dependency-free client-side parser for the Weaver's autofill flows ([`soul-parser.js`](docs/.vitepress/theme/lib/soul-parser.js))

No runtime dependencies beyond what VitePress ships with — the radar, glyph, gallery, Weaver, and export UI are pure SVG + Vue, no chart libraries, no AI SDKs.

## Contributing

The fastest way to contribute is to add a soul. See [Adding a soul](#adding-a-soul) above. CI runs the validator on every push, so a soul that fails any of the §5 rules or is missing required sections won't merge.

For substantive changes (schema, framework, components, friction categories), please open an issue first to discuss.

For epistemic context on what's stated as fact vs. opinion vs. observation, see [Honesty about Claims](docs/honesty.md).
