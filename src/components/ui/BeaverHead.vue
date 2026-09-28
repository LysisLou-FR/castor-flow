<script setup>
// Tête du castor (tirée de ton dessin assets/castor.svg), avec contour blanc et ombre douce :
// même source et même rendu que l'icône de l'appli (scripts/build-icons.mjs).
import source from '../../../assets/castor.svg?raw'
import { HEAD_BOX, castorHead } from '../../game/castorHead.js'

defineProps({ size: { type: Number, default: 220 } })

const head = castorHead(source)
const OUTLINE = 26 // comme dans scripts/build-icons.mjs
// cadre autour de la tête, avec la place du contour blanc et de l'ombre
const box = { x: HEAD_BOX.cx - HEAD_BOX.w / 2 - 60, y: -60, w: HEAD_BOX.w + 120, h: 720 }
</script>

<template>
  <svg
    class="beaver-head"
    :width="size"
    :height="(size * box.h) / box.w"
    :viewBox="`${box.x} ${box.y} ${box.w} ${box.h}`"
    fill="none"
    role="img"
    aria-label="Castor"
  >
    <defs>
      <filter id="beaver-head-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="24" />
      </filter>
    </defs>
    <g v-html="head.defs" />
    <ellipse :cx="HEAD_BOX.cx" :cy="HEAD_BOX.cy + 70" rx="330" ry="250" fill="#3a2414" opacity="0.3" filter="url(#beaver-head-soft)" />
    <g stroke="#ffffff" :stroke-width="OUTLINE * 2" stroke-linejoin="round" v-html="head.silhouette" />
    <g v-html="head.content" />
  </svg>
</template>
