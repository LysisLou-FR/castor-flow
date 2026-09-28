// Événements de l'appli Android : bouton retour, passage en arrière-plan.
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { onBeforeUnmount, onMounted } from 'vue'

const isNative = Capacitor.isNativePlatform()

/* ---------- Bouton retour ---------- */

// Gestionnaires : le plus prioritaire (fenêtres > écrans), puis le plus récent, est appelé en premier.
// Chacun renvoie true s'il a traité l'appui.
const backHandlers = []
let order = 0

/** Composable : réagit au bouton retour tant que le composant est affiché. `priority` 10 = fenêtre, 0 = écran. */
export function useBack(fn, priority = 0) {
  const handler = { fn, priority, order: 0 }
  onMounted(() => {
    handler.order = order++
    backHandlers.push(handler)
  })
  onBeforeUnmount(() => backHandlers.splice(backHandlers.indexOf(handler), 1))
}

/** Renvoie true si un écran ou une fenêtre a traité l'appui. */
export function handleBack() {
  const sorted = [...backHandlers].sort((a, b) => b.priority - a.priority || b.order - a.order)
  return sorted.some((h) => h.fn())
}

/* ---------- Arrière-plan ---------- */

const pauseHandlers = new Set()

/** Appelle `fn(paused)` quand l'appli passe en arrière-plan (true) ou revient (false). Renvoie la désinscription. */
export function onAppPause(fn) {
  pauseHandlers.add(fn)
  return () => pauseHandlers.delete(fn)
}

const emitPause = (paused) => pauseHandlers.forEach((fn) => fn(paused))

export function initPlatform() {
  if (isNative) {
    // rien à fermer : l'appli passe en arrière-plan (comme le bouton d'accueil), sans perdre la partie
    App.addListener('backButton', () => handleBack() || App.minimizeApp())
    App.addListener('pause', () => emitPause(true))
    App.addListener('resume', () => emitPause(false))
  } else {
    // navigateur : Échap simule le bouton retour, l'onglet caché simule l'arrière-plan
    window.addEventListener('keydown', (e) => e.key === 'Escape' && handleBack())
    document.addEventListener('visibilitychange', () => emitPause(document.hidden))
  }
}
