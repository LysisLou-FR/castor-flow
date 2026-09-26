// Direction artistique partagée : couleurs, castor et textures.
// Le castor est décrit une seule fois en formes simples (repère 100×100, tourné vers la droite) :
// Phaser le dessine sur un canvas, Vue le dessine en SVG (composant BeaverMark).

export const OUTLINE = '#5a2d16' // brun chaud foncé, comme les références
export const OUTLINE_W = 0 // épaisseur du contour (0 : aplats sans contour, comme l'icône)
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

// ---------- Castor ----------
// Castor au style de l'icône de l'appli (assets/icon-only.svg) : aplats de couleur, aucun contour.
// La tête, les oreilles et le visage réutilisent directement les tracés de l'icône, mis à l'échelle.
// Vu légèrement d'en haut pour l'isométrique, avec deux vues au lieu d'un simple retournement :
//   - « face » : tourné vers le bas-droite de l'écran (il revient vers la rivière, ou pose pour l'interface) ;
//   - « dos »  : tourné vers le haut-gauche (il va vers le mur et grimpe).
// Il porte son cube sur la tête, tenu par les deux pattes. Repère 100×100, pieds au sol en (50, 92).

const FUR = '#D9853F' // corps (le fond de l'icône)
const HEAD = '#E0914C'
const EAR = '#B0632C'
const INNER_EAR = '#F3B489'
const MUZZLE = '#F8D4A8'
const NOSE = '#4A2616'
const EYE = '#3B2A22'
const PAW = '#B0632C'
const TAIL = '#9A5424'

const e = (cx, cy, rx, ry, fill, extra = {}) => ({ t: 'e', cx, cy, rx, ry, fill, ...extra })

// Tracés de l'icône (repère 1024) replacés sur la tête du castor
const ICON_SCALE = 0.047
const HEAD_M = [ICON_SCALE, 0, 0, ICON_SCALE, 27.35, 18.5]
const FACE_M = [ICON_SCALE, 0, 0, ICON_SCALE, 32.35, 20.5] // visage décalé vers le bas-droite (vue de 3/4)
const icon = (d, fill, m, extra = {}) => ({ t: 'p', d, fill, m, ...extra })

