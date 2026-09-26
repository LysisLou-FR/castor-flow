<script>
let uid = 0 // identifiants uniques pour les dégradés SVG de chaque cube
</script>

<script setup>
import { computed } from 'vue'
import { CUBE_TEX, hex, shade } from '../../game/art.js'

// Un cube isométrique stylisé, à placer dans un <svg>. Même géométrie que les cubes du jeu.
const props = defineProps({
  color: { type: Number, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  z: { type: Number, default: 0 },
  unit: { type: Number, default: 64 }, // largeur d'une tuile en unités SVG
})

const id = `iso-block-${++uid}`

const g = computed(() => {
  const W = props.unit
  const H = (W * CUBE_TEX.h) / CUBE_TEX.w
  const P = (gx, gy, gz) => [(gx - gy) * (W / 2), (gx + gy) * (W / 4) - gz * H]
  const { x, y, z } = props
  const T = P(x, y, z + 1)
  const R = P(x + 1, y, z + 1)
  const B = P(x + 1, y + 1, z + 1)
  const L = P(x, y + 1, z + 1)
  const Rd = P(x + 1, y, z)
  const Bd = P(x + 1, y + 1, z)
  const Ld = P(x, y + 1, z)
  const pts = (...list) => list.map((p) => p.join(',')).join(' ')
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const C = mix(T, B, 0.5)
  const inset = (p) => mix(C, p, 0.72)
  const bevel = W * 0.07 // épaisseur du biseau lumineux sous les arêtes du dessus
  const down = (p) => [p[0], p[1] + bevel]
  const spark = mix(C, mix(T, L, 0.5), 0.55) // petit reflet vers l'arrière-gauche du dessus
  return {
    top: pts(T, R, B, L),
    right: pts(B, R, Rd, Bd),
    left: pts(L, B, Bd, Ld),
    outline: pts(T, R, Rd, Bd, Ld, L),
    shine: pts(inset(T), inset(R), inset(B), inset(L)),
    bevelRight: pts(B, R, down(R), down(B)),
    bevelLeft: pts(L, B, down(B), down(L)),
    spark: { cx: spark[0], cy: spark[1], r: W * 0.045 },
    stroke: W * 0.03,
  }
})

const c = computed(() => ({
  topA: hex(shade(props.color, 0.45)),
  topB: hex(shade(props.color, 0.2)),
  rightA: hex(shade(props.color, 0.08)),
  rightB: hex(shade(props.color, -0.14)),
  leftA: hex(shade(props.color, -0.16)),
  leftB: hex(shade(props.color, -0.38)),
  bevel: hex(shade(props.color, 0.35)),
}))
</script>

<template>
  <g class="iso-block">
    <defs>
      <linearGradient :id="`${id}-t`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="c.topA" />
        <stop offset="1" :stop-color="c.topB" />
      </linearGradient>
      <linearGradient :id="`${id}-r`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="c.rightA" />
        <stop offset="1" :stop-color="c.rightB" />
      </linearGradient>
      <linearGradient :id="`${id}-l`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="c.leftA" />
        <stop offset="1" :stop-color="c.leftB" />
      </linearGradient>
    </defs>
    <!-- chaque face est tracée avec sa propre couleur en contour arrondi : coins adoucis -->
    <polygon :points="g.right" :fill="`url(#${id}-r)`" :stroke="c.rightB" :stroke-width="g.stroke" stroke-linejoin="round" />
    <polygon :points="g.left" :fill="`url(#${id}-l)`" :stroke="c.leftB" :stroke-width="g.stroke" stroke-linejoin="round" />
    <polygon :points="g.top" :fill="`url(#${id}-t)`" :stroke="c.topB" :stroke-width="g.stroke" stroke-linejoin="round" />
    <polygon :points="g.bevelRight" :fill="c.bevel" opacity="0.55" />
    <polygon :points="g.bevelLeft" :fill="c.bevel" opacity="0.3" />
    <polygon :points="g.shine" fill="none" stroke="#fff" :stroke-width="g.stroke * 1.2" stroke-linejoin="round" opacity="0.55" />
    <circle :cx="g.spark.cx" :cy="g.spark.cy" :r="g.spark.r" fill="#fff" opacity="0.85" />
    <polygon :points="g.outline" fill="none" stroke="#1f2b47" :stroke-width="g.stroke * 0.9" stroke-linejoin="round" opacity="0.28" />
  </g>
</template>
