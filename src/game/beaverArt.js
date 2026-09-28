// Le castor du jeu : ton dessin (assets/castor.svg), découpé en vues sans rien changer aux tracés.
//   - face    : le dessin tel quel (le castor qui revient du mur) ;
//   - dos     : corps, tête, oreilles, touffes et queue, sans le visage (le castor qui va au mur) ;
//   - pieds   : dessinés à part pour l'animation de marche.
// Repère « castor » : 100 × 100 unités, point au sol (entre les pieds) en (50, 92), comme avant.
import raw from '../../assets/castor.svg?raw'

export const PAD = 4 // marge autour du repère, en unités
export const BEAVER_RES = 1.8 // pixels de texture par unité

const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
const svg = doc.documentElement
const serialize = (el) => new XMLSerializer().serializeToString(el).replace(/ xmlns="[^"]*"/g, '')
// dégradés et masques : repris dans chaque vue (ils ne dessinent rien par eux-mêmes)
const DEFS = [...svg.children].filter((el) => el.tagName === 'defs' || el.tagName === 'mask').map(serialize).join('')
// éléments dessinés, dans l'ordre du fichier
const PARTS = [...svg.children].filter((el) => el.tagName !== 'defs' && el.tagName !== 'mask').map(serialize)

// Numéros des éléments de assets/castor.svg (ordre du fichier). À mettre à jour si le dessin change de structure.
const RANGE = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k)
const G = {
  tail: [0, 1],
  body: [2, 4], // pelage du corps (fond + contour)
  belly: [3],
  ears: [5, 7], // oreilles (sans l'intérieur)
  head: [9, 10, 32, 33], // tête (fond, contour, raccord)
  tufts: [38, 39, 46, 48], // touffes de poils des joues
  hair: [44, 45], // mèche sur le crâne
  footRight: [49, 50, 51],
  footLeft: [52, 53, 54],
  pawRight: [34, 35, 36, 37], // pattes posées sur le ventre
  pawLeft: [40, 41, 42, 43],
}
const EXPECTED_PARTS = 55
const valid = PARTS.length === EXPECTED_PARTS
if (!valid) console.warn(`[castor] ${PARTS.length} éléments dans castor.svg (attendu ${EXPECTED_PARTS}) : vue de dos simplifiée`)

// Placement du dessin dans le repère castor
const S = 0.0955 // unités par pixel du dessin
const FEET = { x: 445, y: 830 } // point au sol du dessin (entre les deux pieds)
const GROUND = { x: 50, y: 92 }
const at = (x, y) => ({ x: GROUND.x + (x - FEET.x) * S, y: GROUND.y + (y - FEET.y) * S })
const BODY_M = `matrix(${S} 0 0 ${S} ${GROUND.x - FEET.x * S} ${GROUND.y - FEET.y * S})`
const FOOT_CENTER = { x: 343, y: 814 } // centre du pied gauche du dessin
const FOOT_FRAME = { w: 18, h: 10 }
const FOOT_M = `matrix(${S} 0 0 ${S} ${FOOT_FRAME.w / 2 - FOOT_CENTER.x * S} ${FOOT_FRAME.h / 2 - FOOT_CENTER.y * S})`

const feet = [...G.footRight, ...G.footLeft]
const pick = (list) => list.map((i) => PARTS[i] ?? '').join('')
const paws = valid ? [...G.pawRight, ...G.pawLeft] : []
// pattes qui tiennent le cube : remontées et écartées sur ses côtés, un peu tournées vers lui
export const HOLD = {
  left: 'translate(-34 -52) rotate(14 400 665)',
  right: 'translate(30 -52) rotate(-14 585 660)',
}
const hold = (side, list) => (valid ? '<g transform="' + HOLD[side] + '">' + pick(list) + '</g>' : '')
const PAW_LEFT_HOLD = hold('left', G.pawLeft)
const PAW_RIGHT_HOLD = hold('right', G.pawRight)
const all = PARTS.map((_, i) => i)
// vue de face en couches, pour glisser le cube et les pattes entre elles :
// corps (queue, pelage, ventre), puis cube, patte droite, tête (qui passe par-dessus la patte droite), patte gauche
const BODY_PARTS = valid ? [...G.tail, ...G.body, ...G.belly] : []
const FRONT_BODY = pick(BODY_PARTS)
const FRONT_HEAD = pick(all.filter((i) => !feet.includes(i) && !paws.includes(i) && !BODY_PARTS.includes(i)))