const ICON_HEAD = 'M512.36 42C782.851 42 1004.23 221.151 1021.98 447.791C1026.3 473.394 1030.8 497.637 1033.45 505.578C1039.46 523.64 1067.84 594.166 1067.84 607.067H1067.34C1071.07 623.36 1073 640.015 1073 656.951C1073 850.278 821.608 1007 511.5 1007C201.392 1007 -50 850.278 -50 656.951C-50 626.125 -43.6085 596.23 -31.6067 567.752C-23.0122 543.625 -12.1825 515.951 -8.72588 505.578C-6.07921 497.637 -1.58387 473.394 2.74139 447.791C20.4886 221.151 241.869 42 512.36 42Z'
const EARS = [
  icon('M810.538 78.4642C848.081 35.5906 913.271 31.2689 956.145 68.8115L962.442 74.3263C1005.32 111.869 1009.64 177.059 972.095 219.933L942.404 253.84C904.861 296.714 839.671 301.036 796.797 263.493L790.499 257.978C747.626 220.436 743.304 155.245 780.847 112.372L810.538 78.4642Z', EAR, HEAD_M),
  icon('M842.529 108.99C865.177 83.1257 904.504 80.5186 930.368 103.167C956.232 125.815 958.839 165.141 936.191 191.005L880.468 254.641C857.82 280.505 818.493 283.112 792.629 260.464C766.765 237.816 764.158 198.489 786.806 172.625L842.529 108.99Z', INNER_EAR, HEAD_M),
  icon('M207.05 78.4642C169.508 35.5906 104.317 31.2689 61.4437 68.8115L55.1458 74.3263C12.2722 111.869 7.95058 177.059 45.4932 219.933L75.1846 253.84C112.727 296.714 177.917 301.036 220.791 263.493L227.089 257.978C269.963 220.436 274.284 155.245 236.742 112.372L207.05 78.4642Z', EAR, HEAD_M),
  icon('M175.059 108.99C152.411 83.1257 113.084 80.5186 87.2202 103.167C61.3562 125.815 58.7491 165.141 81.3971 191.005L137.12 254.641C159.768 280.505 199.095 283.112 224.959 260.464C250.823 237.816 253.43 198.489 230.782 172.625L175.059 108.99Z', INNER_EAR, HEAD_M),
]
const EARS_BACK = [EARS[0], EARS[2]] // de dos, on ne voit pas l'intérieur des oreilles
const FACE_BASE = [
  icon('M516 805C516 799.477 520.477 795 526 795H593.58C599.627 795 604.291 800.326 603.493 806.32L585.518 941.32C584.856 946.289 580.618 950 575.606 950H526C520.477 950 516 945.523 516 940V805Z', '#FFFFFF', FACE_M),
  icon('M509 805C509 799.477 504.523 795 499 795H430.437C424.384 795 419.718 800.335 420.526 806.334L438.703 941.334C439.371 946.297 443.606 950 448.613 950H499C504.523 950 509 945.523 509 940V805Z', '#FFFFFF', FACE_M),
  icon('M512.587 489C516.154 489 519.701 489.07 523.223 489.209C543.789 489.166 565.236 492.656 586.577 499.601C623.027 510.47 654.452 529.131 677.421 552.94C760.968 628.39 782.162 741.623 724.585 806.707C676.694 860.841 589.297 864.717 512.5 821.827C435.703 864.717 348.307 860.841 300.415 806.707C242.517 741.259 264.271 627.121 348.986 551.676C371.378 528.94 401.545 511.016 436.429 500.259C458.479 492.858 480.675 489.149 501.927 489.21C505.458 489.071 509.012 489 512.587 489Z', MUZZLE, FACE_M),
  icon('M512.36 687.036C515.674 687.036 518.36 689.723 518.36 693.036V804.907C560.649 846.573 622.492 863.863 683.681 824.703C686.472 822.917 690.182 823.732 691.968 826.522C693.754 829.314 692.939 833.024 690.148 834.811C625.284 876.323 559.443 859.296 514.115 817.438C513.56 817.607 512.971 817.699 512.36 817.699C512.043 817.699 511.732 817.673 511.428 817.626C486.823 837.89 460.585 852.569 431.789 857.49C400.602 862.82 367.145 856.584 330.455 834.924C327.602 833.239 326.654 829.559 328.338 826.706C330.022 823.853 333.701 822.906 336.555 824.59C371.234 845.063 401.839 850.435 429.768 845.662C456.765 841.048 481.938 826.838 506.36 806.229V693.036C506.36 689.722 509.047 687.036 512.36 687.036Z', NOSE, FACE_M),
  icon('M512.36 559.755C579.795 559.755 634.463 584.779 634.463 615.647C634.463 617.408 634.282 619.149 633.933 620.868C633.696 629.65 624.989 645.226 611.212 660.241C602.448 669.794 593.279 677.32 585.522 681.789C567.859 697.619 541.637 707.654 512.36 707.654C482.986 707.654 456.688 697.552 439.023 681.631C431.324 677.144 422.265 669.684 413.602 660.241C400.121 645.548 391.492 630.318 390.906 621.443C390.477 619.538 390.257 617.604 390.257 615.647C390.257 584.779 444.925 559.755 512.36 559.755Z', NOSE, FACE_M),
  icon('M424.652 614.72C436.977 604.975 471.43 586.688 510.64 591.504', null, FACE_M, { stroke: '#723B22', w: 12 }),
]
const EYES_OPEN = [
  icon('M649.94 429.913C649.94 389.547 682.664 356.824 723.03 356.824C763.396 356.824 796.119 389.547 796.119 429.913V487.499C796.119 527.865 763.396 560.589 723.03 560.589C682.664 560.589 649.94 527.865 649.94 487.499V429.913Z', EYE, FACE_M),
  icon('M655.047 409.667C655.047 387.822 672.756 370.113 694.602 370.113C716.447 370.113 734.156 387.822 734.156 409.667V430.304C734.156 452.15 716.447 469.859 694.602 469.859C672.756 469.859 655.047 452.15 655.047 430.304V409.667Z', '#FFFFFF', FACE_M),
  icon('M228.6 429.913C228.6 389.547 261.324 356.824 301.69 356.824C342.056 356.824 374.78 389.547 374.78 429.913V487.499C374.78 527.865 342.056 560.589 301.69 560.589C261.324 560.589 228.6 527.865 228.6 487.499V429.913Z', EYE, FACE_M),
  icon('M290.459 407.948C290.459 386.102 308.169 368.393 330.014 368.393C351.859 368.393 369.568 386.102 369.568 407.948V428.585C369.568 450.43 351.859 468.139 330.014 468.139C308.169 468.139 290.459 450.43 290.459 428.585V407.948Z', '#FFFFFF', FACE_M),
]
// Yeux fermés en ^^ (même emplacement que les yeux de l'icône)
const EYES_HAPPY = [
  icon('M240 478 Q301 390 362 478', null, FACE_M, { stroke: EYE, w: 42 }),
  icon('M662 478 Q723 390 784 478', null, FACE_M, { stroke: EYE, w: 42 }),
]

