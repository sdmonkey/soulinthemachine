---
title: Honesty about Claims
description: "What's research-supported, what's observational, what's design opinion, and what's interpretation. The epistemic provenance of every claim on this site."
---

# Honesty about Claims

This site is opinionated by design, and the opinions are presented at conversational confidence. That tone is intentional — operational rules of thumb don't need footnotes to be useful — but it can blur the line between what's *known*, what's *observed*, what's *chosen*, and what's *interpreted*. This page is the disclosure.

There are four kinds of claims on this site, and they have different levels of support.

---

## 1. Research-supported (well-established LLM behaviors)

Claims about how language models actually behave at scale, supported by interpretability and alignment research even where this site doesn't cite directly:

- **Helpfulness Pull / RLHF bias.** That base-model RLHF and instruction-tuning bias models toward warmth, deference, and constructive framing is well-documented in the alignment literature (Christiano et al. 2017; Ouyang et al. 2022; subsequent work on sycophancy and over-refusal). The phenomenon is real; we're just naming a specific deployment-time consequence of it.
- **Training-data density effects.** That cultural figures with high training-data density activate richer, more consistent representations than novel descriptions follows from how transformer language models work and is observable in any modern model.
- **The "attractor" framing.** Borrowed as a useful metaphor from interpretability research on monosemantic features and circuits. We use it descriptively, not as a claim about a specific mechanism.

You can challenge our framing or our examples in this category, but the underlying phenomena are not in dispute among practitioners.

## 2. Observational (named patterns, not formally studied)

Patterns the project has noticed across deployments and named, but which haven't been the subject of formal research that we know of. Plausible, useful, unverified:

- **Persona Re-Grounding.** The discontinuity at compaction, session reset, or conversation renewal — the soul's expression re-derives from transformed context. Observable; named here as a friction category for the first time as far as we know.
- **Voice Sanitization.** The specific tendency for politeness training to flatten distinctive output voice in artifacts (commit messages, log lines, error strings) more than in conversational tone.
- **The full taxonomy of seven friction categories.** Each individual phenomenon is plausibly real; the *taxonomy* — the choice of seven categories, the boundaries between them, the names — is our framing.

Treat these as hypotheses worth using until they're disconfirmed. They make predictions you can falsify in your own deployments.

## 3. Design opinion (chosen, not derived)

Decisions made for the project that are defensible but not measured. Reasonable people could choose differently and ship a working alternative:

- **The 10 axes** (BLD, REF, AUD, DOC, CSR, NEG, VOX, OPS, GOV, ETH). The decomposition is one of many possible. We picked it for visual cleanness on a radar, group balance, and coverage of operational concerns. An 8-axis or 12-axis schema could work too.
- **The four-group structure** (Build / Verify / Communicate / Operate). One of many possible groupings. Chosen for memorability and the asymmetric 2/2/3/3 layout that gives Communicate and Operate more axes (where the persona surfaces most).
- **Scoring discipline rules** (≥1 axis ≤ 3, ≥1 axis ≥ 7, ≤4 axes ≥ 7). These constraints encode an aesthetic preference for shaped personas over generalist ones. Not derived from data — derived from the project's thesis that flaws are features and strengths are why you hire.
- **The "starter total" range of 47–64.** An empirical observation across the 15 starter souls, not a validated norm. New souls outside this range may be perfectly reasonable.
- **The export formats** (`soul.md` / `soul-prompt.txt` / `soul.json`). Three formats covering three use cases. Could have been one, could have been ten.

Disagreeing with these is fine. Forking with different choices is the registry's intended use.

## 4. Subjective interpretation (readings, not measurements)

Specific scorings and character readings — these are interpretations, not facts:

- **Per-soul radar scores.** Snape is *AUD 9* in our reading; you might read him *AUD 7*. Both are defensible. The validator's only constraint is internal consistency with the scoring-discipline rules.
- **Inspiration mappings.** "Holmes is high-VOX, the Logical Officer is low-VOX" — these are character interpretations, not measurements of character.
- **"Best for / Avoid for" tags per soul.** Operational guesses based on the radar shape, not validated against actual deployment data.
- **Severity tiers in Runtime Caveats.** *"medium"* vs. *"high"* impact is a judgment call. Calibration across souls is reasonable but not measured.

Disagreement here is healthy. Fork the soul, re-score, ship the variant.

---

## How to read the site, given the above

A small reading guide for when claims feel ambiguous:

- When the friction framework names a category like **Tool Dependency**, the *category* is design opinion; the *phenomenon* the category describes is research-supported.
- When a soul page says *"AUD 9 means the bug gets found,"* the score is interpretation but the implication is design intent.
- When a per-soul Runtime Caveat says *"Persona Re-Grounding (informational)"*, the friction is observational and the per-soul effect is interpretation. Both layers are honest.
- When the home page says *"Predictable unpredictability is the hardest part of AI agency,"* that's a thesis the project is built around — not a survey result.

If a reader confuses these layers, they may push back at the wrong target. The taxonomy is opinionated; the phenomena beneath it mostly aren't.

---

## What this site is *not*

- A peer-reviewed framework. Nothing here has been formally validated.
- A neutral survey of personality-prompting approaches. We've made specific design choices that close other paths.
- Authoritative on character interpretation. The 15 starter souls reflect our readings.
- A guarantee of agent behavior. Souls describe *design intent*; the substrate determines what actually happens — which is why [Machine-Soul Friction](./machine-soul-friction.md) exists as its own framework, openly disclosing the gap.

---

## What to do with this

The point of the site is to provide a useful, opinionated, internally-consistent vocabulary for designing agent personas. Use it where it helps. Disagree where it doesn't. Fork freely. If you find that one of our observational claims (category 2) is actually wrong in your deployment, that's a contribution — open a discussion with the data and we'll update.

We'd rather be specific and wrong than vague and unfalsifiable.
