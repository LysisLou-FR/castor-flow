<script setup>
// Tête du castor de l'icône (assets/icon-beaver.svg), avec contour blanc et ombre douce :
// même source que l'icône de l'appli, une retouche du dessin met à jour les deux.
import source from '../../../assets/icon-beaver.svg?raw'

defineProps({ size: { type: Number, default: 220 } })

const group = (id) => source.match(new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`))?.[1] ?? ''
const head = group('head')
const face = group('face')
const OUTLINE = 44 // comme dans scripts/build-icons.mjs
</script>

<template>
  <svg class="beaver-head" :width="size" :height="size * (1140 / 1250)" viewBox="-113 -60 1250 1140" role="img" aria-label="Castor">
    <defs>
      <filter id="beaver-head-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" />
      </filter>
    </defs>
    <ellipse cx="512" cy="650" rx="560" ry="440" fill="#3a2414" opacity="0.3" filter="url(#beaver-head-soft)" />
    <g stroke="#ffffff" :stroke-width="OUTLINE * 2" stroke-linejoin="round" v-html="head" />
    <g v-html="head" />
    <g v-html="face" />
  </svg>
</template>
