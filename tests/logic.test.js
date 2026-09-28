import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DIFFICULTIES, LEVELS, PALETTE } from '../src/game/levels.js'
import { Board, CELL, generateCrews, parseLevel } from '../src/game/logic.js'
import { solve } from '../src/game/study.js'

test('les colonnes se construisent de bas en haut', () => {
  const board = new Board(parseLevel({ name: 't', art: ['R.', 'RB'] }))
  assert.deepEqual(board.frontierCells(), [2, 3])
  board.claim(2)
  assert.equal(board.frontier(0), -1, 'colonne en cours : la case du dessus reste bloquée')
  board.build(2)
  assert.equal(board.frontier(0), 0)
  assert.equal(board.state[2], CELL.BUILT)
})

test('le mélange des équipes est plus fort en difficulté supérieure', () => {
  const art = Array.from({ length: 8 }, () => 'RGBYOPRGBYOP')
  const order = (difficulty) =>
    generateCrews(parseLevel({ name: 't', art }), { crewSize: 3, queues: 1, seed: 3, difficulty })[0].map((c) => c.id)
  const displacement = (ids) => ids.reduce((sum, id, i) => sum + Math.abs(id - i), 0)
  assert.ok(displacement(order('hard')) > displacement(order('normal')))
  assert.ok(displacement(order('superhard')) > displacement(order('hard')))
})

for (const [n, level] of LEVELS.entries()) {
  test(`niveau ${n + 1} « ${level.name} » : données valides, équipes cohérentes, niveau faisable`, () => {
    assert.ok(level.difficulty in DIFFICULTIES, `difficulté inconnue : ${level.difficulty}`)
    assert.ok(Number.isInteger(level.seed), 'graine manquante')
    assert.ok(level.art.every((row) => [...row].every((ch) => ch === '.' || ch in PALETTE)))
    const parsed = parseLevel(level)
    const lanes = generateCrews(parsed, level)
    const blocks = parsed.cells.filter((c) => c !== -1).length
    const beavers = lanes.flat().reduce((sum, c) => sum + c.count, 0)
    assert.equal(beavers, blocks, 'un castor par bloc')
    assert.ok(lanes.flat().every((c) => c.count <= level.crewSize))
    assert.equal(solve(level).solvable, true, 'un joueur parfait doit pouvoir finir le niveau sans acheter de place')
  })
}
