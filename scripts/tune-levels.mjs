// Réglage automatique de la difficulté : pour chaque niveau qui a une cible (`target`, taux de victoire
// du joueur moyen), cherche la graine et si besoin les réglages (places, taille des équipes, files)
// qui s'en rapprochent le plus, puis enregistre levels.json.
//   npm run tune            → tous les niveaux
//   npm run tune -- 12 15   → les niveaux 12 et 15 seulement
import fs from 'node:fs'
import { tuneLevel } from '../src/game/study.js'

const FILE = new URL('../src/game/levels.json', import.meta.url)
const levels = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const only = process.argv.slice(2).map(Number).filter(Boolean)

const pct = (x) => `${Math.round(x * 100)} %`
for (const [i, level] of levels.entries()) {
  if (level.target === undefined || (only.length && !only.includes(i + 1))) continue
  const t0 = Date.now()
  const best = tuneLevel(level)
  if (!best) {
    console.log(`${i + 1}. ${level.name} : aucun réglage faisable trouvé`)
    continue
  }
  const { win, error, ...settings } = best
  Object.assign(level, settings)
  const flag = error > 0.08 ? '  ⚠ loin de la cible' : ''
  console.log(
    `${String(i + 1).padStart(2)}. ${level.name.padEnd(18)} cible ${pct(level.target).padStart(5)} → ${pct(win).padStart(5)}` +
      `   équipes de ${settings.crewSize}, ${settings.queues} files, ${settings.slots} places, graine ${settings.seed}` +
      `   (${((Date.now() - t0) / 1000).toFixed(1)} s)${flag}`,
  )
  fs.writeFileSync(FILE, JSON.stringify(levels, null, 2) + '\n') // enregistré au fur et à mesure
}
