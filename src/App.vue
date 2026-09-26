<script setup>
import { ref } from 'vue'
import MainMenu from './components/MainMenu.vue'
import LevelSelect from './components/LevelSelect.vue'
import GameView from './components/GameView.vue'
import ShopView from './components/ShopView.vue'

const screen = ref('menu') // menu | levels | game | shop
const levelIndex = ref(0)

function play(index) {
  levelIndex.value = index
  screen.value = 'game'
}
</script>

<template>
  <MainMenu v-if="screen === 'menu'" @play="play" @navigate="screen = $event" />
  <LevelSelect v-else-if="screen === 'levels'" @play="play" @back="screen = 'menu'" />
  <!-- :key force un nouveau jeu Phaser à chaque niveau -->
  <GameView v-else-if="screen === 'game'" :key="levelIndex" :level-index="levelIndex" @play="play" @exit="screen = $event" />
  <ShopView v-else-if="screen === 'shop'" @back="screen = 'menu'" />
</template>
