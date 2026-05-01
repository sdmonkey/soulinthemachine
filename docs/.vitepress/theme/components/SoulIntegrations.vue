<script setup>
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const slug = computed(() => frontmatter.value?.slug || '')

// Three integration targets the user is most likely to want to deploy into.
// Each row is "what you'd actually type" — the file is a sibling of soul.md
// in the per-soul export dir, downloaded then dropped into a project.
const rows = computed(() => [
  {
    id: 'claude',
    label: 'Claude Code',
    file: 'soul-claude.md',
    cmd: 'cp soul-claude.md /your/project/CLAUDE.md'
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    file: 'soul-openclaw.md',
    cmd: 'cp soul-openclaw.md /your/project/SOUL.md'
  },
  {
    id: 'sdk',
    label: 'Agent SDK',
    file: 'soul-agent-sdk.py',
    cmd: 'python soul-agent-sdk.py   # or: npx tsx soul-agent-sdk.ts'
  }
])

const copied = ref({})

async function copyCmd(row) {
  try {
    await navigator.clipboard.writeText(row.cmd)
    copied.value = { ...copied.value, [row.id]: true }
    setTimeout(() => {
      copied.value = { ...copied.value, [row.id]: false }
    }, 1500)
  } catch {
    // Clipboard might be unavailable (insecure context); silently no-op.
  }
}
</script>

<template>
  <section v-if="slug" class="soul-integrations" aria-label="Use this soul in your tool">
    <header class="si-header">
      <span class="si-eyebrow">USE WITH</span>
      <p class="si-lead">
        Drop this soul into the tool you're already using. One command each — exports below.
      </p>
    </header>
    <ul class="si-list">
      <li v-for="row in rows" :key="row.id" class="si-row">
        <span class="si-label">{{ row.label }}</span>
        <code class="si-cmd">{{ row.cmd }}</code>
        <button
          type="button"
          class="si-copy"
          :class="{ 'is-copied': copied[row.id] }"
          @click="copyCmd(row)"
          :aria-label="`Copy command for ${row.label}`"
        >
          {{ copied[row.id] ? 'Copied' : 'Copy' }}
        </button>
      </li>
    </ul>
    <p class="si-foot">
      <a href="#export-this-soul">All seven export formats (download or copy) ↓</a>
    </p>
  </section>
</template>

<style scoped>
.soul-integrations {
  margin: 2.5rem 0 1.25rem;
  padding: 1.1rem 1.25rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.si-header {
  margin-bottom: 0.85rem;
}

.si-eyebrow {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.35rem;
}

.si-lead {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
}

.si-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.si-row {
  display: grid;
  grid-template-columns: 7rem 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.si-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-1);
}

.si-cmd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  background: transparent;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-copy {
  font-family: var(--vp-font-family-base);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
}
.si-copy:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.si-copy.is-copied {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.si-foot {
  margin: 0.85rem 0 0;
  font-size: 0.8rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
}
.si-foot a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.si-foot a:hover {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .si-row {
    grid-template-columns: 1fr auto;
    gap: 0.4rem 0.7rem;
  }
  .si-label {
    grid-column: 1 / -1;
  }
  .si-cmd {
    white-space: normal;
    word-break: break-word;
  }
}
</style>
