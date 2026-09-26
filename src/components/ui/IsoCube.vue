<script setup>
import IsoBlock from './IsoBlock.vue'

// Un cube seul (icône des équipes du chantier).
defineProps({
  color: { type: Number, required: true },
  size: { type: Number, default: 32 },
})
</script>

<template>
  <svg class="iso-cube" :width="size" :height="size * (74 / 70)" viewBox="-35 -38 70 74" aria-hidden="true">
    <IsoBlock :color="color" :x="0" :y="0" :z="0" :unit="64" />
  </svg>
</template>
