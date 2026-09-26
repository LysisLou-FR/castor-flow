<script setup>
defineProps({ size: { type: Number, default: 20 } })
</script>

<template>
  <svg class="acorn" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21c-4 0-6.5-3.6-6.5-7.5V11h13v2.5C18.5 17.4 16 21 12 21z" fill="#e0a45c" />
    <path d="M12 21c-1.5 0-2.8-.5-3.8-1.4 4.5.6 7.6-2.3 8.2-6.6h2.1v.5C18.5 17.4 16 21 12 21z" fill="#c9843f" />
    <path d="M4 11.5c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1z" fill="#7a4a26" />
    <path d="M7 8.5c1.5-1 3.2-1.4 5-1.4" stroke="#a36a3c" stroke-width="1.4" stroke-linecap="round" fill="none" />
    <path d="M12 6V3.5c0-.6.8-1 1.6-.9" stroke="#5a341a" stroke-width="1.8" stroke-linecap="round" fill="none" />
  </svg>
</template>
