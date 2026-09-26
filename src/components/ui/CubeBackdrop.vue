<script setup>
// Fond de cubes isométriques aux couleurs du jeu (comme l'icône de l'appli), qui dérive lentement.
// Un motif de 4 × 4 cubes aux couleurs tirées au hasard est répété : les cubes qui débordent d'un bord
// sont redessinés de l'autre côté avec la même couleur, pour un raccord invisible.
import { hex, shade } from '../../game/art.js'
import { PALETTE } from '../../game/levels.js'

const props = defineProps({ cube: { type: Number, default: 64 } }) // largeur d'un cube, en px

const COLS = 4
const ROWS = 4 // pair : les rangées décalées se raccordent
const COLORS = ['R', 'O', 'Y', 'G', 'B', 'P'].map((k) => PALETTE[k])

const w = props.cube
const top = w / 2
const h = w * 0.5625
const stepY = top / 2 + h
const tileW = COLS * w
const tileH = ROWS * stepY

let seed = 11
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
// Répartition équilibrée : chaque couleur revient au moins deux fois dans le motif, dans un ordre mélangé
const bag = Array.from({ length: ROWS * COLS }, (_, i) => COLORS[i % COLORS.length])
for (let i = bag.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1))
  ;[bag[i], bag[j]] = [bag[j], bag[i]]
}
const colors = Array.from({ length: ROWS }, (_, r) => bag.slice(r * COLS, (r + 1) * COLS))

let shapes = ''
for (let row = -1; row <= ROWS; row++) {
  for (let col = -1; col <= COLS; col++) {
    const c = colors[(row + ROWS) % ROWS][(col + COLS) % COLS]
    const x = col * w + (((row % 2) + 2) % 2) * (w / 2) - w / 2
    const y = row * stepY - top / 2
    const p = (dx, dy) => `${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`
    shapes += `<polygon points="${p(w / 2, top)} ${p(w, top / 2)} ${p(w, top / 2 + h)} ${p(w / 2, top + h)}" fill="${hex(c)}"/>`
    shapes += `<polygon points="${p(0, top / 2)} ${p(w / 2, top)} ${p(w / 2, top + h)} ${p(0, top / 2 + h)}" fill="${hex(shade(c, -0.22))}"/>`
    shapes += `<polygon points="${p(w / 2, 0)} ${p(w, top / 2)} ${p(w / 2, top)} ${p(0, top / 2)}" fill="${hex(shade(c, 0.3))}"/>`
  }
}
const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}" viewBox="0 0 ${tileW} ${tileH}">${shapes}</svg>`
const style = {
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
  backgroundSize: `${tileW}px ${tileH}px`,
  '--tile-w': `${tileW}px`,
  '--tile-h': `${tileH}px`,
}
</script>

<template>
  <div class="cube-backdrop" :style="style" aria-hidden="true"></div>
</template>
