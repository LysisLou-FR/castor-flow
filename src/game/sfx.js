// Bruitages synthétisés avec la Web Audio API : aucun fichier son à charger.
// Coupés depuis les paramètres de l'accueil (save.sound).

import { save } from '../store.js'

let ctx = null
let lastPop = 0

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // le navigateur suspend l'audio tant que le joueur n'a pas touché l'écran
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Débloque l'audio au premier contact (obligatoire sur mobile)
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => audio(), { once: true, capture: true })
}

/**
 * « Pop » d'un cube posé : sinus bref dont la hauteur remonte vite, comme une bulle.
 * `height` (0 à 1) monte légèrement la note quand le cube est posé haut dans le dessin.
 */
export function pop(height = 0) {
  if (!save.sound) return
  const ac = audio()
  if (!ac || ac.state !== 'running') return
  const t = ac.currentTime
  if (t - lastPop < 0.03) return // plusieurs cubes au même instant : un seul pop
  lastPop = t

  const base = 330 * (1 + height * 0.5) * (0.94 + Math.random() * 0.12)
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(base, t)
  osc.frequency.exponentialRampToValueAtTime(base * 2.3, t + 0.045)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.13)
}
