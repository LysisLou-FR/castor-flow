<script setup>
import { ref, watch } from 'vue'
import { AD_LIVES, LIVES_PRICE, NUTS_LIVES, addLives, formatDelay, nextLifeIn, pendingPlay } from '../lives.js'
import { coin } from '../game/sfx.js'
import { showRewarded } from '../services/ads.js'
import { useBack } from '../services/platform.js'
import { save } from '../store.js'
import AcornIcon from './ui/AcornIcon.vue'
import Icon from './ui/Icon.vue'

const adLoading = ref(false)

useBack(() => {
  if (!pendingPlay.value) return false
  pendingPlay.value = null
  return true
}, 10)

/** Des vies sont revenues (achat, pub ou compte à rebours) : lance ce que le joueur voulait faire. */
function resume() {
  const action = pendingPlay.value
  pendingPlay.value = null
  action?.()
}

watch(
  () => save.lives,
  (lives) => pendingPlay.value && lives > 0 && resume(),
)

async function watchAd() {
  adLoading.value = true
  const rewarded = await showRewarded()
  adLoading.value = false
  if (rewarded) addLives(AD_LIVES)
}

function pay() {
  if (save.nuts < LIVES_PRICE) return
  save.nuts -= LIVES_PRICE
  addLives(NUTS_LIVES)
  coin()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="pendingPlay" class="modal-backdrop" @click.self="pendingPlay = null">
      <section class="modal" role="dialog" aria-labelledby="lives-title">
        <div class="modal-art lives"><Icon name="heart" :size="64" /></div>
        <h2 id="lives-title">Plus de vies&nbsp;!</h2>
        <p>
          Prochaine vie dans <strong>{{ formatDelay(nextLifeIn) }}</strong>.<br />
          Tu peux aussi en regagner tout de suite.
        </p>
        <div class="stack">
          <button class="btn btn-primary" :disabled="adLoading" @click="watchAd">
            <Icon name="video" :size="20" /> {{ adLoading ? 'Chargement…' : `Regarder une pub · +${AD_LIVES} vie` }}
          </button>
          <button class="btn btn-soft" :disabled="save.nuts < LIVES_PRICE" @click="pay">
            <AcornIcon :size="20" /> {{ LIVES_PRICE }} · +{{ NUTS_LIVES }} vies
          </button>
          <button class="btn btn-link" @click="pendingPlay = null">Plus tard</button>
        </div>
      </section>
    </div>
  </Transition>
</template>
