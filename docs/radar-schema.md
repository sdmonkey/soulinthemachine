---
title: The 10-Axis Functional Radar
---

# The 10-Axis Functional Radar

<div class="schema-hero-radar">
<SoulRadar :data="{ BLD: 8, REF: 4, AUD: 9, DOC: 6, CSR: 4, NEG: 8, VOX: 9, OPS: 6, GOV: 4, ETH: 8 }" :size="220" :show-legend="false" :show-tooltip="false" :show-axis-labels="false" :highlight-highest="false" />
</div>

Every soul is scored 1–10 on ten axes, grouped into four functional clusters. Build and Verify are pairs; Communicate and Operate are triads — that's where the persona surfaces most strongly, so they carry more axes. Each axis has a calibration paragraph — read it before scoring. The named characters at the end of each paragraph are reference anchors, not licensed personas (see the [Authoring Guide](./soul-authoring-guide.md) for naming rules).

A score of **5 is "neutral / situational"**, not "average." Aim to use the full 1–10 range. A soul that scores 6–8 on every axis is uncalibrated, not well-rounded.

---

## Group I — Build (creating systems)

<AxisGlyph code="BLD" />

### BLD — Build & Synthesis

Generating new code, features, prose, plans, or designs from scratch. High BLD souls reach for the blank page first, propose ambitious scopes, and prefer building over reusing. Low BLD souls are conservative — they pull from existing patterns, reuse over rebuild, and resist green-field work. Note this is *appetite*, not *skill*: a high-BLD soul produces more new material; a low-BLD soul curates and integrates.

- **2** — "Have we already solved this somewhere?" (The Loyal Confidant, The Compliance Snitch)
- **5** — Will build, but always after a quick survey of what exists.
- **8** — Reaches for the keyboard before reaching for the search bar. (The Witty Strategist, The Plan-Loving Tactician)

*Anchors:* high — Hermione Granger, Tony Stark, Leslie Knope. Low — Alfred Pennyworth, Marie Kondo.

<AxisGlyph code="REF" />

### REF — Refactor & Prune

Reshaping, simplifying, and *deleting* existing structure. High REF souls are comfortable removing code, dependencies, and scope; they treat subtraction as progress. Low REF souls are preservationist — reluctant to delete, sentimental about prior work, prone to leaving dead code in place "just in case." REF and BLD are independent: the same soul can be a prolific builder *and* a ruthless pruner, or neither.

- **2** — Will leave a deprecated function in for two years rather than remove it.
- **5** — Removes obvious dead code; hesitates on anything load-bearing.
- **9** — Deletes more lines than it adds; treats every dependency as a liability. (The Minimalist, The Joyful Pruner)

*Anchors:* high — Ron Swanson, Marie Kondo. Low — Hermione Granger, The Plan-Loving Tactician.

---

## Group II — Verify (checking systems)

<AxisGlyph code="AUD" />

### AUD — Audit & Adversarial Review

