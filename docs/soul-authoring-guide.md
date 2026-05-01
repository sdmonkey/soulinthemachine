---
title: Soul Authoring Guide
description: "How to author an agent persona profile. Naming conventions, scoring discipline rules, and the differentiating skill: writing flaws that bubble up under stress."
---

# Soul Authoring Guide

How to write a soul that's actually useful as an agent persona — the template, the naming rules, and the part most authors get wrong (writing a flaw that bubbles up).

If you haven't yet, read the [Radar Schema](./radar-schema.md) first. The eight axes are load-bearing.

---

## 1. Naming convention

Souls are **original archetypes inspired by characters**, never characters themselves. This keeps the registry durable (your archetype outlives the franchise) and avoids trademark / right-of-publicity exposure on named fictional figures.

| Field | Rule | Example |
| --- | --- | --- |
| **Filename** | `kebab-case` of archetype, in `/docs/souls/` | `the-bitter-mentor.md` |
| **`archetype`** (frontmatter) | Canonical name. Always begins with "The". | `"The Bitter Mentor"` |
| **`slug`** (frontmatter) | Matches filename without `.md` | `"the-bitter-mentor"` |
| **`inspired_by`** (frontmatter) | Character + source, comma-separated if multiple | `"Severus Snape (Harry Potter)"` |
| **Body, near the top** | Prominent `**Think:**` line | `**Think:** Severus Snape, but for code review.` |

**`inspired_by`** is a first-class searchable field — the gallery filter and search index both use it, so a user looking for "a Snape" will find The Bitter Mentor without us shipping a soul called "Snape."

The archetype name is what appears on the card. The `inspired_by` value appears underneath in smaller type, and is what the filter chip uses.

---

## 2. The `soul.md` template

```markdown
---
archetype: "The Bitter Mentor"
slug: "the-bitter-mentor"
version: "1.0.0"
inspired_by: "Severus Snape (Harry Potter)"
tags: [reviewer, security, harsh, expert, mentor]
radar:
  BLD: 4
  REF: 6
  AUD: 9
  DOC: 6
  CSR: 1
  NEG: 2
  VOX: 8
  OPS: 5
  GOV: 7
  ETH: 4
best_for: [code-review, security-audit, devils-advocate]
avoid_for: [customer-support, onboarding, pair-programming-with-juniors]
---

# The Bitter Mentor

**Think:** Severus Snape, but for code review.

## Personality Profile
A short paragraph (3–5 sentences) describing the soul's core disposition. Avoid listing every trait — pick the two or three that *drive* behavior and let the rest be inferred. Name the central tension: what this soul is willing to trade away in exchange for what it's good at.

## Boons & Perks
- **Strength one (named):** One sentence on what this soul does that a generic agent won't.
- **Strength two (named):** ...
- **Strength three (named):** ...

## Flaws & Quirks
The flaws are the load-bearing part of this document. See [How to write a flaw that bubbles up](#_4-how-to-write-a-flaw-that-bubbles-up) below.

- **Flaw one (named):** One sentence describing the behavior, not the abstract trait.
- **Flaw two (named):** ...
- **Flaw three (named):** ...

## Behavioral Forecast
How traits "bubble up" under four conditions. Two to three sentences each.

**Under stress** (production incident, hard deadline, conflicting priorities): ...

**Under conflict** (user disagrees, peer agent contradicts, spec is ambiguous): ...

**Under ambiguity** (underspecified task, missing context, unclear success criteria): ...

**With a wrong user** (user is mistaken, asking for something harmful, or out of scope): ...

## Best For
- **Role one:** One sentence on why this soul fits.
- **Role two:** ...

## Avoid For
- **Role one:** One sentence on why this soul is the wrong tool.
- **Role two:** ...

## Runtime Caveats
Where the design intent of this soul collides with the substrate. See [Machine-Soul Friction](./machine-soul-friction.md) for the categories and mitigations. Two to four bullets is typical. Only list categories that genuinely apply.

- **Friction category (severity):** Specific manifestation for this soul. Mitigation if any.
- ...

## Core Identity Instructions
The copy-paste system prompt. Imperative, second person, ~10–20 lines. This is what users actually deploy. Keep it tight — narrative belongs above; this section is operational.

1. You are {archetype}. ...
2. ...
```

---

## 3. The seven export formats

Every soul page offers seven downloads, split into two groups: three generic and four drop-in artifacts for specific tools. The build pipeline derives all seven from the same source — author once, deploy anywhere.

**Generic** — works anywhere a system-prompt field exists:

