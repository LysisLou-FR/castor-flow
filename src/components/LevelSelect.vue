<script setup>
import { LEVELS, PALETTE } from '../game/levels.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'

const emit = defineEmits(['play', 'back'])

const levels = LEVELS.map((level, index) => ({
  index,
  name: level.name,
  cols: level.art[0].length,
  pixels: level.art.join('').split('').map((ch) => (ch === '.' ? null : `#${PALETTE[ch].toString(16).padStart(6, '0')}`)),
}))
</script>

<template>
  <main class="screen">
    <header class="topbar">
      <button class="btn btn-small" @click="emit('back')">← Menu</button>
      <NutCounter />
    </header>
    <h2>Niveaux</h2>
    <div class="level-grid">
      <button
        v-for="level in levels"
        :key="level.index"
        class="level-card"
        :disabled="level.index >= save.unlocked"
        @click="emit('play', level.index)"
      >
        <span class="thumb" :style="{ gridTemplateColumns: `repeat(${level.cols}, 1fr)` }" aria-hidden="true">
          <i v-for="(color, i) in level.pixels" :key="i" :style="{ background: color && (level.index < save.unlocked ? color : '#b9a58c') }"></i>
        </span>
        <span class="level-name">{{ level.index + 1 }}. {{ level.index < save.unlocked ? level.name : '🔒' }}</span>
      </button>
    </div>
  </main>
</template>
