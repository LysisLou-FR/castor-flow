import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS } from '../src/game/levels.js'
import { Board, CELL, generateCrews, parseLevel } from '../src/game/logic.js'

test('les colonnes se construisent de bas en haut', () => {
  const board = new Board(parseLevel({ name: 't', art: ['R.', 'RB'] }))
  assert.deepEqual(board.frontierCells(), [2, 3])
  board.claim(2)
  assert.equal(board.frontier(0), -1, 'colonne en cours : la case du dessus reste bloquée')
  board.build(2)
  assert.equal(board.frontier(0), 0)
  assert.equal(board.state[2], CELL.BUILT)
})

/** Joueur automatique « naïf » : prouve que chaque niveau est faisable. */
function autoplay(level) {
  const parsed = parseLevel(level)
  const board = new Board(parsed)
  const lanes = generateCrews(parsed, { ...level, seed: 1 })
  const slots = []
  for (let turn = 0; turn < 10000; turn++) {
    let progressed = true
    while (progressed) {
      progressed = false
      for (const crew of slots) {
        const i = crew.count > 0 ? board.findTarget(crew.color) : -1
        if (i === -1) continue
        board.claim(i)
        board.build(i)
        crew.count--
        progressed = true
      }
      for (let s = slots.length - 1; s >= 0; s--) if (slots[s].count === 0) slots.splice(s, 1)
    }
    if (board.isComplete()) return true
    if (slots.length >= level.slots) return false
    const fronts = lanes.filter((l) => l.length)
    const useful = fronts.find((l) => board.findTarget(l[0].color) !== -1) ?? fronts[0]
    if (!useful) return false
    slots.push({ ...useful.shift() })
  }
  return false
}

for (const level of LEVELS) {
  test(`niveau « ${level.name} » : équipes cohérentes et niveau faisable`, () => {
    const parsed = parseLevel(level)
    const lanes = generateCrews(parsed, { ...level, seed: 1 })
    const blocks = parsed.cells.filter((c) => c !== -1).length
    const beavers = lanes.flat().reduce((n, c) => n + c.count, 0)
    assert.equal(beavers, blocks, 'un castor par bloc')
    assert.ok(lanes.flat().every((c) => c.count <= level.crewSize))
    assert.ok(autoplay(level), 'le joueur automatique doit pouvoir finir le niveau')
  })
}
