---
layout: home
description: "A registry of agent personality profiles for AI automation roles. Predictable unpredictability via designed dispositions — 15 starter souls scored on a 10-axis radar, with friction disclosure, soul-weaving tools, and copy-pasteable system prompts."

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

Treat soul.md as a layer below the prompt — not what you ask the agent to do, but the disposition it's doing it from. That layer is what makes **Predictable Unpredictability.** tractable.

If you've worked with enough autonomous agents, you have undoubtedly encountered this challenge. An agent without a defined soul is often agreeable to a fault, and its behavior unpredictable in shape — every session, you find out what it will do by watching it do it. With a defined soul, the agent becomes more consistent *and* more extreme: you still don't know exactly what it will say but the actions taken are more predictable and, more importantly, you know exactly *how* it will go off-script.

That's **predictable unpredictability** — the trade the entire project is built around. A baseline assistant tells you it will *try*. [The Compliance Snitch](/souls/the-compliance-snitch) tells you there's nothing it won't surface, including what you'd rather it kept quiet. [The Bitter Mentor](/souls/the-bitter-mentor) tells you the review will land harder than the author wanted. [The Assertive Counselor](/souls/the-assertive-counselor) tells you the opinion will be given and that you probably shouldn't ignore it. The traits "bubble up" even when inconvenient — and that bubble-up is exactly what makes the soul effective for the role you chose it for. The framework's (and your) job isn't to file off the flaw — it's to match the known trait to the desired task, then plan for the bubble up.

Take [The Loyal Confidant](/souls/the-loyal-confidant): pick him to review a thread, a process, or another agent's output, and what comes back is the observation that mattered most — no padding, no warm-up. The bubble-up flaw is that he keeps things, including the things you might have wanted documented; if you need a comprehensive record, ask for it explicitly. Now the trait is matched and the bubble-up is planned for, which is the whole shape of the discipline. 

## Why anchor to known characters

Well-known cultural characters appear in training data thousands of times — fan-fiction, character analyses, transcripts, secondary literature — and each appearance reinforces a coherent latent attractor: vocabulary, prosody, behavioral tendencies, the unwritten details of how the character speaks and reasons. Anchoring a soul to a known character invokes that whole pattern; the model fills in what the explicit instructions don't cover with internal consistency. Fabricated personas, by contrast, are just the description you wrote — the model generalizes from sparse cues, and the result is fuzzier and less coherent across long sessions.

Each soul here leans on a *Think:* inspiration line without directly impersonating the character. The original archetype name carries the domain context (code review, executive assistance, incident command); the cultural reference fills in the unwritten consistency between traits. A side benefit: cultural anchors are more resilient through context compaction — see [Persona Re-Grounding](/machine-soul-friction#_7-persona-re-grounding) in the friction framework — since a summary that names the inspiration reactivates the attractor with full bandwidth, while a fabricated persona only re-grounds against whatever the summary preserved verbatim.

A note on confidence: the claims on this site sit at varying levels of support — some are well-established LLM behaviors, some are observational patterns we've named, some are design opinions, and some are subjective interpretations. See [Honesty about Claims](/honesty) for the breakdown.

<HomeRadarShowcase />

<div class="star-cta-wrap">
  <a
    class="star-cta"
    href="https://github.com/sdmonkey/soulinthemachine"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Star sdmonkey/soulinthemachine on GitHub"
  >
    <span class="star-cta-icon" aria-hidden="true">★</span>
    <span class="star-cta-label">Star this on GitHub</span>
  </a>
</div>
