// Socle de l'île, peint sur un canvas 2D (dégradés doux, coins arrondis, aucun contour).
// Chaque face est dessinée dans son propre repère grâce à une transformation affine :
// les dégradés suivent la pente de la face et les arrondis prennent la perspective isométrique.

/**
 * @param ctx   contexte 2D du canvas (taille de la scène)
 * @param P     projection monde -> écran : (gx, gy, z) => { x, y }
 * @param dims  { GY, GRASS_END, BANK, END, THICK, WALL_FROM, WALL_TO }
 */
export function paintIsland(ctx, P, dims) {
  const { GY, GRASS_END, BANK, END, THICK, WALL_FROM, WALL_TO } = dims
  const r = 0.22 // rayon des coins, en tuiles

  /** Place le repère du canvas sur un plan du monde : (u, v) -> P(origin + u·axeU + v·axeV). */
  const plane = (origin, uAxis, vAxis) => {
    const o = P(...origin)
    const pu = P(...origin.map((c, i) => c + uAxis[i]))
    const pv = P(...origin.map((c, i) => c + vAxis[i]))
    ctx.setTransform(pu.x - o.x, pu.y - o.y, pv.x - o.x, pv.y - o.y, o.x, o.y)
  }
  const gradient = (x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    stops.forEach(([at, color]) => g.addColorStop(at, color))
    return g
  }
  const rect = (x, y, w, h, fill, radii = 0) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fillStyle = fill
    ctx.fill()
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Ombre douce de l'île flottante
  const c = P(END / 2 + 0.4, GY / 2 + 0.4, -THICK - 0.6)
  const spread = P(END, 0, 0).x - P(0, GY, 0).x // largeur de l'île à l'écran (coin droit - coin gauche)
  ctx.setTransform(1, 0, 0, 0.32, c.x, c.y)
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, spread * 0.62)
  shadow.addColorStop(0, 'rgba(29,59,99,0.24)')
  shadow.addColorStop(1, 'rgba(29,59,99,0)')
  ctx.fillStyle = shadow
  ctx.fillRect(-spread, -spread, spread * 2, spread * 2)

  // Tranche avant-droite (gx = END) : eau puis terre. Repère (u = gy, v = z vers le haut).
  plane([END, 0, 0], [0, 1, 0], [0, 0, 1])
  rect(0, -THICK, GY, THICK, gradient(0, 0, 0, -THICK, [[0, '#4fb4e6'], [0.3, '#2f94cf'], [0.31, '#c99462'], [1, '#8c5a33']]), [r, r, 0, 0])

  // Tranche avant-gauche (gy = GY), plus ombrée. Repère (u = gx, v = z).
  plane([0, GY, 0], [1, 0, 0], [0, 0, 1])
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, -THICK, END, THICK, [r, r, 0, 0])
  ctx.clip()
  rect(0, -THICK, END, THICK, gradient(0, 0, 0, -THICK, [[0, '#5aa84a'], [0.16, '#4c9a3e'], [0.17, '#ad7a4b'], [1, '#74482a']]))
  rect(BANK, -THICK, END - BANK, THICK, gradient(0, 0, 0, -THICK, [[0, '#3f9fd4'], [0.3, '#2a85bd'], [0.31, '#ad7a4b'], [1, '#74482a']]))
  ctx.restore()

  // Dessus (z = 0). Repère (u = gx, v = gy).
  plane([0, 0, 0], [1, 0, 0], [0, 1, 0])
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, END, GY, r)
  ctx.clip()
  // herbe : plus claire au fond, plus dense vers l'avant
  rect(0, 0, BANK, GY, gradient(0, 0, GRASS_END, 0, [[0, '#a8e584'], [1, '#86cf63']]))
  // halo de lumière douce au centre
  const glow = ctx.createRadialGradient(GRASS_END * 0.45, GY * 0.5, 0, GRASS_END * 0.45, GY * 0.5, GY * 0.55)
  glow.addColorStop(0, 'rgba(255,255,220,0.22)')
  glow.addColorStop(1, 'rgba(255,255,220,0)')
  rect(0, 0, GRASS_END, GY, glow)
  // ombre portée douce au pied du mur
  rect(0.95, WALL_FROM, 0.75, WALL_TO - WALL_FROM, gradient(0.95, 0, 1.7, 0, [[0, 'rgba(40,95,40,0.28)'], [1, 'rgba(40,95,40,0)']]), 0.3)
  // berge de sable
  rect(GRASS_END, 0, BANK - GRASS_END, GY, gradient(GRASS_END, 0, BANK, 0, [[0, '#f6e3ad'], [1, '#ecd08f']]))
  // rivière : claire près de la berge, plus profonde au loin
  rect(BANK, 0, END - BANK, GY, gradient(BANK, 0, END, 0, [[0, '#9fe3fb'], [0.25, '#6fd0f7'], [1, '#48b3ec']]))
  // reflet doux sur l'eau
  rect(BANK + 0.45, 0, 0.28, GY, gradient(BANK + 0.45, 0, BANK + 0.73, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]))
  ctx.restore()

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
