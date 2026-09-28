// Direction artistique partagée : couleurs et textures du décor (cubes, échafaudages, halo, confettis…).
// Le castor est ton dessin assets/castor.svg, découpé en vues dans beaverArt.js.

const TAU = Math.PI * 2

// ---------- Couleurs ----------

export const hex = (color) => `#${color.toString(16).padStart(6, '0')}`

/** Éclaircit (amount > 0) ou assombrit (amount < 0) une couleur 0xRRGGBB. */
export function shade(color, amount) {
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  const mix = (c) => Math.round(c + (target - c) * t)
  const r = mix((color >> 16) & 255)
  const g = mix((color >> 8) & 255)
  const b = mix(color & 255)
  return (r << 16) | (g << 8) | b
}

/** Ravive une couleur : augmente sa saturation (0 → inchangée, 1 → saturation maximale). */
export function vivid(color, amount) {
  const r = ((color >> 16) & 255) / 255
  const g = ((color >> 8) & 255) / 255
  const b = (color & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return color // gris : rien à saturer
  const d = max - min
  let s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h /= 6
  s = Math.min(1, s + (1 - s) * amount)
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t) => {
    t = (t + 1) % 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const to255 = (v) => Math.round(v * 255)
  return (to255(channel(h + 1 / 3)) << 16) | (to255(channel(h)) << 8) | to255(channel(h - 1 / 3))
}

/** Couleurs des trois faces visibles d'un cube isométrique. */
/** Mélange deux couleurs 0xRRGGBB (t = 0 → a, t = 1 → b). */
export function mix(a, b, t) {
  const ch = (shift) => Math.round(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * t)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

/**
 * Couleur d'un cube du plan : version pastel (ravivée puis éclaircie vers le bleu très pâle du ciel).
 * Assez proche de la vraie couleur pour la reconnaître, assez pâle pour ne pas la confondre avec un cube posé.
 */
export const GHOST_MIX = 0.62
export function ghostColor(color) {
  return mix(vivid(color, 0.3), 0xeef6fc, GHOST_MIX)
}

export function cubeFaces(color) {
  return { top: hex(shade(color, 0.28)), front: hex(color), side: hex(shade(color, -0.22)) }
}

// ---------- Textures canvas pour Phaser ----------

export const CUBE_TEX = { w: 128, top: 64, h: 72, pad: 4 } // cube : diamant 128×64, faces de 72 px

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return [c, c.getContext('2d')]
}

function addCanvas(scene, key, c) {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  scene.textures.addCanvas(key, c)
}

// Sommets d'un cube dans sa texture (avant marge)
function cubePoints() {
  const { w, top, h } = CUBE_TEX
  return {
    t: [w / 2, 0],
    r: [w, top / 2],
    b: [w / 2, top],
    l: [0, top / 2],
    rb: [w, top / 2 + h],
    bb: [w / 2, top + h],
    lb: [0, top / 2 + h],
  }
}

function poly(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function cubeCanvas(paint) {
  const { w, top, h, pad } = CUBE_TEX
  const [c, ctx] = canvas(w + pad * 2, top + h + pad * 2)
  ctx.translate(pad, pad)
  ctx.lineJoin = 'round'
  paint(ctx, cubePoints())
  return c
}

/** Cube plein d'une couleur : dessus éclairé, face du dessin, flanc ombré, arêtes adoucies. */
export function makeCubeTexture(scene, key, color) {
  const f = cubeFaces(color)
  addCanvas(
    scene,
    key,
    cubeCanvas((ctx, p) => {
      const { top, h } = CUBE_TEX
      // face du dessin (droite)
      let g = ctx.createLinearGradient(0, top / 2, 0, top + h)
      g.addColorStop(0, hex(shade(color, 0.06)))
      g.addColorStop(1, hex(shade(color, -0.1)))
      poly(ctx, [p.b, p.r, p.rb, p.bb])
      ctx.fillStyle = g
      ctx.fill()
      // flanc (gauche)
      g = ctx.createLinearGradient(0, top / 2, 0, top + h)
      g.addColorStop(0, f.side)
      g.addColorStop(1, hex(shade(color, -0.34)))
      poly(ctx, [p.l, p.b, p.bb, p.lb])
      ctx.fillStyle = g
      ctx.fill()
      // dessus
      poly(ctx, [p.t, p.r, p.b, p.l])
      ctx.fillStyle = f.top
      ctx.fill()
      // reflets sur les arêtes
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 3
      poly(ctx, [
        [p.t[0], p.t[1] + 5],
        [p.r[0] - 9, p.r[1]],
        [p.b[0], p.b[1] - 5],
        [p.l[0] + 9, p.l[1]],
      ])
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(p.b[0], p.b[1] + 3)
      ctx.lineTo(p.bb[0], p.bb[1] - 3)
      ctx.stroke()
      // contour léger
      ctx.strokeStyle = 'rgba(40,25,15,0.22)'
      ctx.lineWidth = 2
      poly(ctx, [p.t, p.r, p.rb, p.bb, p.lb, p.l])
      ctx.stroke()
    }),
  )
}

/**
 * Cube du plan de construction : opaque, en nuances de gris, teinté ensuite en pastel (ghostColor).
 * Il est affiché plus petit que sa case (GHOST_SIZE dans GameScene) pour se distinguer des cubes posés.
 */
export function makeGhostTexture(scene, key) {
  addCanvas(
    scene,
    key,
    cubeCanvas((ctx, p) => {
      // une fois teintés, le dessus reste clair et le flanc ombré
      poly(ctx, [p.b, p.r, p.rb, p.bb])
      ctx.fillStyle = 'rgb(236,236,236)'
      ctx.fill()
      poly(ctx, [p.l, p.b, p.bb, p.lb])
      ctx.fillStyle = 'rgb(196,196,196)'
      ctx.fill()
      poly(ctx, [p.t, p.r, p.b, p.l])
      ctx.fillStyle = 'rgb(255,255,255)'
      ctx.fill()
    }),
  )
}

/** Marge (px) du halo de l'indice autour du cube, dans sa texture. */
export const HINT_GLOW_PAD = 26

/**
 * Halo blanc lumineux du bonus « Indice », posé autour d'un cube à sa vraie couleur.
 * Même géométrie qu'un cube, avec une marge plus grande pour le flou.
 */
export function makeHintTexture(scene, key) {
  const { w, top, h } = CUBE_TEX
  const pad = HINT_GLOW_PAD
  const [c, ctx] = canvas(w + pad * 2, top + h + pad * 2)
  ctx.translate(pad, pad)
  const p = cubePoints()
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255,255,255,0.95)'
  ctx.shadowBlur = 20
  ctx.lineWidth = 8
  for (let n = 0; n < 2; n++) {
    poly(ctx, [p.t, p.r, p.rb, p.bb, p.lb, p.l])
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.moveTo(...p.l)
  ctx.lineTo(...p.b)
  ctx.lineTo(...p.r)
  ctx.moveTo(...p.b)
  ctx.lineTo(...p.bb)
  ctx.stroke()
  addCanvas(scene, key, c)
}

/**
 * Échafaudage à barreaux en bois qui soutient les cubes au-dessus d'un vide :
 * 4 poteaux d'angle, un barreau en haut de chaque côté et une diagonale de renfort sur la face avant.
 * Chaque barre est un petit prisme ombré comme les cubes (dessus clair, face, flanc sombre), sans contour.
 * Empilés, les poteaux forment des montants continus et les barreaux se répètent à chaque étage.
 */
export function makeScaffoldTexture(scene, key) {
  const WOOD = 0xd09a62
  const e = 0.07 // retrait des poteaux par rapport aux arêtes de la case
  const d = 0.1 // épaisseur des barres
  const rung = 0.84 // hauteur des barreaux dans la case
  addCanvas(
    scene,
    key,
    cubeCanvas((ctx) => {
      const { w, top, h } = CUBE_TEX
      // projection dans la texture : (gx, gy) ∈ [0, 1], z ∈ [0, 1] dans la case
      const P = (gx, gy, z) => [w / 2 + (gx - gy) * (w / 2), (gx + gy) * (top / 2) + (1 - z) * h]
      const fill = (pts, color) => {
        poly(ctx, pts.map(([x, y, z]) => P(x, y, z)))
        ctx.fillStyle = hex(color)
        ctx.fill()
      }
      /** Prisme [x0,x1]×[y0,y1]×[z0,z1] : on ne dessine que les trois faces visibles. */
      const box = (x0, x1, y0, y1, z0, z1, dim = 0) => {
        const c = shade(WOOD, dim)
        fill([[x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0]], c) // face avant
        fill([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], shade(c, -0.24)) // flanc
        fill([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], shade(c, 0.3)) // dessus
      }
      const post = (cx, cy, dim) => box(cx - d / 2, cx + d / 2, cy - d / 2, cy + d / 2, 0, 1, dim)
      const rungX = (cy, dim) => box(e, 1 - e, cy - d / 2, cy + d / 2, rung, rung + d, dim) // le long de gx
      const rungY = (cx, dim) => box(cx - d / 2, cx + d / 2, e, 1 - e, rung, rung + d, dim) // le long de gy
      const a = e
      const b = 1 - e
      const BACK = -0.22 // les barres du fond sont plus sombres : profondeur

      // du fond vers l'avant
      post(a, a, BACK)
      rungX(a, BACK)
      rungY(a, BACK)
      post(a, b, -0.08)
      post(b, a, -0.08)
      rungX(b, 0)
      rungY(b, 0)
      // diagonale de renfort sur la face avant (plan gx = b), du pied avant vers le haut du poteau droit
      const x = b + d / 2
      const t = 0.12
      fill([[x, b, 0], [x, b, t], [x, a, rung], [x, a, rung - t]], shade(WOOD, -0.06))
      fill([[x, b, t], [x, b, t + 0.03], [x, a, rung + 0.03], [x, a, rung]], shade(WOOD, 0.25))
      post(b, b, 0)
    }),
  )
}

/** Petites textures d'ambiance : ombre, éclaboussure, poussière, confettis, rocher, hutte. */
export function makeDecorTextures(scene) {
  let [c, ctx] = canvas(128, 64)
  let g = ctx.createRadialGradient(64, 32, 4, 64, 32, 62)
  g.addColorStop(0, 'rgba(30,40,60,0.38)')
  g.addColorStop(1, 'rgba(30,40,60,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(64, 32, 62, 30, 0, 0, TAU)
  ctx.fill()
  addCanvas(scene, 'shadow', c)
  // Ondulation : anneau en dégradé doux (aplati en perspective)
  ;[c, ctx] = canvas(128, 64)
  ctx.setTransform(1, 0, 0, 0.47, 0, 0)
  g = ctx.createRadialGradient(64, 68, 0, 64, 68, 62)
  g.addColorStop(0.62, 'rgba(255,255,255,0)')
  g.addColorStop(0.82, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 136)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  addCanvas(scene, 'ripple', c)
  ;[c, ctx] = canvas(64, 64)
  g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  addCanvas(scene, 'puff', c)
  ;[c, ctx] = canvas(12, 18)
  ctx.fillStyle = '#ffffff'
  ctx.roundRect(0, 0, 12, 18, 3)
  ctx.fill()
  addCanvas(scene, 'confetti', c)
}
