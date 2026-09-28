// Étude de difficulté d'un niveau : simule différents joueurs et cherche la solution parfaite.
// Utilisé par `npm run study`. Modèle simplifié : chaque castor pose son cube instantanément,
// comme un joueur patient qui attend que le chantier se calme avant d'envoyer une équipe.

import { Board, EMPTY, generateCrews, parseLevel, rng } from './logic.js'

/** Fait construire les équipes du chantier tant que c'est possible, libère les places terminées. */
function settle(board, site) {
  let progressed = true
  while (progressed) {
    progressed = false
    for (const crew of site) {
      if (crew.count === 0) continue
      const i = board.findTarget(crew.color)
      if (i === -1) continue
      board.claim(i)
      board.build(i)
      crew.count--
      progressed = true
    }
  }
  for (let s = site.length - 1; s >= 0; s--) if (site[s].count === 0) site.splice(s, 1)
}

const useful = (board, lane) => lane.length > 0 && board.findTarget(lane[0].color) !== -1

/** Stratégies de joueurs : renvoient l'index de la file à envoyer. */
export const PLAYERS = {
  // touche une file au hasard, sans regarder le dessin
  random: (board, lanes, rand) => pick(lanes.flatMap((l, i) => (l.length ? [i] : [])), rand),
  // envoie une équipe utile si elle en voit une (au hasard parmi elles), sinon au hasard
  casual: (board, lanes, rand) => {
    const ok = lanes.flatMap((l, i) => (useful(board, l) ? [i] : []))
    return ok.length ? pick(ok, rand) : PLAYERS.random(board, lanes, rand)
  },
  // comme le joueur automatique des tests : première équipe utile, sinon première file non vide
  greedy: (board, lanes) => {
    const i = lanes.findIndex((l) => useful(board, l))
    return i !== -1 ? i : lanes.findIndex((l) => l.length)
  },
}

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)]
}

/**
 * Joue une partie. Quand le chantier est bloqué, le joueur « achète » une place (pub ou noisettes)
 * et continue : `extra` compte ces places.
 */
export function simulate(level, player, { slots = level.slots, seed = 1 } = {}) {
  const parsed = parseLevel(level)
  const board = new Board(parsed)
  const lanes = generateCrews(parsed, level).map((l) => l.map((c) => ({ ...c })))
  const rand = rng(seed)
  const site = []
  let extra = 0
  let sends = 0
  for (;;) {
    settle(board, site)
    if (board.isComplete()) return { extra, sends }
    if (site.length >= slots + extra) {
      extra++
      continue
    }
    const l = player(board, lanes, rand)
    site.push(lanes[l].shift())
    sends++
  }
}

/**
 * Joueur parfait : explore toutes les suites de choix (avec mémoire des positions déjà vues)
 * pour savoir si le niveau est faisable avec `slots` places sans en acheter.
 * Renvoie { solvable, nodes, winningFirst } ; solvable vaut null si la recherche dépasse `budget` positions.
 */
