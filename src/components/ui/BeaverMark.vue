<script setup>
import { computed } from 'vue'
import {
  BEAVER_FOOT,
  BEAVER_FRONT,
  BEAVER_FRONT_CARRY,
  BEAVER_FRONT_HAPPY,
  BEAVER_PAWS_FRONT,
  BEAVER_RIG,
  BEAVER_VIEW,
  BEAVER_VIEW_CARRY,
  OUTLINE,
  OUTLINE_W,
} from '../../game/art.js'
import IsoBlock from './IsoBlock.vue'

// Le castor du jeu (vue de face), en SVG : mêmes formes que les textures Phaser.
const props = defineProps({
  size: { type: Number, default: 64 }, // largeur
  carry: { type: Number, default: null }, // couleur du cube porté sur la tête, ou null
  happy: { type: Boolean, default: false }, // yeux fermés, tout content
})

const g = BEAVER_RIG
const foot = (f) => ({ x: g.groundX + f.x - 9, y: g.groundY + f.y - 5 })
// IsoBlock : le pied du cube est en (0, unit / 2)
const cube = { x: g.groundX + g.cube.front.x, y: g.groundY + g.cube.front.y - g.cube.size / 2 }

const view = computed(() => (props.carry !== null ? BEAVER_VIEW_CARRY : BEAVER_VIEW))
const layers = computed(() => {
  const body = props.carry !== null ? BEAVER_FRONT_CARRY : props.happy ? BEAVER_FRONT_HAPPY : BEAVER_FRONT
  const list = [
    { shapes: BEAVER_FOOT, ...foot(g.backFoot) },
    { shapes: BEAVER_FOOT, ...foot(g.frontFoot) },
    { shapes: body, x: 0, y: 0 },
  ]
  if (props.carry !== null) list.push('cube', { shapes: BEAVER_PAWS_FRONT, x: 0, y: 0 })
  return list
})
const mat = (s) => (s.m ? `matrix(${s.m.join(' ')})` : undefined) // tracés de l'icône mis à l'échelle
const deg = (s) => `rotate(${((s.rot || 0) * 180) / Math.PI} ${s.cx} ${s.cy})`
</script>

<template>
  <svg
    class="beaver-mark"
    :width="size"
    :height="(size * view.h) / view.w"
    :viewBox="`${view.x} ${view.y} ${view.w} ${view.h}`"
    aria-hidden="true"
  >
    <template v-for="(layer, n) in layers" :key="n">
      <IsoBlock v-if="layer === 'cube'" :color="carry" :unit="g.cube.size" :transform="`translate(${cube.x} ${cube.y})`" />
      <g v-else :transform="`translate(${layer.x} ${layer.y})`">
        <!-- 1er passage (si contour) : silhouette épaissie -->
        <g v-if="OUTLINE_W > 0" :stroke="OUTLINE" :stroke-width="OUTLINE_W" stroke-linejoin="round" :fill="OUTLINE">
          <template v-for="(s, i) in layer.shapes" :key="i">
            <template v-if="s.fill">
              <ellipse v-if="s.t === 'e'" :cx="s.cx" :cy="s.cy" :rx="s.rx" :ry="s.ry" :transform="deg(s)" />
              <rect v-else-if="s.t === 'r'" :x="s.x" :y="s.y" :width="s.w" :height="s.h" :rx="s.r" />
              <path v-else-if="s.t === 'p'" :d="s.d" :transform="mat(s)" />
            </template>
          </template>
        </g>
        <template v-for="(s, i) in layer.shapes" :key="`f${i}`">
          <ellipse v-if="s.t === 'e'" :cx="s.cx" :cy="s.cy" :rx="s.rx" :ry="s.ry" :fill="s.fill" :opacity="s.a ?? 1" :transform="deg(s)" />
          <rect v-else-if="s.t === 'r'" :x="s.x" :y="s.y" :width="s.w" :height="s.h" :rx="s.r" :fill="s.fill" />
          <path
            v-else-if="s.t === 'p'"
            :d="s.d"
            :transform="mat(s)"
            :fill="s.fill || 'none'"
            :stroke="s.stroke"
            :stroke-width="s.w"
            stroke-linecap="round"
          />
          <line v-else :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" :stroke="s.stroke" :stroke-width="s.w" stroke-linecap="round" />
        </template>
      </g>
    </template>
  </svg>
</template>
