<script setup>
import { ref } from 'vue'
import { pendingReplay } from '../replay.js'
import { showRewarded } from '../services/ads.js'
import { useBack } from '../services/platform.js'
import Icon from './ui/Icon.vue'

const adLoading = ref(false)

useBack(() => {
  if (!pendingReplay.value) return false
  pendingReplay.value = null
  return true
}, 10)

async function watchAd() {
  adLoading.value = true
  const rewarded = await showRewarded()
  adLoading.value = false
  if (!rewarded) return
  const { action } = pendingReplay.value
  pendingReplay.value = null
  action()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="pendingReplay" class="modal-backdrop" @click.self="pendingReplay = null">
      <section class="modal" role="dialog" aria-labelledby="replay-title">
        <div class="modal-art stuck"><Icon name="restart" :size="56" /></div>
        <h2 id="replay-title">Rejouer ce niveau&nbsp;?</h2>
        <p>
          Tu as déjà construit « {{ pendingReplay.name }} ». Regarde une pub pour le rejouer.<br />
          Rejouer ne rapporte pas de noisettes.
        </p>
        <div class="stack">
          <button class="btn btn-primary" :disabled="adLoading" @click="watchAd">
            <Icon name="video" :size="20" /> {{ adLoading ? 'Chargement…' : 'Regarder une pub · Rejouer' }}
          </button>
          <button class="btn btn-link" @click="pendingReplay = null">Annuler</button>
        </div>
      </section>
    </div>
  </Transition>
</template>
