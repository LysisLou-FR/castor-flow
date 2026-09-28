<script setup>
import { ref } from 'vue'
import MainMenu from './components/MainMenu.vue'
import LevelSelect from './components/LevelSelect.vue'
import GameView from './components/GameView.vue'
import ShopView from './components/ShopView.vue'
import NoLivesModal from './components/NoLivesModal.vue'
import { withLife } from './lives.js'
import { useBack } from './services/platform.js'

const screen = ref('menu') // menu | levels | game | shop
const levelIndex = ref(0)

/** Lance un niveau s'il reste une vie (sinon la fenêtre « Plus de vies » s'ouvre). */
function play(index) {
  withLife(() => {
    levelIndex.value = index
    screen.value = 'game'
  })
}

// Bouton retour d'Android : niveaux et boutique reviennent au menu (la partie gère le sien)
useBack(() => {
  if (screen.value !== 'levels' && screen.value !== 'shop') return false
  screen.value = 'menu'
  return true
})

// En dev, le bouton « Tester » du map builder ouvre /?play=N pour lancer directement le niveau N
if (import.meta.env.DEV) {
  const n = Number(new URLSearchParams(location.search).get('play'))
  if (Number.isInteger(n) && n >= 0 && new URLSearchParams(location.search).has('play')) play(n)
}
</script>

<template>
  <MainMenu v-if="screen === 'menu'" @play="play" @navigate="screen = $event" />
  <LevelSelect v-else-if="screen === 'levels'" @play="play" @back="screen = 'menu'" />
  <!-- :key force un nouveau jeu Phaser à chaque niveau -->
  <GameView v-else-if="screen === 'game'" :key="levelIndex" :level-index="levelIndex" @play="play" @exit="screen = $event" />
  <ShopView v-else-if="screen === 'shop'" @back="screen = 'menu'" />
  <NoLivesModal />
</template>
