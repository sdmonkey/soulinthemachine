# Contributing to SoulInTheMachine

Thanks for your interest. This project is small, opinionated, and built around a thesis (see [README](README.md) and the [home page](https://sdmonkey.github.io/soulinthemachine/)). Contributions that sharpen the thesis are welcome; contributions that water it down to please everyone are usually not.

If you're not sure whether your idea fits, **open an issue first**. Five minutes of discussion saves a rejected PR.

## What we're looking for

In rough order of how readily we'll merge:

1. **New souls** that fill a real role gap and respect the [scoring discipline](#scoring-discipline). The bar is "could a real team deploy this for a real job?" — not "would this be funny?"
2. **Friction observations** — concrete examples of where a soul collides with the LLM substrate that the existing [Machine-Soul Friction](docs/machine-soul-friction.md) categories don't yet cover.
3. **Bug fixes** — validator false positives, broken exports, gallery filter glitches, dead links, typos.
4. **Documentation clarifications** where something is genuinely ambiguous. Style polish for its own sake is usually noise.
5. **New components / features** — please open an issue first. The site intentionally has zero runtime dependencies beyond VitePress, and we'd like to keep it that way.

What we're **not** looking for:
- Souls that score 7+ on most axes ("strong everywhere is uncalibrated" — rule 3 of the validator will reject them anyway).
- Souls whose flaws are virtues in disguise ("flaw: cares too much"). The flaws are the load-bearing part of this project; if you can't name a real cost, the soul isn't ready.
- Direct impersonations of named characters. Souls are **original archetypes inspired by characters**, not characters themselves. See [Naming convention](docs/soul-authoring-guide.md#1-naming-convention).
- Refactors that don't change behavior, with no other motivation.
- AI-generated PRs that the author hasn't read end-to-end. Use the [Soul Weaver](https://sdmonkey.github.io/soulinthemachine/weave) for AI-assisted authoring — it's designed for the round-trip — but you own what you submit.

## Adding a soul (the main path)

Three options, easiest first:

1. **[Soul Weaver](https://sdmonkey.github.io/soulinthemachine/weave) with AI assistance.** Describe the soul in a sentence, copy the generated prompt to your LLM of choice, paste the response back, autofill, tune, download. Drop the resulting `.md` into `docs/souls/` and open a PR.
2. **Soul Weaver from scratch.** Same form, manual fields. The radar updates live and the form validates as you go.
3. **Hand-author.** Read the [Authoring Guide](docs/soul-authoring-guide.md) — especially *How to write a flaw that bubbles up* and *Scoring discipline* — copy the template, save as `docs/souls/<slug>.md`.

Whichever path you take, before opening the PR:

```bash
npm install
npm run validate          # enforces frontmatter, scoring discipline, required sections
npm run docs:dev          # http://localhost:5173 — preview the soul page + gallery card
```

The validator is the same one CI runs. If it fails locally, it'll fail in CI.

### Scoring discipline

All four rules are enforced by the validator:

1. **At least one axis ≤ 3** — the dip names the trade-off.
2. **At least one axis ≥ 7** — the spike names the strength.
3. **No more than four axes ≥ 7** — strong everywhere is uncalibrated.
4. **All scores are integers 1–10.**

If you find yourself fighting the rules to get a soul in, the soul probably needs more thought, not the rules less enforcement.

### Required sections

A soul without **Flaws & Quirks**, **Behavioral Forecast**, or **Runtime Caveats** is incomplete and the validator will reject it. The flaws and the friction notes are what makes the registry useful — they're not optional polish.

## Substantive changes

For changes to any of the following, **open an issue before you write code**:

- The 10-axis schema (`docs/radar-schema.md`)
- The seven friction categories (`docs/machine-soul-friction.md`)
- The scoring discipline rules
- Any of the export adapters or their output shape (used by downstream tools)
- New components or pages
- New runtime dependencies

These touch the project's thesis or its public contract with downstream tools. We want to talk about them before you spend time on a PR that may not land.

## Development

```bash
npm install
npm run docs:dev          # local dev with HMR
npm run docs:build        # production build (validate + generate exports + VitePress build)
npm run docs:preview      # serve the built site
npm run validate          # validator only (alias: npm test)
npm run prepare-exports   # regenerate per-soul export bundles
```

Project layout is documented in the [README](README.md#project-layout).

### House style

- **Markdown.** The voice is terse, concrete, and honest about its uncertainty. Read [Honesty about Claims](docs/honesty.md) — the same epistemic discipline applies to anything you add.
- **Code.** No comments unless the *why* is non-obvious. Match the surrounding patterns. No new dependencies without an issue.
- **Commits.** Imperative subject, short body if needed. Squash-merge friendly.

## Branching

Trunk-based. `main` is the production branch — every push triggers validate → build → deploy to GitHub Pages, so whatever's at the tip of `main` is what's live. Branch off `main` for your work, PR back into `main`, squash-merge. There is no `dev`, `staging`, or long-lived release branch; CI is the gate, and PR previews (or `npm run docs:dev` locally) cover the "see it before it ships" need.

Topic-branch naming is your call — `add/the-quiet-archivist`, `fix/validator-frontmatter-edge-case`, `docs/clarify-vox-axis` are all fine. The branch is gone after squash-merge; what matters is the PR title and the commit message that lands on `main`.

The only foreseeable exception is a versioned schema freeze (a `release/v<X>` branch so downstream tools can pin to a specific export shape). We don't have one yet and won't create one speculatively.

## Pull requests

1. Fork, branch, push.
2. Open a PR against `main`. Describe what changed and why; if it adds a soul, link the radar shape (the PR preview link from VitePress is fine) so reviewers can see the spike/dip pattern at a glance.
3. CI runs `npm run validate` and a full build on every push. Both must pass.
4. Review may push back on the *thesis fit* of a soul (does the trade-off feel real? does the flaw actually bubble up?) — this is normal and not personal. The discipline of the registry is what makes it useful.

A PR that adds a soul, passes validation, and makes its trade-offs honestly is usually a fast merge.

## Issues and discussion

- **Bug?** Open an issue with reproduction steps. For validator or build failures, paste the full error.
- **Idea or proposal?** Open an issue with the motivating use case before writing code. "Could the radar support an 11th axis?" is a fine question; a PR that adds one without prior discussion is not.
- **Question about a soul or the framework?** Issues are fine for these too — they often become documentation.

## Licensing

This project is licensed under the [Apache License 2.0](LICENSE). By submitting a contribution, you agree it will be released under the same license, and you confirm that you have the right to submit it (i.e., it's your work, or you have permission from whoever does own it). No CLA — the Apache 2.0 inbound = outbound convention applies.

## Code of conduct

Be respectful, assume good faith, and disagree on the substance. Reviewers will sometimes be direct about why a soul isn't merging — that's about the work, not about you. Same expectation in the other direction.

Personal attacks, harassment, and bigotry are out of bounds and will get you removed without much ceremony.

---

Thanks for reading this far. If you're about to add a soul, the most useful thing you can do before writing it is to look at three or four existing souls in the [gallery](https://sdmonkey.github.io/soulinthemachine/souls/) and notice the *shape* of a flaw that bubbles up. The shape is the craft; the rest is filling in the template.
