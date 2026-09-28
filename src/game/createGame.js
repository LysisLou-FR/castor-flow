import Phaser from 'phaser'
import { GameScene } from './GameScene.js'
import { generateCrews } from './logic.js'

/**
 * Monte une partie Phaser dans un élément HTML.
 *
 * `state` est un objet réactif Vue partagé avec la scène :
 *   lanes    : files d'équipes en attente  [[{ id, color, count }]]
 *   slots    : places du chantier          [{ id, color, count, remaining, waiting } | null]
 *   progress : 0 → 1
 *   status   : 'playing' | 'stuck' | 'won'
 * Phaser le modifie, Vue l'affiche. Vue agit sur le jeu via l'API renvoyée.
 */
export function createGame(parent, { level, levelIndex, parsed, state, onWin, onLose }) {
  Object.assign(state, {
    lanes: generateCrews(parsed, level), // graine et difficulté propres au niveau
    slots: new Array(level.slots).fill(null),
    progress: 0,
    status: 'playing',
    hint: false, // bonus « Indice » en cours
  })

  // Canvas à la résolution réelle de l'écran (net sur les téléphones haute densité)
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  const size = () => [Math.max(2, Math.round(parent.clientWidth * dpr)), Math.max(2, Math.round(parent.clientHeight * dpr))]
  const [width, height] = size()

  const bridge = { scene: null, onWin, onLose, insetTop: 64 * dpr }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    transparent: true, // le ciel est dessiné en CSS derrière le canvas
    banner: false,
    scale: { mode: Phaser.Scale.NONE },
    audio: { noAudio: true }, // les sons passent par sfx.js (Web Audio), pas par Phaser
  })
  game.scene.add('game', GameScene, true, { level, levelIndex, parsed, state, bridge })

  const observer = new ResizeObserver(() => {
    const [w, h] = size()
    if (w !== game.scale.width || h !== game.scale.height) game.scale.resize(w, h)
  })
  observer.observe(parent)

  if (import.meta.env.DEV) window.cubiverDebug = bridge // inspection depuis la console du navigateur

  return {
    sendLane: (lane) => bridge.scene?.sendLane(lane) ?? false,
    addSlot: () => bridge.scene?.addSlot(),
    showHint: (ms) => bridge.scene?.showHint(ms),
    setPaused: (paused) => (paused ? game.pause() : game.resume()),
    destroy: () => {
      observer.disconnect()
      game.destroy(true)
    },
  }
}
