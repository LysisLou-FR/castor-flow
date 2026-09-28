<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DIFFICULTIES, LEVELS } from '../game/levels.js'
import { parseLevel } from '../game/logic.js'
import { hex } from '../game/art.js'
import { createGame } from '../game/createGame.js'
import * as sfx from '../game/sfx.js'
import { endAttempt, startAttempt, withLife } from '../lives.js'
import { maybeShowInterstitial, showRewarded } from '../services/ads.js'
import { withReplayAd } from '../replay.js'
import { track } from '../stats.js'
import { onAppPause, useBack } from '../services/platform.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'
import AcornIcon from './ui/AcornIcon.vue'
import BeaverMark from './ui/BeaverMark.vue'
import Icon from './ui/Icon.vue'
import IsoCube from './ui/IsoCube.vue'

const props = defineProps({ levelIndex: { type: Number, required: true } })
const emit = defineEmits(['play', 'exit'])

const SLOT_PRICE = 90 // prix en noisettes d'une place de chantier supplémentaire
const HINT_PRICE = 40 // prix en noisettes du bonus « Indice »
const HINT_MS = 6000 // durée de l'indice
const DECK_VISIBLE = 3
const level = LEVELS[props.levelIndex]
const parsed = parseLevel(level)
const isLast = props.levelIndex === LEVELS.length - 1
const difficulty = DIFFICULTIES[level.difficulty] ?? DIFFICULTIES.normal

const stage = ref(null)
const state = reactive({ lanes: [], slots: [], progress: 0, status: 'playing' })
const reward = ref(0)
const replayed = ref(false) // niveau déjà réussi auparavant : pas de récompense
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

// ---------- Tutoriel des premiers niveaux (champ `tutorial` du niveau) ----------
const TUTORIAL = {
  send: { text: 'Touche une équipe de castors pour l’envoyer construire le dessin.', at: 'bottom', hand: 'lane' },
  column: {
    text: 'Un bloc ne peut reposer que sur un autre bloc ou sur une fondation (le sol ou un échafaudage) : les castors construisent chaque colonne de bas en haut.',
    at: 'top',
    ok: true,
  },
  slots: {
    text: 'Le chantier n’a que 3 places. Si elles sont toutes prises par des équipes qui attendent, il est bloqué !',
    at: 'top',
    ok: true,
  },
  hint: {
    text: 'Tu ne sais plus quoi envoyer ? L’ampoule illumine les cases accessibles. La première est offerte !',
    at: 'top',
    ok: true,
    hand: 'hint',
  },
}
const coach = ref(null) // bulle d'aide affichée : { text, at: 'top' | 'bottom', ok, hand }
let coachTimer = 0
let waitExplained = false

function showCoach(tip, ms = 0) {
  clearTimeout(coachTimer)
  coach.value = tip
  if (ms) coachTimer = setTimeout(() => (coach.value = null), ms)
}

// niveau 2 : la première fois qu'une équipe attend, on explique pourquoi
watch(
  () => state.slots.some((crew) => crew?.waiting),
  (waiting) => {
    if (!waiting || level.tutorial !== 'column' || waitExplained) return
    waitExplained = true
    showCoach({ text: 'Cette équipe attend : aucune case de sa couleur n’est accessible. Elle repartira dès qu’une case se libère.', at: 'top' }, 5000)
  },
)

function start() {
  game?.destroy()
  won.value = false
  waitExplained = false
  showCoach(TUTORIAL[level.tutorial] ?? null)
  game = createGame(stage.value, { level, levelIndex: props.levelIndex, parsed, state, onWin, onLose() {} })
}

function send(l) {
  if (game.sendLane(l)) {
    if (!save.attempt) track(level.name, 'plays')
    startAttempt() // la partie compte : la rater coûtera une vie
    if (coach.value?.hand === 'lane') {
      showCoach({ text: 'Bravo ! Chaque castor pose un cube de sa couleur. Envoie les équipes jusqu’à finir le dessin.', at: 'top' }, 4500)
    }
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
  // hard × 2, super hard × 3 ; rejouer un niveau déjà réussi ne rapporte rien
  const firstWin = !save.stats[level.name]?.wins
  replayed.value = !firstWin
  reward.value = firstWin ? (20 + props.levelIndex * 2) * difficulty.reward : 0
  save.nuts += reward.value
  save.wins++
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, props.levelIndex + 2))
  track(level.name, 'wins')
  won.value = true
  if (reward.value) sfx.coin()
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
  if (coach.value?.hand === 'hint') showCoach(null)
  track(level.name, 'hints')
  game.showHint(HINT_MS)
}

