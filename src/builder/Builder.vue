<script setup>
// Map builder de Cubiver (outil de développement, lancé avec « npm run builder »).
// Lit et enregistre src/game/levels.json via le serveur de dev (plugin dans vite.config.js).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { hex } from '../game/art.js'
import { DIFFICULTIES, PALETTE } from '../game/levels.js'
import { generateCrews, parseLevel } from '../game/logic.js'
import { analyzeLevel } from '../game/study.js'
import { EMPTY_CELL, emptyArt, floodFill, resizeArt, setCell, shiftArt } from './grid.js'
import { imageToArt, loadImage } from './image.js'

const COLOR_NAMES = { R: 'Rouge', P: 'Rose', O: 'Orange', Y: 'Jaune', G: 'Vert', B: 'Bleu', W: 'Blanc', K: 'Encre', N: 'Brun', T: 'Beige' }
const KEYS = Object.keys(PALETTE)
const MIN_SIZE = 4
const MAX_SIZE = 20
const TOOLS = [
  { id: 'pencil', label: 'Crayon', key: 'B' },
  { id: 'eraser', label: 'Gomme', key: 'E' },
  { id: 'fill', label: 'Pot', key: 'G' },
  { id: 'picker', label: 'Pipette', key: 'I' },
]

const levels = ref([])
const current = ref(0)
const tool = ref('pencil')
const color = ref('R')
const dirty = ref(false)
const message = ref('')
const loading = ref(true)
const importColors = ref(6)
const size = ref({ w: 10, h: 10 })
const history = []
const future = []

const level = computed(() => levels.value[current.value])
const width = computed(() => level.value?.art[0].length ?? 0)
const height = computed(() => level.value?.art.length ?? 0)
const cellPx = computed(() => Math.max(14, Math.min(34, Math.floor(620 / Math.max(width.value, height.value)))))
const analysis = computed(() => (level.value ? analyzeLevel(level.value) : null))
const lanes = computed(() => (level.value && analysis.value.blocks ? generateCrews(parseLevel(level.value), level.value) : []))
const laneColors = computed(() => (level.value ? parseLevel(level.value).colors : []))

watch(level, (l) => l && (size.value = { w: l.art[0].length, h: l.art.length }), { immediate: true })

// ---------- Chargement, enregistrement ----------

