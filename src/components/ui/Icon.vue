<script setup>
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 22 } })

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  bag: '<path d="M5.5 8h13l-1.1 11.2a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8L5.5 8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  video: '<rect x="3" y="6" width="12.5" height="12" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3"/>',
  noads: '<rect x="3" y="6" width="12.5" height="12" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3"/><path d="M3 3l18 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4v4.5H9"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.7-7.5-9.5V6z"/>',
  wait: '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5s8 4 8 8.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
}
</script>

<template>
  <svg
    class="icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS[name]"
  />
</template>
