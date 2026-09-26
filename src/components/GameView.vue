<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { LEVELS } from '../game/levels.js'
import { createGame } from '../game/createGame.js'
import { maybeShowInterstitial, showRewarded } from '../services/ads.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'

const props = defineProps({ levelIndex: { type: Number, required: true } })
const emit = defineEmits(['play', 'exit'])

const SLOT_PRICE = 30 // prix en noisettes d'une place de chantier supplémentaire
const level = LEVELS[props.levelIndex]
const isLast = props.levelIndex === LEVELS.length - 1

const stage = ref(null)
const progress = ref(0)
const status = ref('playing') // playing | won | stuck
const reward = ref(0)
const adLoading = ref(false)
let game = null

function start() {
  game?.destroy()
  progress.value = 0
  status.value = 'playing'
  game = createGame(stage.value, {
    level,
    levelIndex: props.levelIndex,
    onProgress: (p) => (progress.value = p),
    onWin,
    onLose: () => (status.value = 'stuck'),
  })
}

function onWin() {
  reward.value = 10 + props.levelIndex * 5
  save.nuts += reward.value
  save.wins++
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, props.levelIndex + 2))
  status.value = 'won'
}

function continueWithExtraSlot() {
  status.value = 'playing'
  game.addSlot()
}

async function watchAd() {
  adLoading.value = true
  const rewarded = await showRewarded()
  adLoading.value = false
  if (rewarded) continueWithExtraSlot()
}

function payWithNuts() {
  if (save.nuts < SLOT_PRICE) return
  save.nuts -= SLOT_PRICE
  continueWithExtraSlot()
}

async function next() {
  await maybeShowInterstitial()
  if (isLast) emit('exit', 'levels')
  else emit('play', props.levelIndex + 1)
}

onMounted(start)
onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <main class="game-view">
    <header class="topbar">
      <button class="btn btn-small" @click="emit('exit', 'levels')">←</button>
      <div class="level-info">
        <strong>{{ levelIndex + 1 }}. {{ level.name }}</strong>
        <span class="progress" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100">
          <span :style="{ width: `${progress * 100}%` }"></span>
        </span>
      </div>
      <NutCounter />
    </header>

    <div ref="stage" class="stage"></div>

    <div v-if="status === 'won'" class="modal-backdrop">
      <section class="modal">
        <div class="modal-emoji">🎉</div>
        <h2>Bravo, chef de chantier !</h2>
        <p>« {{ level.name }} » est construit. Tu gagnes <strong>🌰 {{ reward }}</strong>.</p>
        <div class="stack">
          <button class="btn btn-primary" @click="next">{{ isLast ? 'Voir les niveaux' : 'Niveau suivant' }}</button>
          <button class="btn" @click="start">Rejouer</button>
        </div>
      </section>
    </div>

    <div v-if="status === 'stuck'" class="modal-backdrop">
      <section class="modal">
        <div class="modal-emoji">🚧</div>
        <h2>Chantier bloqué !</h2>
        <p>Plus aucune équipe ne peut construire. Ajoute une place au chantier pour continuer.</p>
        <div class="stack">
          <button class="btn btn-primary" :disabled="adLoading" @click="watchAd">
            {{ adLoading ? 'Chargement…' : '▶ Regarder une pub : +1 place' }}
          </button>
          <button class="btn" :disabled="save.nuts < SLOT_PRICE" @click="payWithNuts">🌰 {{ SLOT_PRICE }} : +1 place</button>
          <button class="btn btn-ghost" @click="start">Recommencer</button>
        </div>
      </section>
    </div>
  </main>
</template>
