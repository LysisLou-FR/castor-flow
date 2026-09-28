<script setup>
import { computed } from 'vue'
import { BEAVER_FULL, BEAVER_RIG, BEAVER_VIEW, BEAVER_VIEW_CARRY } from '../../game/beaverArt.js'
import IsoBlock from './IsoBlock.vue'

// Le castor du jeu (ton dessin assets/castor.svg), avec en option un cube tenu dans ses pattes.
const props = defineProps({
  size: { type: Number, default: 64 }, // largeur
  carry: { type: Number, default: null }, // couleur du cube tenu dans les pattes, ou null
})

const g = BEAVER_RIG
// IsoBlock : le pied du cube est en (0, unit / 2)
const cube = { x: g.groundX + g.cube.front.x, y: g.groundY + g.cube.front.y - g.cube.size / 2 }
const view = computed(() => (props.carry !== null ? BEAVER_VIEW_CARRY : BEAVER_VIEW))
</script>

<template>
  <svg
    class="beaver-mark"
    :width="size"
    :height="(size * view.h) / view.w"
    :viewBox="`${view.x} ${view.y} ${view.w} ${view.h}`"
    fill="none"
    aria-hidden="true"
  >
    <g v-html="BEAVER_FULL.defs" />
    <g v-if="carry === null" :transform="BEAVER_FULL.m" v-html="BEAVER_FULL.whole" />
    <template v-else>
      <!-- corps, cube tenu, patte droite, tête (par-dessus la patte droite), patte gauche -->
      <g :transform="BEAVER_FULL.m" v-html="BEAVER_FULL.body" />
      <IsoBlock :color="carry" :unit="g.cube.size" :transform="`translate(${cube.x} ${cube.y})`" />
      <g :transform="BEAVER_FULL.m" v-html="BEAVER_FULL.pawRight" />
      <g :transform="BEAVER_FULL.m" v-html="BEAVER_FULL.head" />
      <g :transform="BEAVER_FULL.m" v-html="BEAVER_FULL.pawLeft" />
    </template>
  </svg>
</template>