onMounted(async () => {
  const res = await fetch('/__levels')
  levels.value = await res.json()
  loading.value = false
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

function onBeforeUnload(e) {
  if (dirty.value) e.preventDefault()
}

function flash(text) {
  message.value = text
  setTimeout(() => message.value === text && (message.value = ''), 2500)
}

async function save() {
  const clean = levels.value.map(({ name, difficulty, seed, crewSize, queues, slots, art }) => ({ name, difficulty, seed, crewSize, queues, slots, art }))
  const res = await fetch('/__levels', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(clean) })
  const out = await res.json()
  if (!res.ok) return flash(`Erreur : ${out.error}`)
  dirty.value = false
  flash(`Enregistré dans levels.json (${out.count} niveaux)`)
}

async function test() {
  await save()
  window.open(`/?play=${current.value}`, 'cubiver-test')
}

// ---------- Historique ----------

function snapshot() {
  history.push(JSON.stringify({ levels: levels.value, current: current.value }))
  if (history.length > 100) history.shift()
  future.length = 0
  dirty.value = true
}

function restore(from, to) {
  if (!from.length) return
  to.push(JSON.stringify({ levels: levels.value, current: current.value }))
  const state = JSON.parse(from.pop())
  levels.value = state.levels
  current.value = Math.min(state.current, levels.value.length - 1)
  dirty.value = true
}
const undo = () => restore(history, future)
const redo = () => restore(future, history)

/** Modifie le niveau courant (avec une entrée d'historique, sauf si `record` est faux). */
function update(changes, record = true) {
  if (record) snapshot()
  levels.value[current.value] = { ...level.value, ...changes }
}

// ---------- Dessin ----------

let painting = false

function applyTool(x, y, erase = false) {
  const t = erase ? 'eraser' : tool.value
  const art = level.value.art
  if (t === 'picker') {
    if (art[y][x] !== EMPTY_CELL) color.value = art[y][x]
    tool.value = 'pencil'
    return
  }
  const next = t === 'fill' ? floodFill(art, x, y, color.value) : setCell(art, x, y, t === 'eraser' ? EMPTY_CELL : color.value)
  if (next !== art) update({ art: next }, false)
}

function cellFrom(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  return el?.dataset?.x === undefined ? null : [Number(el.dataset.x), Number(el.dataset.y)]
}

function onPointerDown(e) {
  const cell = cellFrom(e)
  if (!cell) return
  e.preventDefault()
  snapshot() // un trait entier = une seule annulation
  painting = tool.value === 'pencil' || tool.value === 'eraser' || e.button === 2
  applyTool(...cell, e.button === 2)
  try {
    e.currentTarget.setPointerCapture(e.pointerId) // continuer le trait même si le pointeur sort de la grille
  } catch {
    // pointeur déjà relâché : rien à capturer
  }
}

function onPointerMove(e) {
  if (!painting) return
  const cell = cellFrom(e)
  if (cell) applyTool(...cell, (e.buttons & 2) !== 0)
}

function onPointerUp() {
  painting = false
}

// ---------- Niveaux ----------

const randomSeed = () => 1 + Math.floor(Math.random() * 99999)

function addLevel() {
  snapshot()
  const { defaults } = DIFFICULTIES.normal
  levels.value.push({ name: `Niveau ${levels.value.length + 1}`, difficulty: 'normal', seed: randomSeed(), ...defaults, art: emptyArt(10, 10) })
  current.value = levels.value.length - 1
}

function duplicateLevel() {
  snapshot()
  levels.value.splice(current.value + 1, 0, { ...JSON.parse(JSON.stringify(level.value)), name: `${level.value.name} (copie)` })
  current.value++
}

function deleteLevel() {
  if (levels.value.length <= 1 || !confirm(`Supprimer « ${level.value.name} » ?`)) return
  snapshot()
  levels.value.splice(current.value, 1)
  current.value = Math.min(current.value, levels.value.length - 1)
}

function moveLevel(delta) {
  const to = current.value + delta
  if (to < 0 || to >= levels.value.length) return
  snapshot()
  const [moved] = levels.value.splice(current.value, 1)
  levels.value.splice(to, 0, moved)
  current.value = to
}

function setDifficulty(difficulty) {
  update({ difficulty })
}

function applyDefaults() {
  update({ ...DIFFICULTIES[level.value.difficulty].defaults })
}

function applySize() {
  const w = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(size.value.w) || MIN_SIZE))
  const h = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Number(size.value.h) || MIN_SIZE))
  update({ art: resizeArt(level.value.art, w, h) })
}

function clearArt() {
  if (confirm('Effacer tout le dessin ?')) update({ art: emptyArt(width.value, height.value) })
}

async function importImage(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    const img = await loadImage(file)
    update({ art: imageToArt(img, width.value, height.value, { maxColors: importColors.value }) })
    flash(`Image importée en ${width.value} × ${height.value}`)
  } catch (err) {
    flash(`Erreur : ${err.message}`)
  }
}

// ---------- Raccourcis clavier ----------

function onKey(e) {
  if (e.target instanceof Element && e.target.closest('input, select, textarea')) return // on écrit dans un champ
  const key = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && key === 's') {
    e.preventDefault()
    save()
  } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
  } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
    e.preventDefault()
    redo()
  } else if (!e.ctrlKey && !e.metaKey) {
    const t = TOOLS.find((x) => x.key.toLowerCase() === key)
    if (t) tool.value = t.id
    const n = '1234567890'.indexOf(key)
    if (n !== -1 && KEYS[n]) {
      color.value = KEYS[n]
      if (tool.value === 'eraser' || tool.value === 'picker') tool.value = 'pencil'
    }
  }
}

const thumb = (art) => art.join('').split('').map((ch) => (ch === EMPTY_CELL ? null : hex(PALETTE[ch])))
</script>

