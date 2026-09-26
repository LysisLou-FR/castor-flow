// Génère l'icône de l'appli : le castor (assets/icon-beaver.svg) sur un fond de cubes isométriques.
//   assets/icon-only.svg / .png  icône complète (anciens Android, base du Play Store)
//   assets/icon-background.png   calque de fond de l'icône adaptative (les cubes)
//   assets/icon-foreground.png   calque de premier plan (le castor), dans la zone de sécurité
//   assets/play-store-512.png    icône à envoyer sur la Google Play Console
// Puis : npx @capacitor/assets generate --android  (voir le script npm « icons »)
//
// `node scripts/build-icons.mjs --fix-android` (dernière étape de « npm run icons ») : @capacitor/assets
// ajoute un retrait de 16,7 % aux calques de l'icône adaptative et les produit trop petits, or nos calques
// sont déjà composés pour la zone de sécurité d'Android. On réécrit donc les déclarations sans retrait
// et les calques à la bonne taille (108 dp).
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { PALETTE } from '../src/game/levels.js'
import { hex, shade } from '../src/game/art.js'

if (process.argv.includes('--fix-android')) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    writeFileSync(`android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`, xml)
  }
  const densities = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
  for (const [name, factor] of Object.entries(densities)) {
    const size = Math.round(108 * factor)
    for (const layer of ['foreground', 'background']) {
      await sharp(`assets/icon-${layer}.png`).resize(size, size).png().toFile(`android/app/src/main/res/mipmap-${name}/ic_launcher_${layer}.png`)
    }
  }
  console.log('✓ icône adaptative Android : calques de 108 dp, sans retrait')
  process.exit(0)
}

// ---------- Réglages ----------
const BEAVER_SCALE = 0.74 // taille du castor dans l'icône complète (1 = dessin d'origine)
const ADAPTIVE_SCALE = 0.5 // taille du castor dans le calque adaptatif (Android n'en montre que 72/108)
const CUBE = 150 // largeur d'un cube du fond, en pixels (sur 1024)
const CUBE_COLORS = ['R', 'O', 'Y', 'G', 'B', 'P'].map((k) => PALETTE[k])

// ---------- Castor ----------
const beaverSvg = readFileSync('assets/icon-beaver.svg', 'utf8')
const group = (id) => {
  const match = beaverSvg.match(new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`))
  if (!match) throw new Error(`groupe « ${id} » introuvable dans icon-beaver.svg`)
  return match[1]
}
const HEAD_CENTER = [512, 522] // centre de la tête dans le dessin d'origine

const OUTLINE = 44 // épaisseur du contour blanc autour de la tête (unités du dessin d'origine)

/**
 * Le castor réduit, centré en (cx, cy). Pour le détacher des cubes : une ombre douce, puis un contour
 * blanc (la tête tracée une première fois avec un trait blanc épais, ton dessin est posé par-dessus).
 */
function beaver(scale, cx, cy) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-HEAD_CENTER[0]} ${-HEAD_CENTER[1]})">
    <ellipse cx="512" cy="600" rx="560" ry="440" fill="#3a2414" opacity="0.3" filter="url(#soft)" transform="translate(0 50)" />
    <g stroke="#ffffff" stroke-width="${OUTLINE * 2}" stroke-linejoin="round">${group('head')}</g>
    ${group('head')}
    ${group('face')}
  </g>`
}

// ---------- Fond de cubes isométriques ----------
function cubes(size, w, seed = 7) {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const top = w / 2 // hauteur du losange du dessus
  const h = w * 0.5625 // hauteur des faces
  const stepY = top / 2 + h
  let out = ''
  for (let row = -1, y = -top; y < size + top; row++, y += stepY) {
    for (let x = (row % 2) * (w / 2) - w / 2; x < size + w; x += w) {
      const c = CUBE_COLORS[Math.floor(rand() * CUBE_COLORS.length)]
      const p = (dx, dy) => `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`
      const T = p(w / 2, 0)
      const R = p(w, top / 2)
      const B = p(w / 2, top)
      const L = p(0, top / 2)
      const Rd = p(w, top / 2 + h)
      const Bd = p(w / 2, top + h)
      const Ld = p(0, top / 2 + h)
      out += `<polygon points="${B} ${R} ${Rd} ${Bd}" fill="${hex(c)}"/>`
      out += `<polygon points="${L} ${B} ${Bd} ${Ld}" fill="${hex(shade(c, -0.22))}"/>`
      out += `<polygon points="${T} ${R} ${B} ${L}" fill="${hex(shade(c, 0.3))}"/>`
    }
  }
  return out
}

const defs = `<defs>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="30"/></filter>
</defs>`
const svg = (content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${content}</svg>`

const icon = svg(cubes(1024, CUBE) + beaver(BEAVER_SCALE, 512, 540))
writeFileSync('assets/icon-only.svg', icon)

const outputs = [
  ['assets/icon-only.png', icon, 1024],
  // calque de fond : des cubes un peu plus petits, car Android n'en montre que le centre
  ['assets/icon-background.png', svg(cubes(1024, CUBE * 0.67)), 1024],
  ['assets/icon-foreground.png', svg(beaver(ADAPTIVE_SCALE, 512, 525)), 1024],
  ['assets/play-store-512.png', icon, 512],
]
for (const [file, source, size] of outputs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(file)
  console.log(`✓ ${file} (${size}×${size})`)
}
