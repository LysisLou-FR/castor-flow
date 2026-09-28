// Étude de difficulté des niveaux.
//   npm run study               → tous les niveaux
//   npm run study -- 7          → le niveau 7 seulement
//   npm run study -- 7 --seeds 40 → en plus, compare 40 graines pour ce niveau (la graine change l'ordre des équipes)
import { LEVELS } from '../src/game/levels.js'
import { studyLevel } from '../src/game/study.js'

const args = process.argv.slice(2)
const seedsArg = args.indexOf('--seeds')
const seeds = seedsArg !== -1 ? Number(args[seedsArg + 1]) : 0
const only = args.find((a, i) => /^\d+$/.test(a) && (seedsArg === -1 || i !== seedsArg + 1))
const picked = only ? [[Number(only) - 1, LEVELS[Number(only) - 1]]] : [...LEVELS.entries()]
if (only && !picked[0][1]) throw new Error(`Niveau ${only} introuvable (${LEVELS.length} niveaux)`)

const pct = (x) => `${Math.round(x * 100)} %`.padStart(6)
const num = (x) => x.toFixed(1).padStart(5)

for (const [n, level] of picked) {
  const r = studyLevel(level, { runs: seeds ? 500 : 2000 })
  const opt = r.optimal.slots ?? (r.optimal.from ? `> ${r.optimal.from - 1} ?` : '> 8')
  console.log(`\n${n + 1}. ${level.name}  [${level.difficulty}]  graine ${level.seed}`)
  console.log(`   ${r.blocks} blocs, ${r.colors} couleurs, ${r.crews} équipes de ${level.crewSize}, ${level.queues} files, ${level.slots} places`)
  console.log(`   Joueur parfait : ${opt} place(s) nécessaire(s)` +
    (r.exact.solvable ? `, ${r.exact.winningFirst}/${r.exact.firstChoices} premiers choix gagnants` : r.exact.solvable === null ? ' (recherche trop longue)' : ', impossible sans acheter de place'))
  console.log('   Joueur      gagne sans aide   places achetées (moy. / médiane / 90e centile)')
  for (const [name, p] of Object.entries(r.players)) {
    const label = { random: 'au hasard', casual: 'moyen', greedy: 'automatique' }[name]
    console.log(`   ${label.padEnd(12)}${pct(p.winRate).padStart(10)}          ${num(p.avgExtra)} / ${p.median} / ${p.p90}`)
  }

  if (seeds) {
    console.log(`\n   Comparaison de ${seeds} graines (joueur moyen, 500 parties chacune) :`)
    const rows = []
    for (let seed = 1; seed <= seeds; seed++) {
      const s = studyLevel({ ...level, seed }, { runs: 500 })
      rows.push({ seed, opt: s.optimal.slots, win: s.players.casual.winRate, extra: s.players.casual.avgExtra })
    }
    rows.sort((a, b) => a.win - b.win || b.extra - a.extra)
    for (const row of rows) {
      const mark = row.seed === level.seed ? '  ← actuelle' : ''
      console.log(`   graine ${String(row.seed).padStart(3)} : parfait ${String(row.opt ?? '?').padStart(2)} places, moyen gagne ${pct(row.win)}, achète ${num(row.extra)}${mark}`)
    }
  }
}
