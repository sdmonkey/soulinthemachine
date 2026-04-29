---
layout: home

hero:
  name: "SoulInTheMachine"
  text: "Predictable unpredictability for AI agents."
  tagline: "A registry of personality profiles that maps psychological traits to functional automation roles. Every soul is a designed disposition, scored on 10 axes, and honest about where it collides with the substrate."
  actions:
    - theme: brand
      text: Browse Souls
      link: /souls/
    - theme: alt
      text: 10-Axis Radar
      link: /radar-schema
    - theme: alt
      text: Machine-Soul Friction
      link: /machine-soul-friction
    - theme: alt
      text: Authoring Guide
      link: /soul-authoring-guide

features:
  - title: A taxonomy, not a vibe
    details: "Every soul is scored 1–10 on ten functional axes — Build, Verify, Communicate, Operate. Spikes are what you hire it for; dips are what you accept in return."
  - title: Flaws as features
    details: "Bubble-up flaws are first-class. A 'paranoid' auditor finds more real issues than a 'helpful' one. We document the trade so you can deploy with the trade."
  - title: Honest about the runtime
    details: "Each soul discloses Machine-Soul Friction — where the design intent collides with the LLM's training, memory, tools, and context window, plus what to do about it."
  - title: Open, versioned, forkable
    details: "Souls are Markdown files in a Git repo. Fork an archetype, tune it for your domain, version it, ship it. No database, no lock-in."
---

## Predictable unpredictability

A sophisticated evolution of the soul-as-markdown concept. By framing the `soul.md` as a "Biological Logic Layer" rather than just a prompt, we are addressing the most difficult part of AI Agency: **Predictable Unpredictability.**

If you've worked with enough autonomous agents, with or without defined souls, you have undoubtedly encountered this challenge. When an agent has no soul definition, their personality is often agreeable to a fault and their behavior unpredictable. With a defined soul, an agent becomes more consistent — but also more extreme. With the correct alignment, that extremity can be focused and turned into an advantage.

The idea that traits "bubble up" (even when inconvenient) is, in our reading, the direction high-level agent frameworks are evolving. A security auditor with a "Paranoid" flaw is more effective than an auditor that relies only on its underlying training. That same trait, however, would make the agent less effective at HR tasks.

## Why anchor to known characters

Well-known cultural characters appear in training data thousands of times — fan-fiction, character analyses, transcripts, secondary literature — and each appearance reinforces a coherent latent attractor: vocabulary, prosody, behavioral tendencies, the unwritten details of how the character speaks and reasons. Anchoring a soul to a known character invokes that whole pattern; the model fills in what the explicit instructions don't cover with internal consistency. Fabricated personas, by contrast, are just the description you wrote — the model generalizes from sparse cues, and the result is fuzzier and less coherent across long sessions.

Each soul here leans on a *Think:* inspiration line without directly impersonating the character. The original archetype name carries the domain context (code review, executive assistance, incident command); the cultural reference fills in the unwritten consistency between traits. A side benefit: cultural anchors are more resilient through context compaction — see [Persona Re-Grounding](/machine-soul-friction#_7-persona-re-grounding) in the friction framework — since a summary that names the inspiration reactivates the attractor with full bandwidth, while a fabricated persona only re-grounds against whatever the summary preserved verbatim.

A note on confidence: the claims on this site sit at varying levels of support — some are well-established LLM behaviors, some are observational patterns we've named, some are design opinions, and some are subjective interpretations. See [Honesty about Claims](/honesty) for the breakdown.

<HomeRadarShowcase />
