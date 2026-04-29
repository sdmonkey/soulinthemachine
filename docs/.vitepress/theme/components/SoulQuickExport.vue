<script setup>
// Discrete chip rendered near the top of a soul page that jumps to the
// full export panel at the bottom. The actual export UI lives in <SoulExport />.
</script>

<template>
  <a class="soul-quick-export" href="#export-this-soul" title="Jump to export options">
    <span class="qx-arrow" aria-hidden="true">↓</span>
    <span class="qx-label">Export this soul</span>
  </a>
</template>

<style scoped>
.soul-quick-export {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  margin: 0.25rem 0 1.25rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
}

.soul-quick-export:hover,
.soul-quick-export:focus-visible {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft, var(--vp-c-bg-soft));
  text-decoration: none;
}

.qx-arrow {
  font-size: 0.9rem;
  line-height: 1;
}

.qx-label {
  font-weight: 500;
}
</style>
