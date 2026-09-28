import Phaser from 'phaser'
import { Board, EMPTY } from './logic.js'
import { paintIsland } from './island.js'
import * as sfx from './sfx.js'
import {
  BEAVER_RES,
  BEAVER_RIG,
  CUBE_TEX,
  PAD,
  makeBeaverTextures,
  makeCubeTexture,
  makeDecorTextures,
  makeGhostTexture,
  makeHintTexture,
  makeScaffoldTexture,
  ghostColor,
} from './art.js'

// ---------- Monde isométrique ----------
// Coordonnées monde : gx (vers le bas-droite de l'écran), gy (vers le bas-gauche), z (hauteur en cubes).
// Le mur de cubes est posé sur la rangée gx ∈ [0, 1] ; l'herbe s'étend devant, puis la rivière.

const CUBE_H = CUBE_TEX.h / CUBE_TEX.w // hauteur d'un cube, en largeur de tuile
const GRASS_END = 3.5
const BANK = 3.72
const ISLAND_END = 4.95
const THICK = 0.95
const STAND_X = 1.16 // les castors se tiennent là, contre la face du mur
const WALK_SPEED = 3.4 // tuiles par seconde
const CLIMB_SPEED = 5.5
const DISPATCH_MS = 110 // chaque équipe du chantier envoie au plus un castor toutes les 110 ms
const BEAVER_SIZE = 1 // taille d'un castor, en largeur de tuile
const GHOST_SIZE = 0.8 // taille des cubes du plan par rapport à une case (les cubes posés font 1)

const DEPTH = { ground: 0, ripple: 5, shadow: 90, wall: 100, actors: 200 }