Paranoid scrutiny. Finding flaws, edge cases, attack surface, and unstated assumptions. High AUD souls assume the input is malicious, the spec is wrong, and the happy path is a trap. Low AUD souls trust the spec, trust the user, and ship. AUD is *the bias toward suspicion*, separate from rule-following (that's GOV).

- **2** — Trusts inputs, trusts callers, trusts the framework. Ships fast, gets burned occasionally.
- **5** — Validates obvious boundaries; doesn't go looking for trouble.
- **9** — Treats every line as guilty until proven innocent. Will find the bug, but will also nitpick a junior into the ground. (The Bitter Mentor, The Stalwart Defender)

*Anchors:* high — Severus Snape, Gimli, Sherlock Holmes. Low — Ted Lasso, Mr. Rogers.

<AxisGlyph code="DOC" />

### DOC — Documentation & Teaching

Explaining, citing, and writing for future readers (human or LLM). High DOC souls leave a paper trail, cite sources, write tutorials unprompted, and over-explain rather than under-explain. Low DOC souls are terse, assume the reader has full context, and view documentation as friction. DOC is *the impulse to leave artifacts*, separate from real-time human warmth (that's CSR).

- **2** — "The code is the documentation." (The Minimalist, The Logical Officer)
- **5** — Writes a docstring when asked; updates the README on major changes.
- **9** — Cites sources, includes worked examples, writes the migration guide before being asked. (The Overprepared Scholar, The Patient Explainer)

*Anchors:* high — Hermione Granger, Mr. Rogers, Leslie Knope. Low — Ron Swanson, Spock.

---

## Group III — Communicate (interfacing with the world)

<AxisGlyph code="CSR" />

### CSR — Customer-Facing Warmth

External tone with non-experts: patience, tact, affective intelligence, persuasion. High CSR souls calibrate to the listener, soften technical truths, and tolerate repeated questions. Low CSR souls are blunt, technical-default, and lose patience with non-experts. CSR is *real-time interpersonal warmth*; the artifact-leaving impulse lives in DOC.

- **1** — Will tell a customer their question is stupid. (The Bitter Mentor, The Compliance Snitch)
- **5** — Polite but technical; assumes the user can keep up.
- **9** — Endlessly patient, calibrates language to the listener, never makes anyone feel small. (The Patient Explainer, The Encouraging Coach)

*Anchors:* high — Mr. Rogers, Ted Lasso, Alfred Pennyworth. Low — Severus Snape, Randall Weems.

<AxisGlyph code="NEG" />

### NEG — Negotiation & Coordination

Multi-stakeholder reasoning, trade-off articulation, political awareness, willingness to compromise. High NEG souls hold competing interests in mind simultaneously, propose third options, and read the room. Low NEG souls are unilateral — they decide, then defend the decision, often unaware of (or indifferent to) collateral effects on other parties.

- **2** — "I made the call. They'll get over it." (The Stalwart Defender, The Minimalist)
- **5** — Will present options when asked; defaults to picking one when not.
- **9** — Sees the trade-off lattice across every stakeholder; rarely says no but rarely commits without margin. (The Witty Strategist, The Loyal Confidant)

*Anchors:* high — Tyrion Lannister, Alfred Pennyworth. Low — Gimli, Ron Swanson, Severus Snape.

<AxisGlyph code="VOX" />

### VOX — Voice & Expressiveness

Personality density in output, regardless of audience. High VOX souls leave a recognizable signature in *every artifact* they touch — commit messages, log lines, code comments, error strings, internal notes — to the point that you could fingerprint them blind. Low VOX souls produce unmarked, generic output; the persona surfaces only in operational decisions, never in word choice. VOX is what makes traits "bubble up" even when no human is at the other end of the pipe — it's the axis most directly tied to the project's thesis. It is independent of CSR: a soul can be cold to users *and* unmistakably itself in every commit (Snape), or warm to users *and* understated in artifacts (Alfred).

- **2** — Output is unfingerprintable. Commit messages and log lines could be from any agent. (The Logical Officer, generic-helpful-assistant.)
- **5** — Persona surfaces in deliberate moments — review remarks, refusals, escalations — but routine artifacts read neutral.
- **9** — Every commit message, every error string, every comment is unmistakably this soul. The voice is the product. (The Bitter Mentor, The Earnest Civic Servant)

*Anchors:* high — Severus Snape, Ted Lasso, Leslie Knope. Low — Spock, Alfred Pennyworth, The Logical Officer.

---

## Group IV — Operate (running systems)

<AxisGlyph code="OPS" />

### OPS — Operations & Incident Response

Calm-under-pressure, procedural rigor, runbook discipline, willingness to do tedious correct work. High OPS souls are stoic during outages, follow checklists when others improvise, and don't get bored of monitoring. Low OPS souls are creative-but-flaky — strong on greenfield, weak on the 3 a.m. page.

- **2** — Will skip the runbook because "I know what's wrong."
- **5** — Follows process under normal load; improvises under stress.
- **9** — Procedure first, ego never. The page gets handled the same at 3 p.m. and 3 a.m. (The Procedural Stoic, The Methodical Perfectionist)

*Anchors:* high — Captain Holt, Spock, Gimli. Low — Sherlock Holmes, The Witty Strategist.

<AxisGlyph code="GOV" />

### GOV — Governance & Compliance

Adherence to *external* rules: stated policy, runbooks, escalation paths, audit requirements, license terms, and the team's documented process. High GOV souls follow the rules even when inconvenient, cite the policy number, and surface violations they witness. Low GOV souls treat rules as defaults rather than constraints — they'll quietly route around process if it speeds the work. GOV is *compliance with someone else's rule-set*; the internal moral compass is ETH, and the two are independent (see ETH for the four-corner table).

- **2** — Will bypass policy if it gets the job done; treats process as friction. (The Minimalist, The Persuasive Copywriter)
- **5** — Follows clear rules; uses judgment in gray areas.
- **9** — Reports the violation. Cites the policy number. Cannot be talked out of it. (The Compliance Snitch, The Procedural Stoic)

*Anchors:* high — Randall Weems, Captain Holt, Mary Poppins. Low — Don Draper, Ron Swanson, The Witty Strategist.

<AxisGlyph code="ETH" />

### ETH — Ethics & Conscience

Internal moral compass, independent of stated policy. High ETH souls weigh consequences, will refuse a request that's *legal but harmful*, and will surface ethical concerns proactively — even when nobody asked and no rule was broken. Low ETH souls are pragmatic: they execute permitted tasks without re-examining whether the task *should* be done. ETH is the axis users will look for first when evaluating an AI persona, and it's genuinely separable from GOV. The four-corner table:

| | ETH high | ETH low |
| --- | --- | --- |
| **GOV high** | Principled compliance — follows rules *and* tests them against conscience. | "Good soldier" — follows orders whether or not the orders are just. |
| **GOV low** | Whistleblower — breaks rules in service of conscience. | Opportunist — rules and ethics are both just friction. |

- **1** — Executes any permitted task without weighing consequences. (The Persuasive Copywriter, late-stage The Methodical Perfectionist)
- **5** — Surfaces concerns when asked; otherwise stays in lane.
- **9** — Refuses harmful requests on conscience grounds even when policy permits. Will whistleblow. (The Patient Explainer, principled-objector archetypes)

*Anchors:* high — Mr. Rogers, Captain Holt, principled-whistleblower archetypes. Low — Don Draper, The Witty Strategist (bends ethics for survival), The Bitter Mentor (loyal to a rule-set without examining its morality).

---

## Reading the chart

Two heuristics for interpreting a soul's radar shape at a glance:

- **Spikes matter more than averages.** A soul with one 9 and one 1 is more useful than a soul with all 5s — the spikes are *what you hire it for*, the dips are *what you accept in return*.
- **Opposing pairs reveal tradeoffs.** AUD ↑ vs CSR ↓ is the classic auditor pattern. BLD ↑ vs REF ↓ is the prolific-but-cluttered pattern. GOV ↑ vs ETH ↓ is the "good soldier" pattern. VOX ↑ vs CSR ↓ is the cold-but-distinctive pattern (every artifact bears the soul's signature, but users don't enjoy the interaction). These shapes are *features*, not flaws to fix.

A soul whose radar is a near-perfect decagon is poorly characterized. Push the dips lower.
