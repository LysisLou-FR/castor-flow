import Phaser from 'phaser'
import { Board, CELL, EMPTY, generateCrews, parseLevel } from './logic.js'
import { createTextures } from './textures.js'

// Dimensions logiques du jeu (mises à l'échelle pour tenir sur l'écran)
export const WIDTH = 720
export const HEIGHT = 1180

const GRID_TOP = 30
const GROUND_Y = 600 // les castors construisent posés sur ce sol
const GRID_MAX_W = 660
const MAX_CELL = 54
const DECK_Y = 645
const SLOT_Y = 735
const QUEUE_Y = 900
const QUEUE_STEP = 100
const QUEUE_VISIBLE = 3
const CARD_W = 120
const SPEED = 0.9 // vitesse des castors, en px/ms
const DISPATCH_MS = 110 // un castor quitte chaque place du chantier toutes les 110 ms
const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  init({ level, levelIndex, bridge }) {
    this.level = level
    this.levelIndex = levelIndex
    this.bridge = bridge
  }

  create() {
    createTextures(this)
    this.bridge.scene = this

    this.parsed = parseLevel(this.level)
    this.board = new Board(this.parsed)
    this.lanes = generateCrews(this.parsed, { ...this.level, seed: this.levelIndex + 1 })
    this.slots = new Array(this.level.slots).fill(null)
    this.inFlight = 0
    this.state = 'playing' // playing | stuck | won

    const { w, h } = this.parsed
    this.cs = Math.floor(Math.min(GRID_MAX_W / w, (GROUND_Y - GRID_TOP) / h, MAX_CELL))
    this.gridX = (WIDTH - w * this.cs) / 2
    this.gridY = GROUND_Y - h * this.cs

    this.drawScenery()
    this.ghosts = this.add.graphics().setDepth(1)
    this.slotGfx = this.add.graphics().setDepth(3)
    this.redrawGhosts()
    this.layoutSlots(false)
    this.layoutLanes(false)

    this.time.addEvent({ delay: DISPATCH_MS, loop: true, callback: () => this.dispatch() })
    this.bridge.onProgress?.(0)
  }

  // ---------- Décor ----------

  drawScenery() {
    const g = this.add.graphics().setDepth(0)
    g.fillStyle(0xffffff, 0.8)
    for (const [x, y, s] of [[110, 90, 1], [560, 150, 1.3], [330, 60, 0.8]]) {
      if (y + 20 * s > this.gridY) continue // pas de nuage derrière le dessin
      g.fillEllipse(x, y, 110 * s, 34 * s).fillEllipse(x + 30 * s, y - 14 * s, 70 * s, 36 * s)
    }
    g.fillStyle(0x5dbb63).fillRect(0, GROUND_Y, WIDTH, 16)
    g.fillStyle(0x8b5a2b).fillRect(0, GROUND_Y + 16, WIDTH, DECK_Y - GROUND_Y - 16)
    g.fillStyle(0xc8955a).fillRect(0, DECK_Y, WIDTH, HEIGHT - DECK_Y)
    g.lineStyle(2, 0xb07f48)
    for (let y = DECK_Y + 60; y < HEIGHT; y += 60) g.lineBetween(0, y, WIDTH, y)

    const label = { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#6b4420' }
    this.add.text(30, DECK_Y + 12, 'CHANTIER', label).setDepth(3)
    this.add.text(30, QUEUE_Y - 100, 'ÉQUIPES DE CASTORS  ·  touche pour envoyer', label).setDepth(3)
  }

  cellCenter(i) {
    const col = i % this.parsed.w
    const row = Math.floor(i / this.parsed.w)
    return { x: this.gridX + (col + 0.5) * this.cs, y: this.gridY + (row + 0.5) * this.cs }
  }

  /** Silhouette du dessin : pâle pour les cases à faire, marquée pour les cases accessibles. */
  redrawGhosts() {
    const g = this.ghosts.clear()
    const frontier = new Set(this.board.frontierCells())
    const pad = 2
    this.parsed.cells.forEach((color, i) => {
      if (color === EMPTY || this.board.state[i] === CELL.BUILT) return
      const { x, y } = this.cellCenter(i)
      const s = this.cs - pad * 2
      const open = frontier.has(i)
      g.fillStyle(0x1b2a38, 0.18).fillRoundedRect(x - s / 2, y - s / 2, s, s, 6)
      g.fillStyle(this.parsed.colors[color], open ? 0.8 : 0.35)
      g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 6)
      if (open) {
        g.lineStyle(3, 0xffffff, 0.9)
        g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 6)
      }
    })
  }

  // ---------- Cartes d'équipe ----------

  makeCard(crew) {
    const color = this.parsed.colors[crew.color]
    const bg = this.add.image(0, 0, 'card').setTint(color)
    const disc = this.add.image(-26, -4, 'disc').setScale(0.95)
    const beaver = this.add.image(-26, -4, 'beaver').setScale(0.7)
    const count = this.add
      .text(28, -4, String(crew.count), {
        fontFamily: FONT,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a2a1a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
    crew.card = this.add.container(0, 0, [bg, disc, beaver, count]).setDepth(4)
    crew.countText = count
    crew.bg = bg
    return crew.card
  }

  slotLayout() {
    const n = this.slots.length
    const gap = 12
    const w = Math.min(CARD_W, (GRID_MAX_W - gap * (n - 1)) / n)
    const x0 = (WIDTH - (w * n + gap * (n - 1))) / 2 + w / 2
    return { w, pos: (s) => ({ x: x0 + s * (w + gap), y: SLOT_Y }) }
  }

  layoutSlots(animate) {
    const { w, pos } = this.slotLayout()
    this.slotGfx.clear()
    this.slots.forEach((crew, s) => {
      const p = pos(s)
      this.slotGfx.fillStyle(0x6b4420, 0.25).fillRoundedRect(p.x - w / 2, p.y - 44, w, 88, 16)
      this.slotGfx.lineStyle(3, 0x6b4420, 0.5).strokeRoundedRect(p.x - w / 2, p.y - 44, w, 88, 16)
      if (crew && !crew.arriving) this.moveCard(crew.card, p.x, p.y, w / CARD_W, 1, animate)
    })
  }

  layoutLanes(animate) {
    const k = this.lanes.length
    const laneW = GRID_MAX_W / k
    const baseScale = Math.min(1.2, (laneW - 20) / CARD_W)
    this.lanes.forEach((lane, l) => {
      const x = (WIDTH - GRID_MAX_W) / 2 + laneW * (l + 0.5)
      lane.forEach((crew, j) => {
        if (j >= QUEUE_VISIBLE) {
          crew.card?.setVisible(false)
          return
        }
        if (!crew.card) {
          this.makeCard(crew)
          crew.card.setPosition(x, QUEUE_Y + QUEUE_STEP * QUEUE_VISIBLE).setAlpha(0)
          crew.bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onTapLane(l))
        }
        crew.card.setVisible(true).setDepth(4 - j * 0.1)
        const scale = baseScale * (1 - j * 0.08)
        this.moveCard(crew.card, x, QUEUE_Y + j * QUEUE_STEP, scale, 1 - j * 0.3, animate)
      })
    })
  }

  moveCard(card, x, y, scale, alpha, animate) {
    if (!animate) {
      card.setPosition(x, y).setScale(scale).setAlpha(alpha)
      return
    }
    this.tweens.add({ targets: card, x, y, scale, alpha, duration: 220, ease: 'Cubic.easeOut' })
  }

  onTapLane(l) {
    if (this.state !== 'playing') return
    const lane = this.lanes[l]
    const crew = lane[0]
    const s = this.slots.indexOf(null)
    if (s === -1) {
      this.tweens.add({ targets: crew.card, x: crew.card.x + 10, duration: 50, yoyo: true, repeat: 3 })
      this.toast('Chantier plein !')
      return
    }
    lane.shift()
    crew.bg.disableInteractive()
    crew.remaining = crew.count
    crew.arriving = true
    this.slots[s] = crew
    const { w, pos } = this.slotLayout()
    const p = pos(s)
    crew.card.setDepth(5)
    this.tweens.add({
      targets: crew.card,
      x: p.x,
      y: p.y,
      scale: w / CARD_W,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        crew.arriving = false
        crew.card.setDepth(4)
      },
    })
    this.layoutLanes(true)
  }

  // ---------- Construction ----------

  dispatch() {
    if (this.state !== 'playing') return
    const { pos } = this.slotLayout()
    this.slots.forEach((crew, s) => {
      if (!crew || crew.arriving) return
      const from = pos(s)
      const preferCol = Math.floor((from.x - this.gridX) / this.cs)
      const i = this.board.findTarget(crew.color, preferCol)
      if (i === -1) return
      this.board.claim(i)
      crew.remaining--
      crew.countText.setText(String(crew.remaining))
      this.sendBeaver(from, i, crew.color)
      if (crew.remaining === 0) {
        this.slots[s] = null
        this.tweens.add({ targets: crew.card, scale: 0, alpha: 0, duration: 200, onComplete: () => crew.card.destroy() })
      }
    })
    this.redrawGhosts()
    this.checkStuck()
  }

  sendBeaver(from, i, color) {
    const target = this.cellCenter(i)
    const bs = Math.max(this.cs * 1.1, 44) / 72
    const logOffset = -34 * bs
    const beaver = this.add.image(0, 0, 'beaver').setScale(bs)
    const log = this.add.image(0, logOffset, 'block').setTint(this.parsed.colors[color])
    log.setScale((this.cs * 0.8) / 64)
    const unit = this.add.container(from.x, from.y, [beaver, log]).setDepth(10)
    this.inFlight++

    const dist = Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y - logOffset)
    this.tweens.add({ targets: beaver, angle: { from: -10, to: 10 }, duration: 130, yoyo: true, repeat: -1 })
    this.tweens.add({
      targets: unit,
      x: target.x,
      y: target.y - logOffset,
      duration: dist / SPEED,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        log.destroy()
        this.placeBlock(i)
        this.inFlight--
        this.tweens.killTweensOf(beaver)
        this.tweens.add({
          targets: unit,
          y: unit.y + 40,
          alpha: 0,
          scale: 0.5,
          duration: 280,
          onComplete: () => unit.destroy(),
        })
        this.checkStuck()
      },
    })
  }

  placeBlock(i) {
    this.board.build(i)
    const { x, y } = this.cellCenter(i)
    const block = this.add.image(x, y, 'block').setTint(this.parsed.colors[this.parsed.cells[i]])
    block.setDepth(2).setScale(0)
    this.tweens.add({ targets: block, scale: (this.cs - 2) / 64, duration: 220, ease: 'Back.easeOut' })
    ;(this.builtBlocks ??= []).push(block)
    this.redrawGhosts()
    this.bridge.onProgress?.(this.board.built / this.board.total)
    if (this.board.isComplete()) this.win()
  }

  /** Bloqué : toutes les places sont prises et aucune équipe ne peut construire. */
  checkStuck() {
    if (this.state !== 'playing' || this.inFlight > 0) return
    if (this.slots.some((crew) => !crew || crew.arriving)) return
    if (this.slots.some((crew) => this.board.findTarget(crew.color) !== -1)) return
    this.state = 'stuck'
    this.bridge.onLose?.()
  }

  /** Appelé par Vue après une pub récompensée ou un achat avec des noisettes. */
  addSlot() {
    this.slots.push(null)
    this.layoutSlots(true)
    this.state = 'playing'
  }

  win() {
    this.state = 'won'
    for (const block of this.builtBlocks) {
      this.tweens.add({
        targets: block,
        y: block.y - 14,
        duration: 180,
        yoyo: true,
        delay: (GROUND_Y - block.y) * 1.5,
        ease: 'Quad.easeOut',
      })
    }
    for (let n = 0; n < 50; n++) {
      const c = Phaser.Utils.Array.GetRandom(this.parsed.colors)
      const piece = this.add.image(Phaser.Math.Between(20, WIDTH - 20), -20, 'block').setTint(c)
      piece.setScale(Phaser.Math.FloatBetween(0.12, 0.25)).setDepth(20)
      this.tweens.add({
        targets: piece,
        y: Phaser.Math.Between(400, HEIGHT),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 2000),
        delay: Phaser.Math.Between(0, 500),
        onComplete: () => piece.destroy(),
      })
    }
    this.time.delayedCall(1500, () => this.bridge.onWin?.())
  }

  toast(message) {
    const t = this.add
      .text(WIDTH / 2, SLOT_Y - 70, message, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#6b4420',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(30)
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, delay: 500, duration: 500, onComplete: () => t.destroy() })
  }
}
