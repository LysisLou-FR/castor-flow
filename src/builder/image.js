// Import d'une image dans l'éditeur : elle est réduite à la taille de la grille puis chaque pixel
// est remplacé par la couleur la plus proche de la palette du jeu.
import { PALETTE } from '../game/levels.js'
import { EMPTY_CELL } from './grid.js'

const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]

/** Distance perçue entre deux couleurs (« redmean », plus fidèle à l'œil qu'une distance RGB brute). */
function distance([r1, g1, b1], [r2, g2, b2]) {
  const rm = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
}

function nearest(color, keys) {
  let best = keys[0]
  let bestD = Infinity
  for (const k of keys) {
    const d = distance(color, rgb(PALETTE[k]))
    if (d < bestD) {
      best = k
      bestD = d
    }
  }
  return best
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image illisible'))
    img.src = url
  })
}

/**
 * Convertit une image en dessin de w × h cases.
 * L'image garde ses proportions, posée en bas et centrée ; les pixels transparents deviennent des cases vides.
 * `maxColors` limite le nombre de couleurs : les moins fréquentes sont remplacées par la plus proche restante.
 */
export function imageToArt(img, w, h, { maxColors = 6, colors = Object.keys(PALETTE) } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const scale = Math.min(w / img.width, h / img.height)
  const dw = Math.max(1, Math.round(img.width * scale))
  const dh = Math.max(1, Math.round(img.height * scale))
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, Math.floor((w - dw) / 2), h - dh, dw, dh)
  const { data } = ctx.getImageData(0, 0, w, h)

  const cells = []
  const count = new Map()
  for (let i = 0; i < w * h; i++) {
    const [r, g, b, a] = data.slice(i * 4, i * 4 + 4)
    if (a < 128) {
      cells.push(null)
      continue
    }
    const key = nearest([r, g, b], colors)
    cells.push({ key, rgb: [r, g, b] })
    count.set(key, (count.get(key) ?? 0) + 1)
  }

  const kept = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors).map(([k]) => k)
  const rows = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const cell = cells[y * w + x]
      row += !cell ? EMPTY_CELL : kept.includes(cell.key) ? cell.key : nearest(cell.rgb, kept)
    }
    rows.push(row)
  }
  return rows
}
