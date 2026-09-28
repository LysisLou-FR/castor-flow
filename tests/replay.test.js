import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS } from '../src/game/levels.js'
import { isCompleted, pendingReplay, withReplayAd } from '../src/replay.js'
import { save } from '../src/store.js'

test('un nouveau niveau se lance directement, un niveau réussi demande une pub', () => {
  Object.assign(save, { unlocked: 3, noAds: false, stats: {} })
  let played = 0
  withReplayAd(2, () => played++) // niveau 3 : le prochain à réussir
  assert.equal(played, 1)
  assert.equal(pendingReplay.value, null)

  withReplayAd(0, () => played++) // niveau 1 : déjà réussi
  assert.equal(played, 1, 'pas lancé avant la pub')
  assert.equal(pendingReplay.value.name, LEVELS[0].name)
  pendingReplay.value.action() // la pub a été regardée
  assert.equal(played, 2)
  pendingReplay.value = null
})

test('le dernier niveau réussi compte comme déjà réussi, et « Sans pubs » dispense de la pub', () => {
  const last = LEVELS.length - 1
  Object.assign(save, { unlocked: LEVELS.length, noAds: false, stats: {} })
  assert.equal(isCompleted(last), false)
  save.stats[LEVELS[last].name] = { plays: 1, wins: 1, fails: 0, slots: 0, hints: 0 }
  assert.equal(isCompleted(last), true)

  save.noAds = true
  let played = 0
  withReplayAd(last, () => played++)
  assert.equal(played, 1)
  Object.assign(save, { noAds: false, stats: {} })
})
