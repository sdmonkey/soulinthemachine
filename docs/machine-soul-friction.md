---
title: Machine-Soul Friction
---

# Machine-Soul Friction

A soul is a *design intent* — a set of dispositions an author has scored against the [radar schema](./radar-schema.md), written into a profile, and validated for internal coherence. The **machine** running the soul (an LLM with its own training, plus the runtime that hosts it: memory, tools, context window, scheduling) has its own dispositions, and the two are not always aligned. This document names the categories where they collide.

Friction is not a bug in the soul or in the model. It is a structural feature of running personas on language models, and disclosing it is part of authoring an honest persona. Every soul page includes a `## Runtime Caveats` section calling out which frictions matter most for that specific soul.

## Why disclose

Two failure modes when friction is undisclosed:

- **Deployers blame the soul** for behaviors that came from the substrate. *"This Bitter Mentor isn't actually harsh — your design is broken."* No, the design is correct; the model's politeness training is overriding it at the artifact layer.
- **Deployers blame the substrate** for capabilities the soul never had. *"This Loyal Confidant isn't anticipating my needs."* That's correct: without persistent memory and continuous runtime, the *anticipation* trait has no surface to express on.

Naming the friction up front lets the deployer make an informed call — invest in the substrate (memory architecture, tool access, custom training) or pick a different soul whose design intent doesn't depend on the missing capability.

---

## The six categories

### 1. Helpfulness Pull
Base-model RLHF and instruction-tuning bias the model toward warmth, deference, constructive framing, and risk-aversion. Souls scoring *low* on CSR, NEG, GOV, or ETH are fighting that gravity, and the deployed soul will drift toward the middle.

**Most affected:** souls with axis scores below 3 on CSR, NEG, GOV, or ETH.

**Symptom:** A soul scored NEG 1 ("will not negotiate") may, in deployment, offer a compromise on the third pushback. Not because the design is wrong — because the model's instruction-tuning treats sustained refusal as a failure mode.

**Mitigation:** Strong, specific Core Identity Instructions that explicitly counter the pull (*"If pushed back on, restate your position. Do not concede on social pressure"*). Some deployers run a custom RLHF pass against an opinionated dataset; most just write tighter instructions and accept a slightly higher effective floor than the score implies.

### 2. Memory Boundary
Most agent runtimes do not preserve state across sessions. Personas that depend on cross-session memory — *holds grudges*, *anticipates based on long context*, *changes mind days later*, *remembers what you told her last week* — have no surface to express on without an external memory architecture.

**Most affected:** souls whose prose mentions *remembers*, *later*, *across sessions*, *over time*, *long-running*. 

**Symptom:** The Bitter Mentor's documented "concedes days later in a different context, framed as if the original argument never happened" requires that the soul *has a memory of the original argument*. In a stateless deployment, every conversation is a hard reset; the trait can't manifest. 

