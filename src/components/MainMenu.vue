<script setup>
import { computed, ref } from 'vue'
import { LEVELS } from '../game/levels.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'
import SettingsModal from './SettingsModal.vue'
import BeaverHead from './ui/BeaverHead.vue'
import CubeBackdrop from './ui/CubeBackdrop.vue'
import Icon from './ui/Icon.vue'

const emit = defineEmits(['play', 'navigate'])
const current = computed(() => Math.min(save.unlocked, LEVELS.length) - 1)
const settings = ref(false)
</script>

<template>
  <main class="screen menu">
    <!-- même concept que l'icône de l'appli : la tête du castor sur un fond de cubes -->
    <CubeBackdrop class="menu-backdrop" />
    <header class="topbar">
      <button class="icon-btn glass" aria-label="Paramètres" @click="settings = true"><Icon name="gear" /></button>
      <NutCounter class="glass" />
    </header>

    <section class="hero">
      <BeaverHead class="hero-head" :size="240" />
      <h1>Cubi<span>ver</span></h1>
      <p class="glass">Envoie tes équipes de castors construire le dessin, un bloc chacun.</p>
    </section>

    <nav class="menu-actions">
      <button class="btn btn-primary btn-hero" @click="emit('play', current)">
        <Icon name="play" :size="26" />
        <span class="btn-stack">
          <strong>Jouer</strong>
          <small>Niveau {{ current + 1 }} · {{ LEVELS[current].name }}</small>
        </span>
      </button>
      <div class="menu-row">
        <button class="tile glass" @click="emit('navigate', 'levels')"><Icon name="grid" /> Niveaux</button>
        <button class="tile glass" @click="emit('navigate', 'shop')"><Icon name="bag" /> Boutique</button>
      </div>
    </nav>

    <Teleport to="body">
      <Transition name="fade">
        <SettingsModal v-if="settings" @close="settings = false" />
      </Transition>
    </Teleport>
  </main>
</template>
