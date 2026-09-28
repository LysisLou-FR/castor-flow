import { ref } from 'vue'
import { LEVELS } from './game/levels.js'
import { save } from './store.js'

// Rejouer un niveau déjà réussi : il faut regarder une pub (sauf avec « Sans pubs »), et ça ne rapporte rien.

/** Niveau déjà réussi au moins une fois. */
export function isCompleted(index) {
  return index < save.unlocked - 1 || !!save.stats[LEVELS[index]?.name]?.wins
}

/** Rejeu en attente de la pub : { name, action } (affiche la fenêtre « Rejouer ce niveau ? »). */
export const pendingReplay = ref(null)

/** Lance `action` tout de suite, ou après une pub si le niveau est déjà réussi. */
export function withReplayAd(index, action) {
  if (!isCompleted(index) || save.noAds) return action()
  pendingReplay.value = { name: LEVELS[index].name, action }
}