/** Dessin complet (avec les pieds), pour l'interface. */
export const BEAVER_FULL = {
  m: BODY_M,
  defs: DEFS,
  whole: pick(all), // le dessin tel quel (castor les mains vides)
  // castor qui tient un cube : corps, [cube], patte droite, tête et pieds, patte gauche
  body: FRONT_BODY,
  pawRight: PAW_RIGHT_HOLD,
  head: FRONT_HEAD + pick(feet),
  pawLeft: PAW_LEFT_HOLD,
}
// de dos : la queue dépasse sur le côté (à droite, en miroir de la vue de face)
const BACK = valid
  ? pick([...G.body, ...G.ears, ...G.head, ...G.tufts, ...G.hair]) +
    `<g transform="translate(830 20) scale(-1 1)">${pick(G.tail)}</g>`
  : pick(all.filter((i) => !feet.includes(i)))

/** Position des éléments par rapport au point au sol du castor, en unités. */
const right = at(542, 804)
const left = at(343, 814)
export const BEAVER_RIG = {
  groundX: GROUND.x,
  groundY: GROUND.y,
  backFoot: { x: left.x - GROUND.x, y: left.y - GROUND.y },
  frontFoot: { x: right.x - GROUND.x, y: right.y - GROUND.y },
  // pied du cube, posé en équilibre sur le haut de la tête
  // pied du cube : de face, tenu dans les pattes contre le ventre ; de dos, porté sur le dos
  cube: { front: { x: at(492, 0).x - GROUND.x, y: at(0, 745).y - GROUND.y }, back: { x: at(440, 0).x - GROUND.x, y: at(0, 740).y - GROUND.y }, size: 21 },
}
/** Cadres de l'interface (unités castor) : sans cube et avec le cube sur la tête. */
export const BEAVER_VIEW = { x: 5, y: 10.5, w: 79, h: 85 }
export const BEAVER_VIEW_CARRY = BEAVER_VIEW // le cube tient dans le cadre du castor

function svgText(content, m, frame) {
  const { w, h } = frame
  return (
    // fill="none" comme la racine du dessin : les traits seuls (contours) ne sont pas remplis
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${-PAD} ${-PAD} ${w + PAD * 2} ${h + PAD * 2}"` +
    ` width="${(w + PAD * 2) * BEAVER_RES}" height="${(h + PAD * 2) * BEAVER_RES}">${DEFS}<g transform="${m}">${content}</g></svg>`
  )
}

/** Textures du castor, à charger dans le preload() de la scène : [clé, texte SVG, largeur, hauteur]. */
export const BEAVER_TEXTURES = [
  ['bv-front-body', svgText(FRONT_BODY, BODY_M, { w: 100, h: 100 }), 100, 100],
  ['bv-front-head', svgText(FRONT_HEAD, BODY_M, { w: 100, h: 100 }), 100, 100],
  ['bv-paws', svgText(pick(paws), BODY_M, { w: 100, h: 100 }), 100, 100], // pattes sur le ventre (mains vides)
  ['bv-paw-left-hold', svgText(PAW_LEFT_HOLD, BODY_M, { w: 100, h: 100 }), 100, 100],
  ['bv-paw-right-hold', svgText(PAW_RIGHT_HOLD, BODY_M, { w: 100, h: 100 }), 100, 100],
  ['bv-back', svgText(BACK, BODY_M, { w: 100, h: 100 }), 100, 100],
  ['bv-foot-front', svgText(pick(G.footLeft), FOOT_M, FOOT_FRAME), FOOT_FRAME.w, FOOT_FRAME.h],
  // de dos, on ne voit pas les griffes
  ['bv-foot-back', svgText(pick(G.footLeft.slice(0, 1)), FOOT_M, FOOT_FRAME), FOOT_FRAME.w, FOOT_FRAME.h],
]
