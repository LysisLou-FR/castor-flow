import { save } from './store.js'

// Statistiques locales par niveau, pour les tests avec de vrais joueurs (Paramètres > Statistiques).
export const STAT_KEYS = { plays: 'parties', wins: 'gagnées', fails: 'ratées', slots: 'places', hints: 'indices' }

/** Ajoute `n` au compteur `key` du niveau (repéré par son nom, pour survivre à un changement d'ordre). */
export function track(levelName, key, n = 1) {
  const stats = (save.stats[levelName] ??= Object.fromEntries(Object.keys(STAT_KEYS).map((k) => [k, 0])))
  stats[key] += n
}

/** Texte à copier-coller pour envoyer ses statistiques. */
export function statsText(levels) {
  const lines = levels
    .filter((l) => save.stats[l.name])
    .map((l, i) => {
      const s = save.stats[l.name]
      return `${levels.indexOf(l) + 1}. ${l.name} : ${Object.entries(STAT_KEYS).map(([k, label]) => `${s[k]} ${label}`).join(', ')}`
    })
  return lines.length ? lines.join('\n') : 'Aucune partie jouée pour l’instant.'
}
