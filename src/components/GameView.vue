<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DIFFICULTIES, LEVELS } from '../game/levels.js'
import { parseLevel } from '../game/logic.js'
import { hex } from '../game/art.js'
import { createGame } from '../game/createGame.js'
import * as sfx from '../game/sfx.js'
import { endAttempt, startAttempt, withLife } from '../lives.js'
import { maybeShowInterstitial, showRewarded } from '../services/ads.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'
import AcornIcon from './ui/AcornIcon.vue'
import BeaverMark from './ui/BeaverMark.vue'
import Icon from './ui/Icon.vue'
import IsoCube from './ui/IsoCube.vue'

const props = defineProps({ levelIndex: { type: Number, required: true } })
const emit = defineEmits(['play', 'exit'])

const SLOT_PRICE = 30 // prix en noisettes d'une place de chantier supplémentaire
const HINT_PRICE = 15 // prix en noisettes du bonus « Indice »
const HINT_MS = 6000 // durée de l'indice
const DECK_VISIBLE = 3
const level = LEVELS[props.levelIndex]
const parsed = parseLevel(level)
const isLast = props.levelIndex === LEVELS.length - 1
const difficulty = DIFFICULTIES[level.difficulty] ?? DIFFICULTIES.normal

const stage = ref(null)
const state = reactive({ lanes: [], slots: [], progress: 0, status: 'playing' })
const reward = ref(0)
const won = ref(false) // affiché après la célébration, pas dès le dernier bloc
const adLoading = ref(false)
const toast = ref('')
const shaking = ref(-1)
const askHint = ref(false)
const askQuit = ref(false)
let game = null

// dernier bloc posé : le niveau est réussi, même si le joueur quitte pendant la célébration
watch(
  () => state.status,
  (status) => status === 'won' && endAttempt(true),
)
let toastTimer = 0

const color = (crew) => parsed.colors[crew.color]
const percent = computed(() => Math.round(state.progress * 100))

function start() {
  game?.destroy()
  won.value = false
  game = createGame(stage.value, { level, levelIndex: props.levelIndex, parsed, state, onWin, onLose() {} })
}

function send(l) {
  if (game.sendLane(l)) {
    startAttempt() // la partie compte : la rater coûtera une vie
    return sfx.send()
  }
  if (state.status !== 'playing') return
  sfx.refuse()
  shaking.value = l
  setTimeout(() => (shaking.value = -1), 400)
  showToast('Chantier plein ! Attends qu’une place se libère.')
}

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

function onWin() {
  reward.value = (10 + props.levelIndex * 5) * difficulty.reward // hard × 2, super hard × 3
  save.nuts += reward.value
  save.wins++
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, props.levelIndex + 2))
  won.value = true
  sfx.coin()
}

/** Pub récompensée : `reward` n'est appelé que si la vidéo a été regardée jusqu'au bout. */
async function watchAd(reward) {
  adLoading.value = true
  const rewarded = await showRewarded()
  adLoading.value = false
  if (rewarded) reward()
}

function hint() {
  askHint.value = false
  game.showHint(HINT_MS)
}

function payHint() {
  if (save.nuts < HINT_PRICE) return
  save.nuts -= HINT_PRICE
  hint()
}

function payWithNuts() {
  if (save.nuts < SLOT_PRICE) return
  save.nuts -= SLOT_PRICE
  game.addSlot()
}

/** Rejouer, ou recommencer après un blocage (le niveau est alors raté : une vie de moins). */
function retry() {
  endAttempt(false)
  withLife(start)
}

/** Quitter en pleine partie, c'est rater le niveau : on demande confirmation. */
function quit() {
  if (save.attempt && !won.value && state.status === 'playing') askQuit.value = true
  else giveUp()
}