/** Queue plate posée au sol (ellipse aplatie en perspective), avec son quadrillage. */
function tail(cx, cy) {
  const rot = -0.5
  const at = (dx, dy) => [cx + dx * Math.cos(rot) - dy * Math.sin(rot), cy + dx * Math.sin(rot) + dy * Math.cos(rot)]
  const lines = []
  for (const k of [-9, -3, 3, 9]) {
    for (const s of [1, -1]) {
      const [x1, y1] = at(k - 3 * s, -5)
      const [x2, y2] = at(k + 3 * s, 5)
      lines.push({ t: 'l', x1, y1, x2, y2, w: 1.3, stroke: '#B8703A' })
    }
  }
  return [e(cx, cy, 19, 8.5, TAIL, { rot }), ...lines]
}

const BODY_FRONT = [e(50, 71, 20.5, 19, FUR), e(56, 76, 11, 11.5, MUZZLE)]
const BODY_BACK = [e(50, 71, 20.5, 19, FUR)]
const ARMS_FRONT = [e(47, 72, 3, 5.4, PAW, { rot: 0.75 }), e(65, 71, 3.1, 5.6, PAW, { rot: -0.7 })]
const HEAD_FRONT = [...EARS, icon(ICON_HEAD, HEAD, HEAD_M), ...FACE_BASE]
const HEAD_BACK = [...EARS_BACK, icon(ICON_HEAD, HEAD, HEAD_M)]

/** Castor de face, pattes sur le ventre. */
export const BEAVER_FRONT = [...tail(28, 79), ...BODY_FRONT, ...ARMS_FRONT, ...HEAD_FRONT, ...EYES_OPEN]
/** Castor de face, tout content (yeux fermés). */
export const BEAVER_FRONT_HAPPY = [...tail(28, 79), ...BODY_FRONT, ...ARMS_FRONT, ...HEAD_FRONT, ...EYES_HAPPY]
/** Castor de face qui porte un cube sur la tête (les pattes sont dessinées par-dessus le cube). */
export const BEAVER_FRONT_CARRY = [...tail(28, 79), ...BODY_FRONT, ...HEAD_FRONT, ...EYES_OPEN]
/** Castor de dos. */
export const BEAVER_BACK = [...BODY_BACK, ...HEAD_BACK, ...tail(71, 86)]
/** Pattes qui tiennent le cube sur la tête (face et dos). */
export const BEAVER_PAWS_FRONT = [e(37.5, 16.5, 4.2, 4.8, PAW), e(64.5, 16.5, 4.2, 4.8, PAW)]
export const BEAVER_PAWS_BACK = BEAVER_PAWS_FRONT

/** Pied (repère 18×10). */
export const BEAVER_FOOT = [e(9, 5, 6.5, 3.8, '#8F4E22')]
export const FOOT_FRAME = { w: 18, h: 10 }

