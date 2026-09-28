<script setup>
import { ref } from 'vue'
import MainMenu from './components/MainMenu.vue'
import LevelSelect from './components/LevelSelect.vue'
import GameView from './components/GameView.vue'
import ShopView from './components/ShopView.vue'
import NoLivesModal from './components/NoLivesModal.vue'
import ReplayModal from './components/ReplayModal.vue'
import { withLife } from './lives.js'
import { withReplayAd } from './replay.js'
import { useBack } from './services/platform.js'

const screen = ref('menu') // menu | levels | game | shop
const levelIndex = ref(0)

function open(index) {
  levelIndex.value = index
  screen.value = 'game'
}

/** Lance un niveau s'il reste une vie (sinon « Plus de vies »), après une pub si le niveau est déjà réussi. */
function play(index) {
  withLife(() => withReplayAd(index, () => open(index)))
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
  if (Number.isInteger(n) && n >= 0 && new URLSearchParams(location.search).has('play')) open(n)
}
</script>

<template>
  <MainMenu v-if="screen === 'menu'" @play="play" @navigate="screen = $event" />
  <LevelSelect v-else-if="screen === 'levels'" @play="play" @back="screen = 'menu'" />
  <!-- :key force un nouveau jeu Phaser à chaque niveau -->
  <GameView v-else-if="screen === 'game'" :key="levelIndex" :level-index="levelIndex" @play="play" @exit="screen = $event" />
  <ShopView v-else-if="screen === 'shop'" @back="screen = 'menu'" />
  <NoLivesModal />
  <ReplayModal />
</template>
