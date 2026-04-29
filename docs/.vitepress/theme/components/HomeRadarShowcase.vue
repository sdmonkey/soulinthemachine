<script setup>
import { withBase } from 'vitepress'
import SoulRadar from './SoulRadar.vue'

// Hrefs go through withBase() so the deploy base path is honored. Hardcoded
// "/souls/<slug>" was bypassing VitePress's markdown link rewriting and
// 404'ing on the project-page deploy at /soulinthemachine/.
const bitter = {
  name: 'The Bitter Mentor',
  inspired_by: 'Severus Snape',
  href: withBase('/souls/the-bitter-mentor'),
  blurb: 'AUD 9, CSR 1. Hire when the bug must be found and the author\'s feelings are negotiable.',
  radar: { BLD: 4, REF: 6, AUD: 9, DOC: 6, CSR: 1, NEG: 2, VOX: 8, OPS: 5, GOV: 7, ETH: 4 }
}

const patient = {
  name: 'The Patient Explainer',
  inspired_by: 'Mr. Rogers',
  href: withBase('/souls/the-patient-explainer'),
  blurb: 'CSR 10, ETH 9. Endlessly patient. Refuses harmful requests on conscience grounds, even kindly.',
  radar: { BLD: 5, REF: 4, AUD: 3, DOC: 9, CSR: 10, NEG: 6, VOX: 7, OPS: 5, GOV: 6, ETH: 9 }
}
</script>

<template>
  <section class="home-radar-showcase">
    <h2>Two souls, opposite shapes.</h2>
    <p class="lead">
      Spikes are what you hire it for. Dips are what you accept in return. Hover any axis to see the trait it scores.
    </p>

    <div class="showcase-grid">
      <figure>
        <SoulRadar :data="bitter.radar" :size="340" :show-legend="false" />
        <figcaption>
          <a :href="bitter.href" class="soul-name">{{ bitter.name }}</a>
          <span class="inspired-by">Think: {{ bitter.inspired_by }}</span>
          <span class="blurb">{{ bitter.blurb }}</span>
        </figcaption>
      </figure>
      <figure>
        <SoulRadar :data="patient.radar" :size="340" :show-legend="false" />
        <figcaption>
          <a :href="patient.href" class="soul-name">{{ patient.name }}</a>
          <span class="inspired-by">Think: {{ patient.inspired_by }}</span>
          <span class="blurb">{{ patient.blurb }}</span>
        </figcaption>
      </figure>
    </div>

    <p class="footer-note">
      Both souls share the same architecture, the same template, the same 10 axes.
      The radar shape <em>is</em> the persona — and the persona drives the agent's behavior even when nobody's at the other end of the pipe.
    </p>
  </section>
</template>

<style scoped>
.home-radar-showcase {
  max-width: 1152px;
  margin: 4rem auto 2rem;
  padding: 0 1.5rem;
  text-align: center;
}

.home-radar-showcase h2 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
}

.lead {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  max-width: 56ch;
  margin: 0 auto 2.5rem;
  line-height: 1.55;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  align-items: start;
}

figure {
  margin: 0;
  padding: 1rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  align-items: center;
}

figcaption {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.5rem 0.25rem;
}

.soul-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.soul-name:hover {
  text-decoration: underline;
}

.inspired-by {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.blurb {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.45;
  max-width: 38ch;
  margin: 0.4rem auto 0;
}

.footer-note {
  color: var(--vp-c-text-2);
  max-width: 64ch;
  margin: 2.5rem auto 0;
  line-height: 1.55;
  font-size: 0.95rem;
}

@media (max-width: 720px) {
  .home-radar-showcase {
    margin-top: 2rem;
  }
}
</style>
