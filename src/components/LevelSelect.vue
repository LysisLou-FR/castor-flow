<script setup>
import { DIFFICULTIES, LEVELS, PALETTE } from '../game/levels.js'
import { hex } from '../game/art.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'
import Icon from './ui/Icon.vue'

const emit = defineEmits(['play', 'back'])

const levels = LEVELS.map((level, index) => ({
  index,
  name: level.name,
  difficulty: level.difficulty,
  cols: level.art[0].length,
  size: `${level.art[0].length}×${level.art.length}`,
  pixels: level.art.join('').split('').map((ch) => (ch === '.' ? null : hex(PALETTE[ch]))),
}))
</script>

<template>
  <main class="screen">
    <div class="sky" aria-hidden="true"><i class="cloud c1"></i><i class="cloud c2"></i></div>
    <header class="topbar">
      <button class="icon-btn glass" aria-label="Retour au menu" @click="emit('back')"><Icon name="back" /></button>
      <h1 class="page-title">Niveaux</h1>
      <NutCounter class="glass" />
    </header>

    <div class="level-grid">
      <button
        v-for="level in levels"
        :key="level.index"
        class="level-card glass"
        :class="{ locked: level.index >= save.unlocked, current: level.index === save.unlocked - 1 }"
        :disabled="level.index >= save.unlocked"
        @click="emit('play', level.index)"
      >
        <span class="thumb" :style="{ gridTemplateColumns: `repeat(${level.cols}, 1fr)` }" aria-hidden="true">
          <i v-for="(color, i) in level.pixels" :key="i" :style="{ background: color }"></i>
        </span>
        <span class="level-meta">
          <strong>{{ level.index + 1 }}. {{ level.index < save.unlocked ? level.name : '???' }}</strong>
          <small>{{ level.size }}</small>
          <span v-if="level.difficulty !== 'normal'" class="diff-badge" :class="level.difficulty">{{ DIFFICULTIES[level.difficulty].label }}</span>
        </span>
        <span v-if="level.index >= save.unlocked" class="badge lock"><Icon name="lock" :size="15" /></span>
        <span v-else-if="level.index < save.unlocked - 1" class="badge ok"><Icon name="check" :size="15" /></span>
        <span v-else class="badge now">À jouer</span>
      </button>
    </div>
  </main>
</template>
