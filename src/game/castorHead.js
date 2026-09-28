// Tête du castor extraite de ton dessin assets/castor.svg : oreilles, tête, visage, touffes et mèche.
// Sert à l'icône de l'appli (scripts/build-icons.mjs) et à l'accueil (BeaverHead.vue).
// Sans DOM : marche dans le navigateur comme dans Node.

/** Découpe un SVG en éléments de premier niveau : { defs, parts } (defs = dégradés et masques). */
export function splitSvg(raw) {
  const body = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
  const defs = []
  const parts = []
  const tag = /<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g
  let depth = 0
  let start = 0
  let m
  while ((m = tag.exec(body))) {
    const [text, closing, name, selfClosing] = m
    if (!closing && depth === 0) start = m.index
    if (closing) depth--
    else if (!selfClosing) depth++
    if (depth !== 0) continue
    const element = body.slice(start, m.index + text.length)
    ;(name === 'defs' || name === 'mask' ? defs : parts).push(element)
  }
  return { defs: defs.join(''), parts }
}

// Numéros des éléments de castor.svg qui ne sont pas la tête (mêmes numéros que src/game/beaverArt.js)
const NOT_HEAD = [0, 1, 2, 3, 4, 34, 35, 36, 37, 40, 41, 42, 43, 49, 50, 51, 52, 53, 54] // queue, corps, pattes, pieds
// formes extérieures de la tête, pour le liseré blanc qui la détache du fond
const SILHOUETTE = [5, 7, 9, 38, 44, 46] // oreilles, tête, touffes des joues, mèche

/** Cadre de la tête dans le dessin (unités de castor.svg) : centre et largeur. */
export const HEAD_BOX = { cx: 450, cy: 290, w: 650 }

/** { defs, content, silhouette } : la tête dessinée, et sa silhouette en blanc (à tracer en dessous). */
export function castorHead(raw) {
  const { defs, parts } = splitSvg(raw)
  if (parts.length !== 55) throw new Error(`castor.svg : ${parts.length} éléments, attendu 55 (voir castorHead.js)`)
  const content = parts.filter((_, i) => !NOT_HEAD.includes(i)).join('')
  const silhouette = SILHOUETTE.map((i) =>
    parts[i].replace(/ (fill|stroke|stroke-width)="[^"]*"/g, '').replace(/^<(\w+)/, '<$1 fill="#ffffff"'),
  ).join('')
  return { defs, content, silhouette }
}