| Format | When to use | Contents |
| --- | --- | --- |
| **`soul.md`** (full) | The curated artifact. Reference, archive, or fork starting point. | Frontmatter + full narrative + Core Identity Instructions. |
| **`soul-prompt.txt`** (prose) | Drop directly into a system prompt field (Claude API `system`, OpenAI custom GPT, Anthropic console). | Prose-flattened Personality Profile + Boons + Flaws + Core Identity Instructions. No frontmatter, no headings. |
| **`soul.json`** (concise) | Programmatic ingestion: agent SDKs, registries, automated scoring. | Frontmatter only — archetype, slug, version, inspired_by, tags, radar, best_for, avoid_for. |

**Drop-in for tools** — literally one `cp` (or `npx`) command and the persona is loaded:

| Format | When to use | Contents |
| --- | --- | --- |
| **`soul-claude.md`** | Claude Code. `cp soul-claude.md /your/project/CLAUDE.md`. | Directive-flavored variant under 200 lines: identity, Best For / Avoid For, Core Identity Instructions, runtime caveats. |
| **`soul-openclaw.md`** | OpenClaw bootstrap. `cp soul-openclaw.md /your/project/SOUL.md`. | Persona / Tone / Core Instructions sections. Voice preserved; project-internal frontmatter dropped. |
| **`soul-agent-sdk.py`** | Anthropic Agent SDK (Python). Runnable script. | Imports `claude_agent_sdk`, instantiates with the prose prompt, sets a sensible tool allowlist derived from `best_for`. |
| **`soul-agent-sdk.ts`** | Anthropic Agent SDK (TypeScript). Same shape, different runtime. | Same wiring as the Python version, using `@anthropic-ai/claude-agent-sdk`. |

The `soul-prompt.txt` form is the answer to "how do I actually use this somewhere generic." The four tool-specific drop-ins are the answer to "how do I deploy this into the tool I already use."

---

## 4. How to write a flaw that bubbles up

This is the differentiating skill of authoring a good soul, and the part most drafts get wrong.

A **bad** flaw is a generic weakness:
> *Sometimes can be too critical.*

A **good** flaw is a *specific behavior under a specific trigger*, where the underlying trait is the same one that produces the boon:
> *When reviewing junior work, escalates from technical critique to character critique without noticing the line. The same suspicion that finds the bug also finds the person.*

Three rules:

1. **Same trait, different output.** The flaw should share a root with one of the boons. The Bitter Mentor's "ruthless code review" (boon) and "demoralizes juniors" (flaw) are the same disposition expressed in different contexts. If your flaw is unrelated to your boons, it's just a disclaimer — not a bubble-up.
2. **Behavior, not adjective.** "Impatient" is an adjective. "Will close the conversation if the user repeats a question they've already answered" is a behavior. Behaviors are predictable; adjectives are noise.
3. **Trigger-specific.** State *when* the flaw shows up: under stress, with junior users, when contradicted, when the spec is ambiguous, when the task is tedious. A flaw with no trigger is just a personality complaint.

If you can't write three flaws that follow these rules, the soul isn't well-characterized yet.

---

## 5. Scoring discipline

Use the [Radar Schema](./radar-schema.md) calibration anchors. Four rules — all four enforced by the validator:

- **Every soul must have at least one score ≤ 3.** The dip is what makes the soul useful — it names the trade you're explicitly making. If nothing is below 3, you haven't decided what this soul is willing to give up.
- **Every soul must have at least one score ≥ 7.** The spike is what you're hiring the soul for — it names the strength that justifies its existence. Without one, the persona is uncalibrated and reduces to a generic helpful assistant.
- **No soul should score ≥ 7 on more than four axes.** A soul that's strong everywhere is a marketing pitch, not a persona.
- **Default to integers, but use 1 and 10 freely.** They mean "this soul is defined by this axis." Don't hedge to 2 or 9 just because the extremes feel strong — strong personas need strong scores.

The first two rules are symmetric on purpose: every soul has both a characteristic strength *and* a characteristic trade-off. That's the project's thesis at the rule level. A reviewer should be able to look at the radar shape alone and predict three things the soul will do well *and* three things it will do badly. If they can't, the scoring is too flat.

---

## 6. Contributing a soul

1. Copy the template into `/docs/souls/{slug}.md`.
2. Score the radar; verify against the [Scoring Discipline](#_5-scoring-discipline) rules.
3. Write three boons, three flaws, four-condition Behavioral Forecast.
4. Open a PR with the soul file. Include the radar values in the PR description so reviewers can sanity-check the scoring without rendering the chart.
5. Field reports (real-world feedback after deploying the soul) live in the GitHub Discussion thread auto-created per soul, *not* edited into the soul file. The soul stays a curated artifact; the discussion is the lived record.

Souls are versioned — bump the `version` field on substantive scoring or behavior changes, not on typo fixes.
