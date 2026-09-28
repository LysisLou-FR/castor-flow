import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyArt, floodFill, resizeArt, setCell, shiftArt } from '../src/builder/grid.js'

test('grille vide', () => {
  assert.deepEqual(emptyArt(3, 2), ['...', '...'])
})

test('peindre une case ne touche pas aux autres lignes', () => {
  const art = ['...', '...']
  const next = setCell(art, 1, 0, 'R')
  assert.deepEqual(next, ['.R.', '...'])
  assert.equal(next[1], art[1])
  assert.equal(setCell(next, 1, 0, 'R'), next, 'aucun changement : même tableau (pas d’historique inutile)')
})

test('redimensionner garde le dessin posé en bas et centré', () => {
  assert.deepEqual(resizeArt(['R'], 3, 2), ['...', '.R.'])
  assert.deepEqual(resizeArt(['...', '.R.'], 1, 1), ['R'])
})

test('le pot de peinture remplit seulement la zone contiguë', () => {
  const art = ['..R', 'RRR', '...']
  assert.deepEqual(floodFill(art, 0, 0, 'B'), ['BBR', 'RRR', '...'])
  assert.equal(floodFill(art, 2, 0, 'R'), art, 'même couleur : rien à faire')
})

test('décaler le dessin', () => {
  assert.deepEqual(shiftArt(['R.', '..'], 1, 1), ['..', '.R'])
})
