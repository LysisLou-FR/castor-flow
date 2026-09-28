import { computed, ref } from 'vue'
import { save } from './store.js'

// Vies : on en perd une quand on rate un niveau (abandon après avoir envoyé au moins une équipe).
// Gagner ne coûte rien. Sans vie, on ne peut plus lancer de niveau : attendre, regarder une pub ou payer.
export const MAX_LIVES = 5
export const REGEN_MS = 20 * 60 * 1000 // une vie revient toutes les 20 minutes, jusqu'à MAX_LIVES
export const AD_LIVES = 1 // vies gagnées avec une pub récompensée
export const NUTS_LIVES = 5 // vies achetées avec des noisettes
export const LIVES_PRICE = 50 // prix en noisettes de NUTS_LIVES vies

const now = ref(Date.now())

/** Ajoute les vies regagnées avec le temps. */
function regen() {
  if (save.lives >= MAX_LIVES) {
    save.livesAt = null
    return
  }
  save.livesAt ??= Date.now()
  const gained = Math.floor((now.value - save.livesAt) / REGEN_MS)
  if (gained <= 0) return
  save.lives = Math.min(MAX_LIVES, save.lives + gained)
  save.livesAt = save.lives >= MAX_LIVES ? null : save.livesAt + gained * REGEN_MS
}

/** Millisecondes avant la prochaine vie (0 si les vies sont au maximum). */
export const nextLifeIn = computed(() => (save.livesAt === null ? 0 : Math.max(0, save.livesAt + REGEN_MS - now.value)))

export function formatDelay(ms) {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function addLives(n) {
  save.lives += n // les vies achetées peuvent dépasser le maximum
  regen()
}

function loseLife() {
  regen()
  save.lives = Math.max(0, save.lives - 1)
  regen() // démarre le compte à rebours si besoin
}

/** Première équipe envoyée : la partie compte. Quitter ou recommencer sans gagner coûtera une vie. */
export function startAttempt() {
  save.attempt = true
}

/** Fin de partie : perd une vie si le niveau est raté. Renvoie true si une vie a été perdue. */
export function endAttempt(won) {
  if (!save.attempt) return false
  save.attempt = false
  if (!won) loseLife()
  return !won
}

/** Action en attente d'une vie (lancer un niveau) : affiche la fenêtre « Plus de vies ». */
export const pendingPlay = ref(null)

/** Lance `action` s'il reste une vie, sinon propose d'en regagner (et la lance une fois la vie obtenue). */
export function withLife(action) {
  regen()
  if (save.lives > 0) return action()
  pendingPlay.value = action
}

/** Au lancement, une fois la sauvegarde chargée. */
export function initLives() {
  endAttempt(false) // appli fermée en pleine partie : c'est un abandon
  regen()
  setInterval(() => {
    now.value = Date.now()
    regen()
  }, 1000)
}