/** Position des éléments par rapport au point au sol du castor (50, 92), en unités. */
export const BEAVER_RIG = {
  groundX: 50,
  groundY: 92,
  backFoot: { x: -7, y: -2 },
  frontFoot: { x: 7, y: -1 },
  cube: { front: { x: 1, y: -69.5 }, back: { x: 1, y: -69.5 }, size: 30 }, // pied du cube, posé sur la tête
}
/** Cadres SVG du castor, sans cube et avec le cube sur la tête. */
export const BEAVER_VIEW = { x: 4, y: 14, w: 90, h: 82 }
export const BEAVER_VIEW_CARRY = { x: 4, y: -13, w: 90, h: 109 }
const paths = new Map()
const path2d = (d) => {
  if (!paths.has(d)) paths.set(d, new Path2D(d))
  return paths.get(d)
}

function tracePath(ctx, s) {
  ctx.beginPath()
  if (s.t === 'e') ctx.ellipse(s.cx, s.cy, s.rx, s.ry, s.rot || 0, 0, TAU)
  else if (s.t === 'r') ctx.roundRect(s.x, s.y, s.w, s.h, s.r || 0)
  else if (s.t === 'l') {
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
  }
}

/** Chemin SVG (avec sa transformation `m` éventuelle, comme les tracés de l'icône). */
function withPath(ctx, s, draw) {
  ctx.save()
  if (s.m) ctx.transform(...s.m)
  draw(path2d(s.d))
  ctx.restore()
}

/**
 * Dessine des formes. Avec un contour (outlineWidth > 0), celui-ci n'entoure que la silhouette.
 * Le castor actuel est en aplats, sans contour (OUTLINE_W = 0), comme l'icône de l'appli.
 */