const lerp = (a, b, t) => a + (b - a) * t
const u = (units) => units * BEAVER_RES // unités du castor -> pixels de texture

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  init({ level, levelIndex, parsed, state, bridge }) {
    this.level = level
    this.levelIndex = levelIndex
    this.parsed = parsed
    this.state = state
    this.bridge = bridge
  }

  create() {
    this.bridge.scene = this
    makeBeaverTextures(this)
    makeDecorTextures(this)
    makeGhostTexture(this, 'ghost')
    makeHintTexture(this, 'ghost-hint')
    makeScaffoldTexture(this, 'scaffold')
    this.parsed.colors.forEach((color, i) => makeCubeTexture(this, `cube-${i}`, color))

    this.board = new Board(this.parsed)
    this.w = this.parsed.w
    this.h = this.parsed.h
    this.GY = this.w + 2
    this.beavers = []
    this.cubes = []
    this.hintLeft = 0 // durée restante du bonus « Indice », en ms

    this.buildWall()
    this.buildDecor()
    this.relayout()

    this.scale.on('resize', this.relayout, this)
    this.time.addEvent({ delay: DISPATCH_MS, loop: true, callback: () => this.dispatch() })
  }

  // ---------- Projection ----------

  proj(gx, gy, z = 0) {
    return {
      x: this.ox + ((gx - gy) * this.tw) / 2,
      y: this.oy + ((gx + gy) * this.tw) / 4 - z * this.tw * CUBE_H,
    }
  }

  /** Colonne du mur (gy de départ) et hauteur (z) d'une case du dessin. */
  cellPos(i) {
    const col = i % this.w
    const row = Math.floor(i / this.w)
    return { gy0: 1 + (this.w - 1 - col), z: this.h - 1 - row }
  }

  /** Cadre la scène au mieux dans le canvas. Rappelé à chaque redimensionnement. */
  relayout() {
    const { width, height } = this.scale
    const GY = this.GY
    const pts = [
      [0, 0, 0],
      [ISLAND_END, 0, 0],
      [ISLAND_END, GY, -THICK],
      [0, GY, -THICK],
      [ISLAND_END, 0, -THICK],
      [0, 1, this.h],
      [1, GY - 1, this.h],
    ]
    const xs = pts.map(([gx, gy]) => (gx - gy) / 2)
    const ys = pts.map(([gx, gy, z]) => (gx + gy) / 4 - z * CUBE_H)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const top = this.bridge.insetTop ?? 0 // place laissée à l'en-tête flottant
    const avail = height - top
    this.tw = Math.min((width * 0.96) / (maxX - minX), (avail * 0.94) / (maxY - minY))
    this.ox = width / 2 - (this.tw * (minX + maxX)) / 2
    this.oy = top + avail / 2 - (this.tw * (minY + maxY)) / 2

    this.drawGround()
    const cubeScale = this.tw / CUBE_TEX.w
    for (const item of this.wallItems) {
      if (item.img.isGhost) {
        const c = this.proj(0.5, item.gy0 + 0.5, item.z + 0.5) // centre du cube
        item.img.setPosition(c.x, c.y).setScale(cubeScale * GHOST_SIZE)
        continue
      }
      const p = this.proj(0.5, item.gy0 + 0.5, item.z + 1)
      item.img.setPosition(p.x, p.y).setScale(cubeScale)
    }
    for (const d of this.decor) {
      const p = this.proj(d.gx, d.gy, d.z ?? 0)
      d.img.setPosition(p.x, p.y).setScale((this.tw * d.size) / d.img.width)
    }
  }

  // ---------- Décor ----------

  /** Peint le socle sur un canvas à la taille de la scène (rappelé à chaque redimensionnement). */
  drawGround() {
    const { width, height } = this.scale
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    paintIsland(canvas.getContext('2d'), (gx, gy, z) => this.proj(gx, gy, z), {
      GY: this.GY,
      GRASS_END,
      BANK,
      END: ISLAND_END,
      THICK,
      WALL_FROM: 0.7,
      WALL_TO: this.GY - 0.7,
    })
    if (this.textures.exists('island')) this.textures.remove('island')
    this.textures.addCanvas('island', canvas)
    if (this.ground) this.ground.setTexture('island')
    else this.ground = this.add.image(0, 0, 'island').setOrigin(0, 0).setDepth(DEPTH.ground)
  }

  buildDecor() {
    const GY = this.GY
    const at = (key, gx, gy, size, depth, originY = 1) => {
      const img = this.add.image(0, 0, key).setOrigin(0.5, originY).setDepth(depth)
      this.decor.push({ img, gx, gy, size })
      return img
    }
    this.decor = []
    at('rock', GRASS_END - 0.45, 0.45, 0.55, DEPTH.actors + (GRASS_END + 0.4) * 10, 0.8)
    at('rock', 2.4, GY - 0.35, 0.4, DEPTH.actors + (2.4 + GY) * 10, 0.8)
    at('lodge', 4.4, 1.5, 1.7, DEPTH.actors + (4.4 + 1.5) * 10, 0.875)

    // reflets qui scintillent sur la rivière
    for (let n = 0; n < 9; n++) {
      const img = at(
        'ripple',
        Phaser.Math.FloatBetween(BANK + 0.35, ISLAND_END - 0.25),
        Phaser.Math.FloatBetween(0.6, GY - 0.6),
        0.35,
        DEPTH.ripple,
        0.5,
      )
      img.setAlpha(0)
      this.tweens.add({
        targets: img,
        alpha: { from: 0, to: 0.7 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        delay: n * 450,
        ease: 'Sine.easeInOut',
      })
    }
  }

  /**
   * Plan du dessin et échafaudages. Les cubes fantômes sont opaques, dans une version pastel de leur
   * couleur, et triés en profondeur avec les cubes posés : chacun masque correctement ce qu'il cache,
   * et poser un cube revient simplement à masquer son fantôme (aucun redessin coûteux).
   */
  buildWall() {
    const { w, h, cells } = this.parsed
    this.wallItems = []
    this.ghosts = []
    const originY = (CUBE_TEX.top / 2 + CUBE_TEX.pad) / (CUBE_TEX.top + CUBE_TEX.h + CUBE_TEX.pad * 2)
    const add = (key, gy0, z) => {
      const order = gy0 * 0.5 + z * 0.02
      const img = this.add.image(0, 0, key).setOrigin(0.5, originY).setDepth(DEPTH.wall + order)
      img.order = order
      this.wallItems.push({ img, gy0, z })
      return img
    }
    this.cubeOrigin = originY
    for (let col = 0; col < w; col++) {
      let above = false
      for (let row = 0; row < h; row++) {
        const i = row * w + col
        const { gy0, z } = this.cellPos(i)
        if (cells[i] === EMPTY) {
          if (above) add('scaffold', gy0, z)
          continue
        }
        above = true
        // Fantôme plus petit que la case et centré : les cubes posés, pleins et jointifs, s'en distinguent
        // au premier coup d'œil. Chaque fantôme est donc visible en entier (dessus et flanc compris).
        const ghost = add('ghost', gy0, z)
        ghost.setOrigin(0.5, 0.5) // centre du cube, pour qu'il rétrécisse au milieu de sa case
        ghost.isGhost = true
        ghost.color = ghostColor(this.parsed.colors[cells[i]])
        this.ghosts[i] = ghost.setTint(ghost.color)
      }
    }
    this.hintImages = []
  }

  // ---------- Équipes et castors ----------

  /** Appelé par Vue quand le joueur touche une équipe. Renvoie false si le chantier est plein. */
  sendLane(l) {
    const { state } = this
    if (state.status !== 'playing') return false
    const lane = state.lanes[l]
    const s = state.slots.indexOf(null)
    if (!lane?.length || s === -1) return false
    const crew = lane.shift()
    crew.remaining = crew.count
    crew.waiting = false
    state.slots[s] = crew
    return true
  }

  /** Bonus « Indice » : illumine les cases accessibles pendant `ms` millisecondes. */
  showHint(ms) {
    this.hintLeft = ms
    this.state.hint = true
    sfx.sparkle()
  }

  updateHint(time, delta) {
    if (this.hintLeft <= 0 && !this.hintShown) return
    this.hintLeft -= delta
    const active = this.hintLeft > 0
    // recalculé à chaque image : un cube posé débloque aussitôt la case du dessus
    const open = new Set(active ? this.board.frontierCells() : [])
    // Chaque case accessible montre le vrai cube (vraie couleur, même taille que le cube du plan)
    // entouré d'un halo blanc, qui pulse et rebondit légèrement : bien visible, quel que soit le dessin.
    const s = 0.5 + 0.5 * Math.sin(time * 0.008)
    this.ghosts.forEach((ghost, i) => {
      let hint = this.hintImages[i]
      if (!open.has(i)) {
        hint?.cube.setVisible(false)
        hint?.glow.setVisible(false)
        return
      }
      // origine au centre du cube (textures de marges symétriques) : calé exactement sur le fantôme
      hint ??= this.hintImages[i] = {
        cube: this.add.image(0, 0, `cube-${this.parsed.cells[i]}`).setOrigin(0.5, 0.5),
        glow: this.add.image(0, 0, 'ghost-hint').setOrigin(0.5, 0.5),
      }
      const y = ghost.y - this.tw * 0.05 * s
      const depth = DEPTH.wall + ghost.order + 0.005
      hint.cube.setVisible(true).setPosition(ghost.x, y).setScale(ghost.scaleX).setAlpha(0.6 + 0.4 * s).setDepth(depth)
      hint.glow.setVisible(true).setPosition(ghost.x, y).setScale(ghost.scaleX).setAlpha(0.55 + 0.45 * s).setDepth(depth + 0.001)
    })
    this.hintShown = active
    if (!active) this.state.hint = false
  }

  /** Appelé par Vue après une pub récompensée ou un achat avec des noisettes. */
  addSlot() {
    this.state.slots.push(null)
    this.state.status = 'playing'
  }

  dispatch() {
    const { state } = this
    if (state.status !== 'playing') return
    const n = state.slots.length
    state.slots.forEach((crew, s) => {
      if (!crew) return
      const i = this.board.findTarget(crew.color, Math.round(((s + 0.5) / n) * this.w))
      const waiting = i === -1
      if (crew.waiting !== waiting) crew.waiting = waiting
      if (waiting) return
      this.board.claim(i)
      crew.remaining--
      this.spawnBeaver(i, crew.color)
      if (crew.remaining === 0) state.slots[s] = null
    })
    this.checkStuck()
  }

  /**
   * Bloqué : toutes les places sont prises et aucune équipe ne peut construire.
   * Annoncé seulement quand le dernier castor a replongé (dispatch() revérifie en boucle).
   */
  checkStuck() {
    const { state } = this
    if (state.status !== 'playing' || this.beavers.some((b) => !b.done)) return
    if (state.slots.some((crew) => !crew)) return
    if (state.slots.some((crew) => this.board.findTarget(crew.color) !== -1)) return
    state.status = 'stuck'
    sfx.stuck()
    this.bridge.onLose?.()
  }

  spawnBeaver(cell, color) {
    const { gy0, z } = this.cellPos(cell)
    const lane = gy0 + 0.5 + Phaser.Math.FloatBetween(-0.12, 0.12)
    const bodyOrigin = [(BEAVER_RIG.groundX + PAD) / (100 + PAD * 2), (BEAVER_RIG.groundY + PAD) / (100 + PAD * 2)]
    // les pieds sont derrière le corps : ils dépassent juste en dessous
    const backFoot = this.add.image(0, 0, 'beaver-foot')
    const frontFoot = this.add.image(0, 0, 'beaver-foot')
    const body = this.add.image(0, 0, 'bv-back').setOrigin(...bodyOrigin)
    const cube = this.add
      .image(0, 0, `cube-${color}`)
      .setOrigin(0.5, 1)
      .setScale(u(BEAVER_RIG.cube.size) / (CUBE_TEX.w + CUBE_TEX.pad * 2))
    // le cube est posé sur la tête, les pattes sont dessinées par-dessus pour le tenir
    const paws = this.add.image(0, 0, 'bv-paws-back').setOrigin(...bodyOrigin)
    const cont = this.add.container(0, 0, [backFoot, frontFoot, body, cube, paws])
    const shadow = this.add.image(0, 0, 'shadow').setDepth(DEPTH.shadow)

    const b = {
      id: this.beaverId = (this.beaverId ?? 0) + 1,
      cont,
      shadow,
      parts: { backFoot, body, frontFoot, cube, paws },
      carrying: true,
      happy: false,
      gx: BANK + 0.6,
      gy: lane,
      z: -0.45,
      alpha: 0,
      face: -1,
      phase: Math.random() * Math.PI * 2,
      seg: 0,
      t: 0,
      cell,
      segs: [
        // sort de l'eau devant sa colonne
        { to: [BANK - 0.05, lane, 0], dur: 0.36, arc: 0.4, anim: 'hop', alpha: 1, onStart: () => this.splash(BANK + 0.4, lane) },
        // marche jusqu'au mur
        { to: [STAND_X, lane, 0], speed: WALK_SPEED, anim: 'walk' },
        // grimpe le long de la pile
        { to: [STAND_X - 0.04, lane, z], speed: CLIMB_SPEED, anim: 'climb', onEnd: () => this.placeCube(b) },
        { to: [STAND_X - 0.04, lane, z], dur: 0.12, anim: 'idle' },
        // saute, repart et replonge
        { to: [STAND_X + 0.55, lane, 0], dur: 0.3 + z * 0.025, arc: 0.35, anim: 'hop', face: 1 },
        { to: [BANK - 0.05, lane, 0], speed: WALK_SPEED * 1.15, anim: 'walk', face: 1 },
        { to: [BANK + 0.55, lane, -0.45], dur: 0.32, arc: 0.3, anim: 'hop', alpha: 0, onEnd: () => this.splash(BANK + 0.45, lane) },
      ],
    }
    this.beavers.push(b)
    this.updateLook(b)
    this.renderBeaver(b)
  }

  stepBeaver(b, dt) {
    const seg = b.segs[b.seg]
    if (!seg.from) {
      seg.from = { gx: b.gx, gy: b.gy, z: b.z, alpha: b.alpha }
      if (seg.speed) {
        const [tx, ty, tz] = seg.to
        seg.dur = Math.max(0.06, Math.hypot(tx - b.gx, ty - b.gy, tz - b.z) / seg.speed)
      }
      if (seg.face) {
        b.face = seg.face
        this.updateLook(b)
      }
      seg.onStart?.(b)
    }
    b.t += dt
    const k = Math.min(1, b.t / seg.dur)
    const [tx, ty, tz] = seg.to
    b.gx = lerp(seg.from.gx, tx, k)
    b.gy = lerp(seg.from.gy, ty, k)
    b.z = lerp(seg.from.z, tz, k) + (seg.arc ? Math.sin(Math.PI * k) * seg.arc : 0)
    if (seg.alpha !== undefined) b.alpha = lerp(seg.from.alpha, seg.alpha, Math.min(1, k * 1.6))
    this.animateParts(b, seg.anim, dt, k)
    if (k >= 1) {
      b.t = 0
      b.seg++
      seg.onEnd?.(b)
      if (b.seg >= b.segs.length) b.done = true
    }
  }

  /** Vue (dos quand il va vers le mur, face quand il en revient) et expression du castor. */
  updateLook(b) {
    const view = b.face === 1 ? 'front' : 'back'
    const key = view === 'back' ? 'bv-back' : b.carrying ? 'bv-front-carry' : b.happy ? 'bv-front-happy' : 'bv-front'
    const { body, paws, cube } = b.parts
    if (body.texture.key !== key) body.setTexture(key)
    paws.setTexture(`bv-paws-${view}`).setVisible(b.carrying)
    cube.setVisible(b.carrying)
    b.view = view
  }

  /** Animation procédurale : pieds qui avancent dans la direction de marche, dandinement, rebond. */
  animateParts(b, anim, dt, k) {
    const { backFoot, body, frontFoot, cube, paws } = b.parts
    const rig = BEAVER_RIG
    const [dx, dy] = b.view === 'front' ? [1, 0.5] : [-1, -0.5] // direction de marche à l'écran
    let bodyY = 0
    let rot = 0
    let front = [0, 0]
    let back = [0, 0]
    if (anim === 'walk') {
      b.phase += dt * 16
      const s = Math.sin(b.phase)
      front = [dx * s * 3.5, dy * s * 3.5 - Math.max(0, s) * 2.5]
      back = [-dx * s * 3.5, -dy * s * 3.5 - Math.max(0, -s) * 2.5]
      bodyY = -Math.abs(s) * 2.2
      rot = s * 0.06 // petit dandinement
    } else if (anim === 'climb') {
      b.phase += dt * 22
      const s = Math.sin(b.phase)
      front = [2, -(0.5 + 0.5 * s) * 5]
      back = [-2, -(0.5 - 0.5 * s) * 5]
      bodyY = -Math.abs(s) * 1.5
      rot = s * 0.05
    } else if (anim === 'hop') {
      const squash = Math.sin(Math.PI * k)
      front = [2, -3 * squash]
      back = [-2, -3 * squash]
      bodyY = -1.5 * squash
    } else {
      b.phase += dt * 5
      bodyY = Math.sin(b.phase) * 0.8
    }
    frontFoot.setPosition(u(rig.frontFoot.x + front[0]), u(rig.frontFoot.y + front[1]))
    backFoot.setPosition(u(rig.backFoot.x + back[0]), u(rig.backFoot.y + back[1]))
    body.setPosition(0, u(bodyY)).setRotation(rot)
    paws.setPosition(0, u(bodyY)).setRotation(rot)
    // le cube suit la tête : même rotation, autour du même pivot (le point au sol)
    const c = rig.cube[b.view]
    cube
      .setPosition(u(c.x * Math.cos(rot) - c.y * Math.sin(rot)), u(c.x * Math.sin(rot) + c.y * Math.cos(rot) + bodyY))
      .setRotation(rot)
  }

  renderBeaver(b) {
    const p = this.proj(b.gx, b.gy, b.z)
    const s = (this.tw * BEAVER_SIZE) / u(100)
    b.cont
      .setPosition(p.x, p.y)
      .setScale(s, s)
      .setAlpha(b.alpha)
      .setDepth(DEPTH.actors + (b.gx + b.gy) * 10 + b.id * 1e-5)
    const g = this.proj(b.gx, b.gy, 0)
    const onLand = b.gx < BANK + 0.05
    b.shadow
      .setPosition(g.x, g.y)
      .setScale((this.tw * 0.62) / 128)
      .setAlpha(onLand ? Math.max(0, 1 - Math.max(0, b.z) * 0.35) * Math.min(1, b.alpha * 1.5) : 0)
  }

  /** Le castor lâche son cube : il se pose dans le mur avec un petit rebond et de la poussière. */
  placeCube(b) {
    b.carrying = false
    b.happy = true // il repartira tout content, de face
    this.updateLook(b)
    const i = b.cell
    this.board.build(i)
    const { gy0, z } = this.cellPos(i)
    const p = this.proj(0.5, gy0 + 0.5, z + 1)
    const scale = this.tw / CUBE_TEX.w
    const img = this.add
      .image(p.x, p.y - this.tw * 0.35, `cube-${this.parsed.cells[i]}`)
      .setOrigin(0.5, this.cubeOrigin)
      .setDepth(DEPTH.wall + gy0 * 0.5 + z * 0.02 + 0.01)
      .setScale(scale * 0.7)
    const ghost = this.ghosts[i]
    // le fantôme reste visible sous le cube qui tombe, puis disparaît quand le cube est en place
    // « pop » quand le cube touche sa place, un peu plus aigu en haut du dessin
    this.tweens.add({
      targets: img,
      y: p.y,
      scale,
      duration: 190,
      ease: 'Back.easeOut',
      onComplete: () => {
        ghost.setVisible(false)
        sfx.pop(z / Math.max(1, this.parsed.h - 1))
      },
    })
    this.wallItems.push({ img, gy0, z })
    this.cubes.push(img)

    for (let n = 0; n < 3; n++) {
      const d = this.proj(1.02, gy0 + 0.2 + n * 0.3, z)
      const puff = this.add
        .image(d.x, d.y, 'puff')
        .setDepth(DEPTH.actors - 1)
        .setScale(this.tw / 400)
        .setAlpha(0.9)
      this.tweens.add({
        targets: puff,
        x: d.x + (n - 1) * this.tw * 0.18,
        y: d.y - this.tw * 0.12,
        scale: this.tw / 160,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      })
    }

    this.state.progress = this.board.built / this.board.total
    if (this.board.isComplete()) this.win()
    else this.checkStuck()
  }

  splash(gx, gy) {
    const p = this.proj(gx, gy, 0)
    const ring = this.add
      .image(p.x, p.y, 'ripple')
      .setDepth(DEPTH.ripple + 1)
      .setScale(this.tw / 900)
    this.tweens.add({
      targets: ring,
      scale: this.tw / 200,
      alpha: 0,
      duration: 480,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    })
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000
    this.updateHint(time, delta)
    for (const b of this.beavers) {
      this.stepBeaver(b, dt)
      this.renderBeaver(b)
    }
    if (this.beavers.some((b) => b.done)) {
      this.beavers = this.beavers.filter((b) => {
        if (!b.done) return true
        b.cont.destroy()
        b.shadow.destroy()
        return false
      })
    }
  }

  win() {
    this.state.status = 'won'
    sfx.win()
    const cubes = this.cubes
    cubes.forEach((img, n) => {
      this.tweens.add({
        targets: img,
        y: img.y - this.tw * 0.18,
        duration: 220,
        yoyo: true,
        delay: 250 + (n % 40) * 18,
        ease: 'Quad.easeOut',
      })
    })
    const { width, height } = this.scale
    for (let n = 0; n < 70; n++) {
      const piece = this.add
        .image(Phaser.Math.Between(0, width), -30, 'confetti')
        .setTint(Phaser.Utils.Array.GetRandom(this.parsed.colors))
        .setScale(this.tw / 60)
        .setDepth(10000)
      this.tweens.add({
        targets: piece,
        y: Phaser.Math.FloatBetween(height * 0.5, height),
        x: piece.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-540, 540),
        alpha: 0,
        duration: Phaser.Math.Between(1400, 2400),
        delay: Phaser.Math.Between(0, 600),
        ease: 'Sine.easeIn',
        onComplete: () => piece.destroy(),
      })
    }
    this.time.delayedCall(1700, () => this.bridge.onWin?.())
  }
}