<template>
  <div v-if="loading" class="loading">Chargement des niveaux…</div>
  <div v-else class="builder">
    <!-- Liste des niveaux -->
    <aside class="panel list">
      <header class="panel-head">
        <h1>Map builder</h1>
        <span class="dirty" :class="{ on: dirty }">{{ dirty ? 'Non enregistré' : 'À jour' }}</span>
      </header>
      <ol class="levels">
        <li v-for="(l, i) in levels" :key="i">
          <button class="level-item" :class="{ active: i === current }" @click="current = i">
            <span class="mini" :style="{ gridTemplateColumns: `repeat(${l.art[0].length}, 1fr)` }">
              <i v-for="(c, n) in thumb(l.art)" :key="n" :style="{ background: c }"></i>
            </span>
            <span class="level-text">
              <strong>{{ i + 1 }}. {{ l.name }}</strong>
              <small :class="`diff-${l.difficulty}`">{{ DIFFICULTIES[l.difficulty]?.label }}</small>
            </span>
          </button>
        </li>
      </ol>
      <div class="row">
        <button @click="addLevel">+ Nouveau</button>
        <button @click="duplicateLevel">Dupliquer</button>
      </div>
      <div class="row">
        <button title="Monter" @click="moveLevel(-1)">↑</button>
        <button title="Descendre" @click="moveLevel(1)">↓</button>
        <button class="danger" :disabled="levels.length <= 1" @click="deleteLevel">Supprimer</button>
      </div>
    </aside>

    <!-- Dessin -->
    <main class="canvas-area">
      <div class="toolbar">
        <div class="tools">
          <button v-for="t in TOOLS" :key="t.id" :class="{ active: tool === t.id }" :title="`${t.label} (${t.key})`" @click="tool = t.id">
            {{ t.label }}
          </button>
        </div>
        <div class="history">
          <button title="Annuler (Ctrl+Z)" @click="undo">↶</button>
          <button title="Rétablir (Ctrl+Y)" @click="redo">↷</button>
        </div>
      </div>

      <div class="palette">
        <button
          v-for="(k, n) in KEYS"
          :key="k"
          class="swatch"
          :class="{ active: color === k && tool !== 'eraser' }"
          :style="{ background: hex(PALETTE[k]) }"
          :title="`${COLOR_NAMES[k]} (${(n + 1) % 10})`"
          @click="((color = k), tool === 'eraser' || tool === 'picker' ? (tool = 'pencil') : null)"
        >
          <span>{{ (n + 1) % 10 }}</span>
        </button>
      </div>

      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${width}, ${cellPx}px)`, gridAutoRows: `${cellPx}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @contextmenu.prevent
      >
        <template v-for="(row, y) in level.art" :key="y">
          <i
            v-for="(ch, x) in row"
            :key="x"
            :data-x="x"
            :data-y="y"
            class="cell"
            :class="{ empty: ch === EMPTY_CELL }"
            :style="ch === EMPTY_CELL ? null : { background: hex(PALETTE[ch]) }"
          ></i>
        </template>
      </div>
      <p class="hint">Clic gauche : outil actif · clic droit : gomme · 1 à 0 : couleurs · Ctrl+S : enregistrer</p>

      <div class="row shift">
        <span>Décaler :</span>
        <button @click="update({ art: shiftArt(level.art, -1, 0) })">←</button>
        <button @click="update({ art: shiftArt(level.art, 1, 0) })">→</button>
        <button @click="update({ art: shiftArt(level.art, 0, -1) })">↑</button>
        <button @click="update({ art: shiftArt(level.art, 0, 1) })">↓</button>
        <button class="danger" @click="clearArt">Tout effacer</button>
      </div>
    </main>

    <!-- Réglages et analyse -->
    <aside class="panel settings">
      <label class="field">
        <span>Nom</span>
        <input :value="level.name" @change="update({ name: $event.target.value })" />
      </label>

      <div class="field">
        <span>Difficulté</span>
        <div class="segmented">
          <button
            v-for="(d, id) in DIFFICULTIES"
            :key="id"
            :class="[`diff-${id}`, { active: level.difficulty === id }]"
            @click="setDifficulty(id)"
          >
            {{ d.label }}
          </button>
        </div>
        <small class="muted">Mélange des équipes plus ou moins fort · récompense × {{ DIFFICULTIES[level.difficulty].reward }}</small>
      </div>

      <div class="field">
        <span>Taille de la grille</span>
        <div class="row">
          <input v-model.number="size.w" type="number" :min="MIN_SIZE" :max="MAX_SIZE" aria-label="Largeur" />
          <span>×</span>
          <input v-model.number="size.h" type="number" :min="MIN_SIZE" :max="MAX_SIZE" aria-label="Hauteur" />
          <button @click="applySize">Appliquer</button>
        </div>
      </div>

      <div class="field">
        <span>Importer une image</span>
        <div class="row">
          <label class="file">
            Choisir…
            <input type="file" accept="image/*" @change="importImage" />
          </label>
          <label class="inline">
            couleurs max
            <input v-model.number="importColors" type="number" min="1" max="10" />
          </label>
        </div>
        <small class="muted">L'image est réduite à la taille de la grille, avec les couleurs de la palette.</small>
      </div>

      <div class="field params">
        <span>Réglages du niveau</span>
        <label>Taille des équipes <input type="number" min="1" max="12" :value="level.crewSize" @change="update({ crewSize: Number($event.target.value) })" /></label>
        <label>Files d'équipes <input type="number" min="1" max="5" :value="level.queues" @change="update({ queues: Number($event.target.value) })" /></label>
        <label>Places au chantier <input type="number" min="1" max="8" :value="level.slots" @change="update({ slots: Number($event.target.value) })" /></label>
        <label>
          Graine du tirage
          <span class="row">
            <input type="number" min="1" :value="level.seed" @change="update({ seed: Number($event.target.value) })" />
            <button title="Nouveau tirage des équipes" @click="update({ seed: randomSeed() })">🎲</button>
          </span>
        </label>
        <button class="link" @click="applyDefaults">Réglages par défaut de la difficulté</button>
      </div>

      <div class="analysis" :class="analysis.solvable ? 'ok' : 'ko'">
        <strong>{{ analysis.solvable ? '✓ Faisable' : '✗ Infaisable' }}</strong>
        <span v-if="!analysis.blocks">Le dessin est vide.</span>
        <span v-else-if="analysis.solvable">avec {{ level.slots }} places au chantier</span>
        <span v-else>avec {{ level.slots }} places : ajoute des places, des files, ou change la graine</span>
        <dl>
          <dt>Blocs</dt><dd>{{ analysis.blocks }}</dd>
          <dt>Couleurs</dt><dd>{{ analysis.colors }}</dd>
          <dt>Équipes</dt><dd>{{ analysis.crews }}</dd>
          <dt>Places nécessaires</dt><dd>{{ analysis.minSlots ?? '> 8' }}</dd>
          <template v-if="analysis.blocks">
            <dt>Joueur moyen gagne</dt><dd>{{ Math.round(analysis.casualWin * 100) }} %</dd>
            <dt>Au hasard, gagne</dt><dd>{{ Math.round(analysis.randomWin * 100) }} %</dd>
            <dt>Difficulté ressentie</dt>
            <dd :class="{ mismatch: analysis.felt !== level.difficulty }">{{ DIFFICULTIES[analysis.felt].label }}</dd>
          </template>
        </dl>
        <small class="muted">
          « Places nécessaires » : le minimum pour un joueur parfait. « Joueur moyen » : envoie une équipe qui peut construire
          quand il en voit une, sinon au hasard ; pourcentage de parties gagnées sans acheter de place. <code>npm run study</code> pour
          l'étude complète.
        </small>
      </div>

      <div v-if="lanes.length" class="field">
        <span>Équipes, dans l'ordre d'arrivée</span>
        <div class="lanes">
          <div v-for="(lane, l) in lanes" :key="l" class="lane">
            <span v-for="crew in lane" :key="crew.id" class="crew" :style="{ background: hex(laneColors[crew.color]) }">{{ crew.count }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="primary" @click="save">Enregistrer</button>
        <button @click="test">Tester dans le jeu ▶</button>
      </div>
      <p v-if="message" class="message" role="status">{{ message }}</p>
    </aside>
  </div>
</template>