export function paintShapes(ctx, shapes, outlineWidth = OUTLINE_W) {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (outlineWidth > 0) {
    ctx.strokeStyle = OUTLINE
    ctx.lineWidth = outlineWidth
    for (const s of shapes) {
      if (!s.fill) continue // les traits (queue, bouche, yeux fermés) n'ont pas de contour
      if (s.t === 'p') withPath(ctx, s, (p) => ctx.stroke(p))
      else {
        tracePath(ctx, s)
        ctx.stroke()
      }
    }
  }
  for (const s of shapes) {
    ctx.globalAlpha = s.a ?? 1
    if (s.t === 'p') {
      withPath(ctx, s, (p) => {
        if (s.fill) {
          ctx.fillStyle = s.fill
          ctx.fill(p)
        } else {
          ctx.lineWidth = s.w
          ctx.strokeStyle = s.stroke
          ctx.stroke(p)
        }
      })
      continue
    }
    tracePath(ctx, s)
    if (s.t === 'l') {
      ctx.lineWidth = s.w
      ctx.strokeStyle = s.stroke
      ctx.stroke()
    } else {
      ctx.fillStyle = s.fill
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

// ---------- Textures canvas pour Phaser ----------

export const BEAVER_RES = 1.8 // pixels de texture par unité
export const PAD = 4 // marge en unités pour le contour
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

function shapesTexture(scene, key, shapes, w, h) {
  const [c, ctx] = canvas((w + PAD * 2) * BEAVER_RES, (h + PAD * 2) * BEAVER_RES)
  ctx.scale(BEAVER_RES, BEAVER_RES)
  ctx.translate(PAD, PAD)
  paintShapes(ctx, shapes)
  addCanvas(scene, key, c)
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

export function makeBeaverTextures(scene) {
  shapesTexture(scene, 'bv-front', BEAVER_FRONT, 100, 100)
  shapesTexture(scene, 'bv-front-happy', BEAVER_FRONT_HAPPY, 100, 100)
  shapesTexture(scene, 'bv-front-carry', BEAVER_FRONT_CARRY, 100, 100)
  shapesTexture(scene, 'bv-back', BEAVER_BACK, 100, 100)
  shapesTexture(scene, 'bv-paws-front', BEAVER_PAWS_FRONT, 100, 100)
  shapesTexture(scene, 'bv-paws-back', BEAVER_PAWS_BACK, 100, 100)
  shapesTexture(scene, 'beaver-foot', BEAVER_FOOT, FOOT_FRAME.w, FOOT_FRAME.h)
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

  // Galet lisse
  ;[c, ctx] = canvas(90, 60)
  g = ctx.createRadialGradient(34, 26, 2, 45, 38, 44)
  g.addColorStop(0, '#e1e8f0')
  g.addColorStop(0.55, '#a9b5c4')
  g.addColorStop(1, '#7f8c9e')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(45, 38, 38, 19, 0, 0, TAU)
  ctx.fill()
  addCanvas(scene, 'rock', c)

  // Hutte de castor : dôme lisse posé dans l'eau (base à y = 140, comme l'origine de l'image)
  ;[c, ctx] = canvas(260, 160)
  const cx = 130
  const base = 140
  // reflet et anneau d'écume sur l'eau
  ctx.fillStyle = 'rgba(20,70,110,0.16)'
  ctx.beginPath()
  ctx.ellipse(cx, base + 6, 120, 13, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath()
  ctx.ellipse(cx, base, 126, 15, 0, 0, TAU)
  ctx.fill()
  // dôme
  const dome = () => {
    ctx.beginPath()
    ctx.ellipse(cx, base, 116, 110, 0, Math.PI, TAU)
    ctx.closePath()
  }
  g = ctx.createRadialGradient(92, 52, 8, cx, base, 150)
  g.addColorStop(0, '#d29a63')
  g.addColorStop(0.5, '#a56d3e')
  g.addColorStop(1, '#6f4527')
  dome()
  ctx.fillStyle = g
  ctx.fill()
  // rondins suggérés par des bandes de ton qui suivent le dôme
  ctx.save()
  dome()
  ctx.clip()
  for (const k of [0.8, 0.58, 0.36]) {
    ctx.beginPath()
    ctx.ellipse(cx, base, 116 * k, 110 * k, 0, Math.PI, TAU)
    ctx.strokeStyle = 'rgba(70,40,18,0.18)'
    ctx.lineWidth = 10
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(cx, base, 116 * k + 7, 110 * k + 7, 0, Math.PI * 1.08, Math.PI * 1.7)
    ctx.strokeStyle = 'rgba(255,225,180,0.2)'
    ctx.lineWidth = 3
    ctx.stroke()
  }
  // lumière douce en haut à gauche
  g = ctx.createRadialGradient(96, 46, 0, 96, 46, 60)
  g.addColorStop(0, 'rgba(255,240,210,0.3)')
  g.addColorStop(1, 'rgba(255,240,210,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 260, 160)
  ctx.restore()
  // entrée en arche, avec un encadrement de bois clair
  const arch = (x0, x1, top) => {
    const r = (x1 - x0) / 2
    ctx.beginPath()
    ctx.moveTo(x0, base)
    ctx.lineTo(x0, top + r)
    ctx.arc(x0 + r, top + r, r, Math.PI, TAU)
    ctx.lineTo(x1, base)
    ctx.closePath()
  }
  arch(64, 126, 86)
  ctx.fillStyle = '#c28b58'
  ctx.fill()
  arch(72, 118, 95)
  g = ctx.createLinearGradient(0, 95, 0, base)
  g.addColorStop(0, '#1d1209')
  g.addColorStop(1, '#3d2513')
  ctx.fillStyle = g
  ctx.fill()
  // bouts de rondins à la base
  for (const [x, rr] of [
    [34, 12],
    [150, 13],
    [180, 11],
    [210, 13],
  ]) {
    g = ctx.createRadialGradient(x - 3, base - 14, 1, x, base - 12, rr)
    g.addColorStop(0, '#f3d4a6')
    g.addColorStop(0.6, '#d19e68')
    g.addColorStop(1, '#a8733f')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, base - 12, rr, 0, TAU)
    ctx.fill()
    ctx.fillStyle = 'rgba(120,70,30,0.18)'
    ctx.beginPath()
    ctx.arc(x, base - 12, rr * 0.45, 0, TAU)
    ctx.fill()
  }
  // mousse
  for (const [x, y, rr] of [
    [150, 44, 20],
    [176, 62, 13],
    [128, 36, 10],
  ]) {
    g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr)
    g.addColorStop(0, '#a6e889')
    g.addColorStop(1, '#5fb84c')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(x, y, rr, rr * 0.7, 0, 0, TAU)
    ctx.fill()
  }
  addCanvas(scene, 'lodge', c)
}
