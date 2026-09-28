// Socle de l'île, peint sur un canvas 2D : une dalle simple aux coins bien arrondis, herbe et rivière,
// dégradés doux, aucun contour.
// La dalle est une vraie extrusion de sa forme arrondie : on empile la forme du dessus, de la base
// jusqu'en haut, ce qui donne des tranches continues qui suivent les arrondis (pas de raccord aux coins).
// Chaque couche est dessinée dans le repère du plan grâce à une transformation affine.

/**
 * @param ctx   contexte 2D du canvas (taille de la scène)
 * @param P     projection monde -> écran : (gx, gy, z) => { x, y }
 * @param dims  { GY, BANK, END, THICK, columns: [{ gy0, height }] } (colonnes du mur, pour les ombres)
 */
export function paintIsland(ctx, P, dims) {
  const { GY, BANK, END, THICK, columns } = dims
  const r = 0.42 // rayon des coins, en tuiles
  const SHORE = 0.22 // fondu herbe -> eau
  const LIP = 0.09 // épaisseur du liseré herbe/eau sur la tranche, en cubes
  const { width, height } = ctx.canvas

  /** Place le repère sur le plan horizontal à la hauteur z : (u, v) -> P(u, v, z). */
  const plane = (c, z) => {
    const o = P(0, 0, z)
    const pu = P(1, 0, z)
    const pv = P(0, 1, z)
    c.setTransform(pu.x - o.x, pu.y - o.y, pv.x - o.x, pv.y - o.y, o.x, o.y)
  }
  const gradient = (c, x0, y0, x1, y1, stops) => {
    const g = c.createLinearGradient(x0, y0, x1, y1)
    stops.forEach(([at, color]) => g.addColorStop(at, color))
    return g
  }
  const slab = (c, fill) => {
    c.beginPath()
    c.roundRect(0, 0, END, GY, r)
    c.fillStyle = fill
    c.fill()
  }
  // herbe puis rivière, avec un rivage fondu (pas de plage)
  const topFill = (c) =>
    gradient(c, 0, 0, END, 0, [
      [0, '#9fdd7c'],
      [(BANK - SHORE) / END, '#8fd26b'],
      [(BANK + SHORE * 0.4) / END, '#aeeaf5'],
      [(BANK + SHORE * 1.6) / END, '#6fcdf5'],
      [1, '#4db6ec'],
    ])

  ctx.clearRect(0, 0, width, height)

  // Ombre douce de l'île flottante
  const c0 = P(END / 2 + 0.3, GY / 2 + 0.3, -THICK - 0.5)
  const spread = P(END, 0, 0).x - P(0, GY, 0).x // largeur de l'île à l'écran
  ctx.setTransform(1, 0, 0, 0.3, c0.x, c0.y)
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, spread * 0.6)
  shadow.addColorStop(0, 'rgba(29,59,99,0.2)')
  shadow.addColorStop(1, 'rgba(29,59,99,0)')
  ctx.fillStyle = shadow
  ctx.fillRect(-spread, -spread, spread * 2, spread * 2)

  // Corps de la dalle, sur un calque à part (l'ombrage ne doit toucher que la dalle)
  const layer = document.createElement('canvas')
  layer.width = width
  layer.height = height
  const b = layer.getContext('2d')
  const px = P(0, 0, 0).y - P(0, 0, -THICK).y // épaisseur à l'écran, en pixels
  const steps = Math.max(8, Math.ceil(px))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps // 0 = base, 1 = dessus
    const z = -THICK * (1 - t)
    plane(b, z)
    // terre plus claire en haut ; liseré de la couleur du dessus au sommet
    slab(b, z > -LIP ? topFill(b) : `rgb(${Math.round(150 + 45 * t)}, ${Math.round(96 + 38 * t)}, ${Math.round(56 + 30 * t)})`)
  }
  // Ombrage : la tranche de gauche (face à l'ombre) plus sombre que celle de droite
  const corner = P(END, GY, 0).x // coin avant de la dalle
  const left = P(0, GY, 0).x
  const right = P(END, 0, 0).x
  b.setTransform(1, 0, 0, 1, 0, 0)
  b.globalCompositeOperation = 'source-atop'
  b.fillStyle = gradient(b, left, 0, right, 0, [
    [0, 'rgba(50,25,10,0.22)'],
    [(corner - left) / (right - left), 'rgba(50,25,10,0.1)'],
    [1, 'rgba(50,25,10,0)'],
  ])
  b.fillRect(0, 0, width, height)
  b.globalCompositeOperation = 'source-over'

  // Dessus (z = 0)
  plane(b, 0)
  slab(b, topFill(b))
  // Ombres du mur sur l'herbe : chaque colonne projette une ombre d'autant plus longue qu'elle est haute,
  // dessinée à part puis floutée pour des bords doux
  const shade = document.createElement('canvas')
  shade.width = width
  shade.height = height
  const sh = shade.getContext('2d')
  plane(sh, 0)
  for (const { gy0, height: hgt } of columns) {
    const len = Math.min(1.5, 0.35 + hgt * 0.07)
    sh.fillStyle = gradient(sh, 1, 0, 1 + len, 0, [[0, 'rgba(30,80,40,0.3)'], [0.5, 'rgba(30,80,40,0.14)'], [1, 'rgba(30,80,40,0)']])
    sh.fillRect(0.9, gy0 - 0.02, len + 0.1, 1.04)
  }
  // ombre de contact, plus nette, au pied du mur
  const first = Math.min(...columns.map((c) => c.gy0))
  const last = Math.max(...columns.map((c) => c.gy0)) + 1
  sh.fillStyle = gradient(sh, 1, 0, 1.25, 0, [[0, 'rgba(25,60,30,0.28)'], [1, 'rgba(25,60,30,0)']])
  sh.fillRect(0.95, first, 0.3, last - first)

  const tw = Math.hypot(P(1, 0, 0).x - P(0, 0, 0).x, P(1, 0, 0).y - P(0, 0, 0).y) // taille d'une tuile à l'écran
  b.save()
  b.beginPath()
  b.roundRect(0, 0, END, GY, r)
  b.clip()
  b.setTransform(1, 0, 0, 1, 0, 0)
  b.filter = `blur(${Math.max(1, tw * 0.06)}px)`
  b.drawImage(shade, 0, 0)
  b.restore()

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(layer, 0, 0)
}
