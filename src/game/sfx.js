// Bruitages synthétisés avec la Web Audio API : aucun fichier son à charger.
// Coupés depuis les paramètres de l'accueil (save.sound).

import { save } from '../store.js'

let ctx = null
let out = null // sortie commune : volume général + compresseur (évite la saturation quand les sons s'empilent)
const last = {} // dernier déclenchement de chaque son, pour limiter les répétitions

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 6
    out = ctx.createGain()
    out.gain.value = 0.8
    out.connect(comp).connect(ctx.destination)
  }
  // le navigateur suspend l'audio tant que le joueur n'a pas touché l'écran
  if (ctx.state === 'suspended' && !paused) ctx.resume()
  return ctx
}

// Débloque l'audio au premier contact (obligatoire sur mobile)
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => audio(), { once: true, capture: true })
}

let paused = false

/** Appli en arrière-plan : suspend l'audio (et le relance au retour). */
export function setAudioPaused(value) {
  paused = value
  if (!ctx) return
  if (paused) ctx.suspend()
  else ctx.resume()
}

/** Renvoie le contexte audio si le son peut être joué (activé, pas trop rapproché du précédent). */
function ready(name, minGap) {
  if (!save.sound) return null
  const ac = audio()
  if (!ac || ac.state !== 'running') return null
  const t = ac.currentTime
  if (t - (last[name] ?? -1) < minGap) return null
  last[name] = t
  return ac
}

/** Une note : enveloppe percussive, glissement de hauteur optionnel. */
function tone(ac, { freq, to, type = 'sine', at = 0, dur = 0.12, vol = 0.3, attack = 0.006, slide = dur * 0.4 }) {
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + slide)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

const jitter = (x, amount = 0.06) => x * (1 - amount + Math.random() * amount * 2)

/**
 * « Pop » d'un cube posé : sinus bref dont la hauteur remonte vite, comme une bulle.
 * `height` (0 à 1) monte légèrement la note quand le cube est posé haut dans le dessin.
 */
export function pop(height = 0) {
  const ac = ready('pop', 0.03) // plusieurs cubes au même instant : un seul pop
  if (!ac) return
  const base = jitter(330 * (1 + height * 0.5))
  tone(ac, { freq: base, to: base * 2.3, dur: 0.12, vol: 0.35, slide: 0.045 })
}

/** Une équipe part au chantier : petit « bloup » montant. */
export function send() {
  const ac = ready('send', 0.05)
  if (!ac) return
  tone(ac, { freq: 440, to: 660, type: 'triangle', dur: 0.09, vol: 0.28, slide: 0.05 })
  tone(ac, { freq: 660, to: 990, type: 'triangle', at: 0.06, dur: 0.1, vol: 0.22, slide: 0.05 })
}

/** Action refusée (chantier plein, pas assez de noisettes) : deux petits « bop » graves. */
export function refuse() {
  const ac = ready('refuse', 0.25)
  if (!ac) return
  tone(ac, { freq: 220, to: 190, type: 'triangle', dur: 0.09, vol: 0.3 })
  tone(ac, { freq: 190, to: 160, type: 'triangle', at: 0.11, dur: 0.12, vol: 0.3 })
}

/** Toucher un bouton de l'interface : clic très discret. */
export function tap() {
  const ac = ready('tap', 0.04)
  if (!ac) return
  tone(ac, { freq: 900, to: 700, dur: 0.045, vol: 0.12 })
}

/** Indice : scintillement (arpège aigu). */
export function sparkle() {
  const ac = ready('sparkle', 0.3)
  if (!ac) return
  ;[1047, 1319, 1568, 2093].forEach((freq, n) => tone(ac, { freq, at: n * 0.07, dur: 0.3, vol: 0.14 }))
}

/** Chantier bloqué : petite phrase descendante, un peu déçue. */
export function stuck() {
  const ac = ready('stuck', 1)
  if (!ac) return
  ;[392, 330, 262].forEach((freq, n) => tone(ac, { freq, type: 'triangle', at: n * 0.16, dur: n === 2 ? 0.5 : 0.18, vol: 0.28 }))
}

/** Dessin terminé : fanfare joyeuse (do mi sol do), doublée à l'octave, et quelques étincelles. */
export function win() {
  const ac = ready('win', 1)
  if (!ac) return
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, n) => {
    const dur = n === notes.length - 1 ? 0.7 : 0.16
    tone(ac, { freq, type: 'triangle', at: n * 0.12, dur, vol: 0.3 })
    tone(ac, { freq: freq * 2, at: n * 0.12, dur, vol: 0.08 })
  })
  ;[1568, 2093, 2637].forEach((freq, n) => tone(ac, { freq, at: 0.55 + n * 0.09, dur: 0.35, vol: 0.1 }))
}

/** Récompense (noisettes gagnées ou achetées) : « cling » de pièce. */
export function coin() {
  const ac = ready('coin', 0.15)
  if (!ac) return
  tone(ac, { freq: 988, dur: 0.1, vol: 0.2 })
  tone(ac, { freq: 1319, at: 0.08, dur: 0.35, vol: 0.2 })
}