function payHint() {
  if (save.freeHints > 0) save.freeHints-- // le premier indice est offert
  else if (save.nuts >= HINT_PRICE) save.nuts -= HINT_PRICE
  else return
  hint()
}

function addSlot() {
  track(level.name, 'slots')
  game.addSlot()
}

function payWithNuts() {
  if (save.nuts < SLOT_PRICE) return
  save.nuts -= SLOT_PRICE
  addSlot()
}

/**
 * Rejouer, ou recommencer après un blocage (le niveau est alors raté : une vie de moins).
 * Un niveau déjà réussi ne se rejoue qu'après une pub.
 */
function retry() {
  if (endAttempt(false)) track(level.name, 'fails')
  withLife(() => withReplayAd(props.levelIndex, start))
}

/** Quitter en pleine partie, c'est rater le niveau : on demande confirmation. */
function quit() {
  if (save.attempt && !won.value && state.status === 'playing') askQuit.value = true
  else giveUp()
}

function giveUp() {
  if (endAttempt(false)) track(level.name, 'fails')
  emit('exit', 'levels')
}

async function next() {
  await maybeShowInterstitial()
  if (isLast) emit('exit', 'levels')
  else emit('play', props.levelIndex + 1)
}

// Bouton retour d'Android : ferme la fenêtre ouverte, sinon demande avant d'abandonner
useBack(() => {
  if (askHint.value) askHint.value = false
  else if (askQuit.value) askQuit.value = false
  else if (won.value) emit('exit', 'levels')
  else if (state.status === 'playing') quit()
  // chantier bloqué : il faut choisir dans la fenêtre
  return true
})

// arrière-plan : la partie se fige (castors, minuteries, indice)
const offPause = onAppPause((paused) => game?.setPaused(paused))

onMounted(start)
onBeforeUnmount(() => {
  offPause()
  game?.destroy()
})
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
        <span v-if="save.freeHints > 0" class="hint-price">offert</span>
        <span v-else class="hint-price"><AcornIcon :size="13" />{{ HINT_PRICE }}</span>
      </button>
      <span v-if="coach?.hand === 'hint' && state.status === 'playing'" class="coach-hand hint-hand" aria-hidden="true">👉</span>

      <Transition name="fade">
        <div v-if="coach && state.status === 'playing'" class="coach glass" :class="coach.at" role="status">
          <p>{{ coach.text }}</p>
          <button v-if="coach.ok" class="btn btn-primary btn-small" @click="showCoach(null)">Compris</button>
        </div>
      </Transition>

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
          <span v-if="l === 0 && coach?.hand === 'lane' && lane.length" class="coach-hand" aria-hidden="true">👆</span>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="won" class="modal-backdrop">
        <section class="modal" role="dialog" aria-labelledby="win-title">
          <div class="modal-art"><BeaverMark :size="96" /></div>
          <h2 id="win-title">Chef-d’œuvre&nbsp;!</h2>
          <p>« {{ level.name }} » est construit, bloc par bloc.</p>
          <p v-if="replayed" class="diff-note">Niveau déjà réussi : pas de récompense</p>
          <p v-else-if="difficulty.reward > 1" class="diff-note">Niveau {{ difficulty.label }} : récompense × {{ difficulty.reward }}</p>
          <p v-if="reward" class="reward pill"><AcornIcon :size="22" /> + {{ reward }}</p>
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
          <h2 id="hint-title">Besoin d’un indice&nbsp;?</h2>
          <p>Les cases que tes castors peuvent construire s’illuminent pendant {{ HINT_MS / 1000 }} secondes.</p>
          <div class="stack">
            <button v-if="save.freeHints > 0" class="btn btn-primary" @click="payHint">Utiliser · offert</button>
            <button v-else class="btn btn-primary" :disabled="save.nuts < HINT_PRICE" @click="payHint">
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
            <button class="btn btn-primary" :disabled="adLoading" @click="watchAd(addSlot)">
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
          <h2 id="quit-title">Abandonner le niveau&nbsp;?</h2>
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
