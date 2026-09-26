<script setup>
import { LEVELS } from '../game/levels.js'
import { privacyOptionsRequired, showPrivacyOptions } from '../services/ads.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'

const emit = defineEmits(['play', 'navigate'])

function continueGame() {
  emit('play', Math.min(save.unlocked, LEVELS.length) - 1)
}
</script>

<template>
  <main class="screen menu">
    <header class="topbar">
      <span></span>
      <NutCounter />
    </header>
    <div class="hero">
      <div class="logo" aria-hidden="true">🦫</div>
      <h1>Castor Flow</h1>
      <p>Envoie tes équipes de castors construire le dessin, bloc par bloc.</p>
    </div>
    <nav class="stack">
      <button class="btn btn-primary btn-big" @click="continueGame">Jouer · niveau {{ Math.min(save.unlocked, LEVELS.length) }}</button>
      <button class="btn" @click="emit('navigate', 'levels')">Niveaux</button>
      <button class="btn" @click="emit('navigate', 'shop')">Boutique</button>
      <button v-if="privacyOptionsRequired" class="btn btn-ghost" @click="showPrivacyOptions">Confidentialité et publicités</button>
    </nav>
  </main>
</template>