function giveUp() {
  endAttempt(false)
  emit('exit', 'levels')
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
    <section class="stage-wrap">
      <div class="sky" aria-hidden="true"><i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i></div>
      <div ref="stage" class="stage"></div>

      <header class="hud">
        <button class="icon-btn glass" aria-label="Retour aux niveaux" @click="quit">
          <Icon name="back" />
        </button>
        <div class="hud-level glass">
          <div class="hud-title">
            <span class="hud-num">{{ levelIndex + 1 }}</span>
            <strong>{{ level.name }}</strong>
            <span v-if="level.difficulty !== 'normal'" class="diff-badge" :class="level.difficulty">{{ difficulty.label }}</span>
            <span class="hud-pct">{{ percent }} %</span>
          </div>
          <div class="bar" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${percent}%` }"></span>
          </div>
        </div>
        <NutCounter class="glass" />
      </header>

      <button
        v-if="state.status === 'playing'"
        class="hint-btn glass"
        :class="{ active: state.hint }"
        :disabled="state.hint"
        aria-label="Indice"
        @click="askHint = true"
      >
        <Icon name="bulb" :size="24" />
        <span class="hint-price"><AcornIcon :size="13" />{{ HINT_PRICE }}</span>
      </button>

      <Transition name="toast">
        <p v-if="toast" class="toast" role="status">{{ toast }}</p>
      </Transition>
    </section>

    <section class="sheet">
      <div class="sheet-head">
        <h2>Chantier</h2>
        <span class="muted">{{ state.slots.filter(Boolean).length }} / {{ state.slots.length }} équipes</span>
      </div>
      <div class="slots" :style="{ gridTemplateColumns: `repeat(${state.slots.length}, 1fr)` }">
        <div v-for="(crew, s) in state.slots" :key="s" class="slot" :class="{ filled: crew, waiting: crew?.waiting }">
          <Transition name="pop" mode="out-in">
            <div v-if="crew" :key="crew.id" class="slot-crew" :style="{ '--c': hex(color(crew)) }">
              <IsoCube :color="color(crew)" :size="26" />
              <strong>{{ crew.remaining }}</strong>
              <Icon v-if="crew.waiting" class="slot-wait" name="wait" :size="14" />
              <span class="dots" aria-hidden="true">
                <i v-for="n in crew.count" :key="n" :class="{ gone: n > crew.remaining }"></i>
              </span>
            </div>
          </Transition>
        </div>
      </div>

      <div class="sheet-head">
        <h2>Équipes de castors</h2>
        <span class="muted">touche pour envoyer</span>
      </div>
      <div class="lanes" :style="{ gridTemplateColumns: `repeat(${state.lanes.length}, 1fr)` }">
        <div v-for="(lane, l) in state.lanes" :key="l" class="deck" :class="{ shake: shaking === l }">
          <TransitionGroup name="deck">
            <button
              v-for="(crew, j) in lane.slice(0, DECK_VISIBLE)"
              :key="crew.id"
              class="crew-card"
              :class="{ front: j === 0 }"
              :style="{ '--c': hex(color(crew)), '--j': j, zIndex: DECK_VISIBLE - j }"
              :disabled="j > 0 || state.status !== 'playing'"
              :aria-label="`Envoyer ${crew.count} castors`"
              @click="send(l)"
            >
              <BeaverMark :size="42" :carry="color(crew)" />
              <span class="crew-count">×{{ crew.count }}</span>
            </button>
          </TransitionGroup>
          <span v-if="lane.length > DECK_VISIBLE" class="deck-more">+{{ lane.length - DECK_VISIBLE }}</span>
          <span v-if="!lane.length" class="deck-empty"><Icon name="check" :size="18" /></span>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="won" class="modal-backdrop">
        <section class="modal" role="dialog" aria-labelledby="win-title">
          <div class="modal-art"><BeaverMark :size="96" happy /></div>
          <h2 id="win-title">Chef-d’œuvre !</h2>
          <p>« {{ level.name }} » est construit, bloc par bloc.</p>
          <p v-if="difficulty.reward > 1" class="diff-note">Niveau {{ difficulty.label }} : récompense × {{ difficulty.reward }}</p>
          <p class="reward pill"><AcornIcon :size="22" /> + {{ reward }}</p>
          <div class="stack">
            <button class="btn btn-primary" @click="next">{{ isLast ? 'Voir les niveaux' : 'Niveau suivant' }}</button>
            <button class="btn btn-soft" @click="retry"><Icon name="restart" :size="18" /> Rejouer</button>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="askHint && state.status === 'playing'" class="modal-backdrop" @click.self="askHint = false">
        <section class="modal" role="dialog" aria-labelledby="hint-title">
          <div class="modal-art hint"><Icon name="bulb" :size="56" /></div>
          <h2 id="hint-title">Besoin d’un indice ?</h2>
          <p>Les cases que tes castors peuvent construire s’illuminent pendant {{ HINT_MS / 1000 }} secondes.</p>
          <div class="stack">
            <button class="btn btn-primary" :disabled="save.nuts < HINT_PRICE" @click="payHint">
              <AcornIcon :size="20" /> {{ HINT_PRICE }} · Utiliser
            </button>
            <button class="btn btn-soft" :disabled="adLoading" @click="watchAd(hint)">
              <Icon name="video" :size="20" /> {{ adLoading ? 'Chargement…' : 'Regarder une pub' }}
            </button>
            <button class="btn btn-link" @click="askHint = false">Plus tard</button>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="state.status === 'stuck'" class="modal-backdrop">
        <section class="modal" role="dialog" aria-labelledby="stuck-title">
          <div class="modal-art stuck"><BeaverMark :size="88" /></div>
          <h2 id="stuck-title">Chantier bloqué</h2>
          <p>Aucune équipe du chantier ne peut construire. Ajoute une place pour continuer.</p>
          <div class="stack">
            <button class="btn btn-primary" :disabled="adLoading" @click="watchAd(() => game.addSlot())">
              <Icon name="video" :size="20" /> {{ adLoading ? 'Chargement…' : 'Regarder une pub · +1 place' }}
            </button>
            <button class="btn btn-soft" :disabled="save.nuts < SLOT_PRICE" @click="payWithNuts">
              <AcornIcon :size="20" /> {{ SLOT_PRICE }} · +1 place
            </button>
            <div class="lose-actions">
              <button class="btn btn-link" @click="retry">Recommencer</button>
              <button class="btn btn-link" @click="giveUp">Quitter</button>
            </div>
            <p class="lose-note"><Icon name="heart" :size="15" /> Recommencer ou quitter coûte 1 vie (tu en as {{ save.lives }})</p>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="askQuit" class="modal-backdrop" @click.self="askQuit = false">
        <section class="modal" role="dialog" aria-labelledby="quit-title">
          <div class="modal-art lives"><Icon name="heart" :size="56" /></div>
          <h2 id="quit-title">Abandonner le niveau ?</h2>
          <p>Tu perdras une vie (il t’en reste {{ save.lives }}).</p>
          <div class="stack">
            <button class="btn btn-primary" @click="askQuit = false">Continuer à jouer</button>
            <button class="btn btn-soft" @click="giveUp">Abandonner · −1 vie</button>
          </div>
        </section>
      </div>
    </Transition>
  </main>
</template>
