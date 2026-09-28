<script setup>
import { ref } from 'vue'
import { version } from '../../package.json'
import { pop } from '../game/sfx.js'
import { privacyOptionsRequired, showPrivacyOptions } from '../services/ads.js'
import { useBack } from '../services/platform.js'
import { isDemo, restore } from '../services/purchases.js'
import { LEVELS } from '../game/levels.js'
import { STAT_KEYS, statsText } from '../stats.js'
import { save } from '../store.js'
import Icon from './ui/Icon.vue'

const emit = defineEmits(['close'])
const message = ref('')
const busy = ref(false)
const confirmReset = ref(false)
const showStats = ref(false) // tableau des statistiques de test
const played = () => LEVELS.map((l, i) => ({ n: i + 1, name: l.name, s: save.stats[l.name] })).filter((r) => r.s)

async function copyStats() {
  try {
    await navigator.clipboard.writeText(statsText(LEVELS))
    message.value = 'Statistiques copiées : colle-les dans un message.'
  } catch {
    message.value = 'Copie impossible sur cet appareil.'
  }
}

useBack(() => {
  if (showStats.value) showStats.value = false
  else emit('close')
  return true
}, 10)

function toggleSound() {
  save.sound = !save.sound
  if (save.sound) pop(0.5) // aperçu du son
}

async function restorePurchases() {
  busy.value = true
  try {
    await restore()
    message.value = isDemo ? 'Mode démo : rien à restaurer.' : 'Achats restaurés.'
  } catch (err) {
    message.value = 'La restauration a échoué.'
    console.warn(err)
  } finally {
    busy.value = false
  }
}

/** Repart du niveau 1 ; garde les noisettes et « Sans pubs » (déjà payés). */
function resetProgress() {
  save.unlocked = 1
  save.wins = 0
  confirmReset.value = false
  message.value = 'Progression réinitialisée.'
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section class="modal settings" role="dialog" aria-labelledby="settings-title">
      <header class="settings-head">
        <h2 id="settings-title">Paramètres</h2>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')"><Icon name="close" /></button>
      </header>

      <button class="setting-row" role="switch" :aria-checked="save.sound" @click="toggleSound">
        <Icon :name="save.sound ? 'sound' : 'mute'" />
        <span>Son</span>
        <span class="switch" :class="{ on: save.sound }"><i></i></span>
      </button>

      <button class="setting-row" :disabled="busy" @click="restorePurchases">
        <Icon name="restart" />
        <span>Restaurer mes achats</span>
      </button>

      <button v-if="privacyOptionsRequired" class="setting-row" @click="showPrivacyOptions">
        <Icon name="shield" />
        <span>Confidentialité et publicités</span>
      </button>

      <button class="setting-row" @click="showStats = !showStats">
        <Icon name="grid" />
        <span>Statistiques de jeu</span>
      </button>
      <div v-if="showStats" class="stats">
        <table v-if="played().length">
          <thead>
            <tr><th>Niveau</th><th v-for="(label, k) in STAT_KEYS" :key="k">{{ label }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in played()" :key="row.n">
              <td>{{ row.n }}. {{ row.name }}</td><td v-for="(label, k) in STAT_KEYS" :key="k">{{ row.s[k] }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Aucune partie jouée pour l’instant.</p>
        <button v-if="played().length" class="btn btn-soft btn-small" @click="copyStats">Copier</button>
      </div>

      <button v-if="!confirmReset" class="setting-row danger" @click="confirmReset = true">
        <Icon name="trash" />
        <span>Réinitialiser la progression</span>
      </button>
      <div v-else class="confirm-reset">
        <p>Recommencer au niveau 1 ? Tes noisettes et tes achats sont conservés.</p>
        <div class="confirm-actions">
          <button class="btn btn-soft btn-small" @click="confirmReset = false">Annuler</button>
          <button class="btn btn-primary btn-small" @click="resetProgress">Réinitialiser</button>
        </div>
      </div>

      <p v-if="message" class="settings-msg" role="status">{{ message }}</p>
      <small class="muted">Cubiver · version {{ version }}</small>
    </section>
  </div>
</template>
