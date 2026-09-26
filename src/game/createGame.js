import Phaser from 'phaser'
import { GameScene, HEIGHT, WIDTH } from './GameScene.js'

/**
 * Monte une partie Phaser dans un élément HTML et renvoie une petite API pour Vue.
 * Phaser -> Vue : les callbacks onProgress / onWin / onLose.
 * Vue -> Phaser : les méthodes renvoyées (addSlot, destroy).
 */
export function createGame(parent, { level, levelIndex, onProgress, onWin, onLose }) {
  const bridge = { scene: null, onProgress, onWin, onLose }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#9fd8ef',
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  })
  game.scene.add('game', GameScene, true, { level, levelIndex, bridge })
  if (import.meta.env.DEV) window.castorDebug = bridge // inspection depuis la console du navigateur

  return {
    addSlot: () => bridge.scene?.addSlot(),
    destroy: () => game.destroy(true),
  }
}
