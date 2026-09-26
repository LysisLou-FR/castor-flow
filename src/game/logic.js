// Règles du jeu, sans aucune dépendance à Phaser : testable avec `npm test`.

import { PALETTE } from './levels.js'

export const EMPTY = -1
export const CELL = { TODO: 0, CLAIMED: 1, BUILT: 2 }

/** Transforme un niveau (pixel art texte) en grille de couleurs. */
export function parseLevel(level) {
  const h = level.art.length
  const w = level.art[0].length
  const letters = []
  const cells = []
  for (const [r, row] of level.art.entries()) {
    if (row.length !== w) throw new Error(`Niveau « ${level.name} » : ligne ${r} de longueur ${row.length}, attendu ${w}`)
    for (const ch of row) {
      if (ch === '.') {
        cells.push(EMPTY)
        continue
      }
      if (!(ch in PALETTE)) throw new Error(`Niveau « ${level.name} » : couleur inconnue « ${ch} »`)
      let idx = letters.indexOf(ch)
      if (idx === -1) idx = letters.push(ch) - 1
      cells.push(idx)
    }
  }
  return { w, h, cells, colors: letters.map((l) => PALETTE[l]) }
}

/**
 * Le chantier : chaque colonne se construit comme une pile, de bas en haut.
 * Seule la case la plus basse encore à construire d'une colonne est accessible.
 */
export class Board {
  constructor(parsed) {
    this.w = parsed.w
    this.h = parsed.h
    this.cells = parsed.cells
    this.state = parsed.cells.map(() => CELL.TODO)
    this.total = parsed.cells.filter((c) => c !== EMPTY).length
    this.built = 0
  }

  index(col, row) {
    return row * this.w + col
  }

  /** Case accessible de la colonne (index), ou -1 si la colonne est finie ou déjà en cours. */
  frontier(col) {
    for (let row = this.h - 1; row >= 0; row--) {
      const i = this.index(col, row)
      if (this.cells[i] === EMPTY || this.state[i] === CELL.BUILT) continue
      return this.state[i] === CELL.TODO ? i : -1
    }
    return -1
  }

  /** Toutes les cases accessibles en ce moment. */
  frontierCells() {
    const out = []
    for (let col = 0; col < this.w; col++) {
      const i = this.frontier(col)
      if (i !== -1) out.push(i)
    }
    return out
  }

  /** Trouve une case accessible de cette couleur, la plus proche de `preferCol`. */
  findTarget(color, preferCol = 0) {
    let best = -1
    let bestDist = Infinity
    for (let col = 0; col < this.w; col++) {
      const i = this.frontier(col)
      if (i === -1 || this.cells[i] !== color) continue
      const d = Math.abs(col - preferCol)
      if (d < bestDist) {
        best = i
        bestDist = d
      }
    }
    return best
  }

  claim(i) {
    this.state[i] = CELL.CLAIMED
  }

  build(i) {
    this.state[i] = CELL.BUILT
    this.built++
  }

  isComplete() {
    return this.built === this.total
  }
}

/** Générateur pseudo-aléatoire déterministe : un même niveau donne toujours les mêmes files. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Découpe les blocs à construire en équipes de castors ({ color, count }) réparties dans des files.
 * Les équipes suivent à peu près l'ordre de construction (de bas en haut), légèrement mélangé
 * pour laisser des choix au joueur.
 */
export function generateCrews(parsed, { crewSize, queues, seed = 1 }) {
  const { w, h, cells } = parsed
  const crews = []
  const open = new Map() // couleur -> équipe en cours de remplissage

  for (let row = h - 1; row >= 0; row--) {
    for (let col = 0; col < w; col++) {
      const color = cells[row * w + col]
      if (color === EMPTY) continue
      let crew = open.get(color)
      if (!crew) {
        crew = { color, count: 0 }
        crews.push(crew)
        open.set(color, crew)
      }
      crew.count++
      if (crew.count === crewSize) open.delete(color)
    }
  }

  const rand = rng(seed)
  for (let i = 0; i < crews.length - 1; i++) {
    if (rand() < 0.35) [crews[i], crews[i + 1]] = [crews[i + 1], crews[i]]
  }

  const lanes = Array.from({ length: queues }, () => [])
  crews.forEach((crew, i) => lanes[i % queues].push(crew))
  return lanes
}