export function solve(level, slots = level.slots, budget = 300000) {
  const parsed = parseLevel(level)
  const lanes = generateCrews(parsed, level)
  const seen = new Set()
  let nodes = 0
  let aborted = false

  function key(board, pos, site) {
    return pos.join(',') + '|' + site.map((c) => `${c.color}:${c.count}`).sort().join(',') + '|' + board.state.join('')
  }

  // renvoie true si une suite de choix mène à la victoire depuis cette position
  function search(board, pos, site) {
    settle(board, site)
    if (board.isComplete()) return true
    if (site.length >= slots) return false
    const k = key(board, pos, site)
    if (seen.has(k)) return false // déjà explorée : c'était une impasse
    if (++nodes > budget) {
      aborted = true
      return false
    }
    seen.add(k)
    // essaie d'abord les équipes utiles : trouve plus vite une solution
    const order = lanes.map((_, i) => i).filter((i) => pos[i] < lanes[i].length)
    order.sort((a, b) => Number(isUseful(board, lanes[b][pos[b]])) - Number(isUseful(board, lanes[a][pos[a]])))
    for (const l of order) {
      const next = cloneBoard(board)
      const nextPos = pos.slice()
      nextPos[l]++
      if (search(next, nextPos, [...site.map((c) => ({ ...c })), { ...lanes[l][pos[l]] }])) return true
      if (aborted) return false
    }
    return false
  }

  const root = new Board(parsed)
  const pos = lanes.map(() => 0)
  const firstChoices = lanes.map((_, i) => i).filter((i) => lanes[i].length)
  // nombre de premiers choix gagnants : 1 sur 3 = il faut viser juste dès le départ
  let winningFirst = 0
  let solvable = false
  for (const l of firstChoices) {
    const p = pos.slice()
    p[l]++
    if (search(cloneBoard(root), p, [{ ...lanes[l][0] }])) {
      solvable = true
      winningFirst++
    }
    if (aborted) return { solvable: null, nodes, winningFirst: null }
  }
  return { solvable, nodes, winningFirst, firstChoices: firstChoices.length }
}

const isUseful = (board, crew) => board.findTarget(crew.color) !== -1

function cloneBoard(board) {
  const b = Object.create(Board.prototype)
  Object.assign(b, board)
  b.state = board.state.slice()
  return b
}

/** Plus petit nombre de places avec lequel le joueur parfait finit le niveau. */
export function optimalSlots(level, max = 8) {
  for (let s = 1; s <= max; s++) {
    const r = solve(level, s)
    if (r.solvable === null) return { slots: null, from: s } // recherche trop longue
    if (r.solvable) return { slots: s }
  }
  return { slots: null }
}

/** Rapport complet : taux de réussite et places achetées pour chaque type de joueur. */
export function studyLevel(level, { runs = 2000 } = {}) {
  const parsed = parseLevel(level)
  const report = {
    blocks: parsed.cells.filter((c) => c !== EMPTY).length,
    colors: parsed.colors.length,
    crews: generateCrews(parsed, level).flat().length,
    optimal: optimalSlots(level),
    exact: solve(level),
    players: {},
  }
  for (const [name, player] of Object.entries(PLAYERS)) {
    const extras = []
    for (let r = 0; r < (name === 'greedy' ? 1 : runs); r++) extras.push(simulate(level, player, { seed: r + 1 }).extra)
    extras.sort((a, b) => a - b)
    report.players[name] = {
      winRate: extras.filter((e) => e === 0).length / extras.length, // gagné sans acheter de place
      avgExtra: extras.reduce((a, b) => a + b, 0) / extras.length,
      median: extras[Math.floor(extras.length / 2)],
      p90: extras[Math.floor(extras.length * 0.9)],
    }
  }
  return report
}

/** Difficulté ressentie, d'après le taux de victoire du joueur moyen (sans acheter de place). */
export function feltDifficulty(casualWinRate) {
  if (casualWinRate >= 0.9) return 'normal'
  if (casualWinRate >= 0.4) return 'hard'
  return 'superhard'
}

/** Résumé rapide pour l'éditeur (recalculé à chaque modification du niveau). */
export function analyzeLevel(level, { runs = 300 } = {}) {
  const parsed = parseLevel(level)
  const blocks = parsed.cells.filter((c) => c !== EMPTY).length
  const base = { blocks, colors: parsed.colors.length, crews: generateCrews(parsed, level).flat().length }
  if (!blocks) return { ...base, solvable: false, minSlots: null }
  const winRate = (player) => {
    let wins = 0
    for (let r = 0; r < runs; r++) if (simulate(level, player, { seed: r + 1 }).extra === 0) wins++
    return wins / runs
  }
  const casualWin = winRate(PLAYERS.casual)
  return {
    ...base,
    solvable: solve(level).solvable, // null : recherche trop longue
    minSlots: optimalSlots(level).slots,
    casualWin,
    randomWin: winRate(PLAYERS.random),
    felt: feltDifficulty(casualWin),
  }
}
