// Opérations sur le dessin d'un niveau (tableau de lignes, une lettre de la palette par case, "." = vide).
// Fonctions pures : elles renvoient toujours un nouveau tableau.

export const EMPTY_CELL = '.'

export function emptyArt(w, h) {
  return Array.from({ length: h }, () => EMPTY_CELL.repeat(w))
}

export function setCell(art, x, y, ch) {
  if (art[y][x] === ch) return art
  const row = art[y]
  return art.map((r, i) => (i === y ? row.slice(0, x) + ch + row.slice(x + 1) : r))
}

/**
 * Change la taille du dessin. Le dessin reste posé en bas (on construit depuis le sol)
 * et centré horizontalement.
 */
export function resizeArt(art, w, h) {
  const oldW = art[0]?.length ?? 0
  const oldH = art.length
  const dx = Math.floor((w - oldW) / 2)
  const dy = h - oldH
  return Array.from({ length: h }, (_, y) => {
    let row = ''
    for (let x = 0; x < w; x++) {
      const sx = x - dx
      const sy = y - dy
      row += sy >= 0 && sy < oldH && sx >= 0 && sx < oldW ? art[sy][sx] : EMPTY_CELL
    }
    return row
  })
}

/** Pot de peinture : remplit la zone de même couleur contiguë à (x, y). */
export function floodFill(art, x, y, ch) {
  const target = art[y][x]
  if (target === ch) return art
  const grid = art.map((row) => [...row])
  const stack = [[x, y]]
  while (stack.length) {
    const [cx, cy] = stack.pop()
    if (cy < 0 || cy >= grid.length || cx < 0 || cx >= grid[0].length || grid[cy][cx] !== target) continue
    grid[cy][cx] = ch
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
  return grid.map((row) => row.join(''))
}

/** Décale tout le dessin d'une case (les cases qui sortent sont perdues). */
export function shiftArt(art, dx, dy) {
  const h = art.length
  const w = art[0].length
  return Array.from({ length: h }, (_, y) => {
    let row = ''
    for (let x = 0; x < w; x++) {
      const sx = x - dx
      const sy = y - dy
      row += sy >= 0 && sy < h && sx >= 0 && sx < w ? art[sy][sx] : EMPTY_CELL
    }
    return row
  })
}
