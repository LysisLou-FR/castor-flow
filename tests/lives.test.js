import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_LIVES, addLives, endAttempt, pendingPlay, startAttempt, withLife } from '../src/lives.js'
import { save } from '../src/store.js'

test('rater un niveau coûte une vie, le réussir ne coûte rien', () => {
  save.lives = MAX_LIVES
  startAttempt()
  assert.equal(endAttempt(true), false)
  assert.equal(save.lives, MAX_LIVES)

  startAttempt()
  assert.equal(endAttempt(false), true)
  assert.equal(save.lives, MAX_LIVES - 1)
  assert.ok(save.livesAt, 'le compte à rebours de la prochaine vie démarre')
})

test('quitter sans avoir envoyé d’équipe ne coûte rien', () => {
  save.lives = 3
  assert.equal(endAttempt(false), false)
  assert.equal(save.lives, 3)
})

test('sans vie, le niveau attend qu’on en regagne', () => {
  save.lives = 0
  let played = 0
  withLife(() => played++)
  assert.equal(played, 0)
  assert.ok(pendingPlay.value, 'la fenêtre « Plus de vies » est ouverte')
  addLives(5)
  assert.equal(save.lives, 5)
  pendingPlay.value = null
  withLife(() => played++)
  assert.equal(played, 1)
})