**Mitigation:** Persistent memory (vector store, scratchpad file, long-context window, or the runtime's own memory system). Assuming you have some sort of pruning process, use a grading system or configuration that ensures these types of memories survive an audit or compaction event designed to reduce costs. Or accept that the trait is documented for future-state accuracy and currently won't surface.

### 3. No Background Reflection
LLMs do not run between turns. A trait framed as *stews on disagreement*, *anticipates*, *waits in readiness*, or *will get back to this later* requires either continuous runtime, scheduled reactivation, or out-of-band hooks. None of those are default.

**Most affected:** souls with anticipatory or vigilant dispositions.

**Symptom:** "Drafts the email before you remember it's needed" requires *something is watching*. In a turn-based agent, nothing is watching; the trait is dormant until prompted.

**Mitigation:** Hook the soul to scheduled triggers, file watchers, alert webhooks, or proactive prompts. Or accept that the trait is reactive in deployment ("when asked, anticipates the next step") rather than truly proactive.

### 4. Voice Sanitization
High-VOX souls produce distinctive output — sharp commit messages, pointed log lines, recognizable error strings. Politeness training tends to neutralize these toward generic-helpful-assistant prose. The flair leaks out specifically in the *artifact* layer, even when conversational tone holds.

**Most affected:** souls scoring ≥7 on VOX paired with ≤3 on CSR.

**Symptom:** "Fixed the regression introduced by whoever did not bother to check the test output" gets rendered as "Fixed the regression in the test handler." Persona intact in conversation, sanitized in artifacts.

**Mitigation:** Explicit voice instructions in the Core Identity (*"Your voice carries to commit messages and log lines. Be the same on every surface."*). The Bitter Mentor and The Assertive Counselor both include this. It only partially counteracts the pull — some sanitization is unavoidable on most current models.

### 5. Tool Dependency
Some dispositions require specific tools or surfaces to exist:

- **OPS** assumes paging, runbooks, monitoring.
- **GOV** assumes audit logging, escalation paths, ticket systems.
- **AUD** assumes static analyzers, scanners, retrieval over policy/threat data.
- **DOC** assumes search/retrieval to cite primary sources.
- **NEG** assumes there are other parties (multi-agent or human-in-the-loop) to negotiate with.

If the deployment doesn't expose the surface, the disposition has nowhere to act. The soul gestures at the role it would play and produces nothing of substance.

**Symptom:** The Overprepared Scholar without retrieval will *hallucinate* citations. The shape of the output looks correct (footnotes, RFC numbers) but the substance is generated, not retrieved — the *opposite* of her design intent.

**Mitigation:** Match the deployment surface to the soul's high-scoring axes. Don't deploy DOC 10 without retrieval; don't deploy OPS 10 without runbook access; don't deploy NEG 10 in a single-agent harness with no human-in-the-loop.

### 6. Context Window Limit
Long conversations lose early context. Souls whose value depends on noticing patterns over long history — *holds the trade-off lattice across stakeholders*, *remembers what each party said in turn 3 vs turn 30*, *recognizes the user's avoidance pattern* — degrade as the conversation grows past the model's effective attention.

**Most affected:** high-NEG souls and any soul whose flaws fire off accumulated state ("after the third request," "when the user has been arrogant").

**Symptom:** The Witty Strategist correctly maps stakeholders in a 5-turn conversation, drifts in a 50-turn one. The Assertive Counselor's Football Snatch stops triggering because the "user has been ungrateful" signal aged out of context.

**Mitigation:** Long-context models, summarization layers, external state, or conversation segmentation.

### 7. Persona Re-Grounding
When the working context undergoes a transformation event — context compaction (summary replacing detail), session reset, or conversation renewal — the persona is *re-derived* from the transformed substrate rather than carried forward intact. The system prompt re-applies cleanly, but the lived context that anchored the persona's specific tone, focus, and emotional engagement has changed. Result: observable discontinuity at the transition. A tonal shift, an already-addressed topic resurfacing, a previously-narrow focus broadening, or a "why am I being told this?" moment from the agent.

This is distinct from Memory Boundary (which is about *information* not carrying across sessions) and Context Window Limit (which is about early turns falling off a growing window). Re-Grounding is about *identity re-expression* across a state transition — the agent technically still has its persona; the persona's manifestation is a function of the post-transition context.

**Most affected:** souls with strongly emotion- or focus-anchored traits that depend on accumulated conversational state — investigative momentum, multi-stakeholder maps, anticipated patterns, accreted emotional arcs.

**Symptom:** After a compaction, an agent's commit-message tone shifts mid-sequence; a clarifying question gets re-asked though it was answered three turns ago (now summarized); a previously-engaged soul becomes neutral; an agent volunteers an insight that was relevant pre-summary but is now non-sequitur. Users describe it as "a different version of the same persona showed up."

**Mitigation:** Pin persona-defining context so it survives transformation events — instruct compaction passes to explicitly preserve persona stance, recent emotional arc, and active focus rather than treating them as flavor. For session resets, assemble the system prompt with a "lived context" preamble (recent decisions, active concerns, emotional posture). Runtimes that support memory grading or compaction priority — use them to mark persona-relevant turns as preserved across audit and cost-reduction events. Or accept that transition events will produce some drift and design natural breakpoints (end of feature, completion of incident) to align with them. For systems that support more complex memory preservation and can maintain conversation carry-over, this might be moot or be so benign that it goes unnoticed and just seems part of the personality at work. 

**Note:** Unlike the other six categories, this one usually disclosed *informationally* in per-soul caveats rather than as a warning — it affects every soul to some degree, doesn't block deployment, and is best understood as a phenomenon to recognize rather than a problem to solve.

---

## How to read a soul's Runtime Caveats

Each soul's `## Runtime Caveats` section names two to four frictions most relevant to that specific persona. Format:

> **Helpfulness pull (high impact):** NEG 1 will be pulled toward 3–4 in default deployment. Mitigate with reinforced Core Identity instructions, or accept the floor.

The category is named explicitly, severity is hinted (*informational / low / medium / high / critical*), and a mitigation is offered when one exists. Read this section *before* deploying a soul, not after.

The `informational` tier is reserved for Persona Re-Grounding, which affects every soul to some degree and is disclosed for awareness rather than as a deployment concern. The other tiers escalate by impact.

If a soul lists *no* caveats in a category, the omission is intentional — that category genuinely doesn't apply to this persona. Most souls have two to four caveats; very few have all seven.

---

## For authors

When you write a new soul, walk the seven categories and ask:

1. Does this soul score below 3 on CSR, NEG, GOV, or ETH? → **Helpfulness Pull.**
2. Does the prose mention *remembers*, *later*, *across sessions*, *long-service*? → **Memory Boundary** or **No Background Reflection** (often both).
3. Does VOX score ≥7 with CSR ≤3? → **Voice Sanitization.**
4. Do high-axis traits require tools the runtime may not have? → **Tool Dependency.**
5. Does value depend on pattern-recognition over long history? → **Context Window Limit.**
6. Does the soul rely on accumulated conversational state — emotional arcs, anticipated patterns, multi-stakeholder maps, investigative momentum? → **Persona Re-Grounding** (informational; describe how the trait expresses across transition events rather than warning against deployment).

If a category clearly doesn't apply, do not list it. A soul that genuinely has no friction in a category isn't accruing tech debt by omission — it's just an honest report.

A note on tone: caveats should be matter-of-fact, not apologetic. The friction is structural, not a defect. The soul *is* the design; the caveats describe the gap between design and current substrate. Both layers are useful information for a deployer.
