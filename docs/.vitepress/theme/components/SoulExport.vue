<script setup>
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter } = useData()

const slug = computed(() => frontmatter.value?.slug || '')

const formats = computed(() => [
  {
    id: 'md',
    label: 'soul.md',
    file: 'soul.md',
    desc: 'The full curated artifact. Drop into CLAUDE.md or an agent\'s system folder.',
    mime: 'text/markdown'
  },
  {
    id: 'prompt',
    label: 'soul-prompt.txt',
    file: 'soul-prompt.txt',
    desc: 'Prose-flattened system prompt. Paste directly into a system prompt field.',
    mime: 'text/plain'
  },
  {
    id: 'json',
    label: 'soul.json',
    file: 'soul.json',
    desc: 'Frontmatter only — programmatic ingestion for agent SDKs and tooling.',
    mime: 'application/json'
  }
])

const fileUrl = (file) => withBase(`/exports/${slug.value}/${file}`)

const copied = ref({})  // { 'md': true } when last copy was successful
const copyError = ref(null)

async function copyFormat(fmt) {
  copyError.value = null
  try {
    const res = await fetch(fileUrl(fmt.file))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    await navigator.clipboard.writeText(text)
    copied.value = { ...copied.value, [fmt.id]: true }
    setTimeout(() => {
      copied.value = { ...copied.value, [fmt.id]: false }
    }, 1800)
  } catch (err) {
    copyError.value = `Couldn't copy: ${err.message}`
  }
}
</script>

<template>
  <section v-if="slug" id="export-this-soul" class="soul-export" aria-label="Export this soul">
    <div class="soul-export-header">
      <span class="soul-export-eyebrow">DEPLOY</span>
      <h2 class="soul-export-title">Export this soul</h2>
      <p class="soul-export-lead">
        Three formats. Pick the one that fits where you're deploying.
      </p>
    </div>

    <div class="soul-export-grid">
      <article v-for="fmt in formats" :key="fmt.id" class="soul-export-card">
        <header class="card-head">
          <code class="card-filename">{{ fmt.label }}</code>
        </header>
        <p class="card-desc">{{ fmt.desc }}</p>
        <div class="card-actions">
          <a
            class="btn btn-primary"
            :href="fileUrl(fmt.file)"
            :download="fmt.file"
          >
            Download
          </a>
          <button
            type="button"
            class="btn btn-secondary"
            :class="{ 'is-copied': copied[fmt.id] }"
            @click="copyFormat(fmt)"
          >
            {{ copied[fmt.id] ? 'Copied' : 'Copy' }}
          </button>
        </div>
      </article>
    </div>

    <p v-if="copyError" class="soul-export-error" role="alert">{{ copyError }}</p>
  </section>
</template>

<style scoped>
.soul-export {
  margin: 3rem 0 1.5rem;
  padding: 1.5rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.soul-export-header {
  margin-bottom: 1.25rem;
}

.soul-export-eyebrow {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.4rem;
}

.soul-export-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: none;
  padding: 0;
}

.soul-export-lead {
  margin: 0.4rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}

.soul-export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.soul-export-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.card-head {
  margin-bottom: 0.5rem;
}

.card-filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: transparent;
  padding: 0;
}

.card-desc {
  margin: 0 0 0.85rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1.4;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: var(--vp-font-family-base);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-brand-1);
}
.btn-primary:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.btn-secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.btn-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.btn-secondary.is-copied {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.soul-export-error {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: var(--vp-c-danger-1, #ef4444);
}

@media (max-width: 540px) {
  .soul-export {
    padding: 1rem;
  }
  .card-actions {
    flex-direction: column;
  }
}
</style>
