<script setup>
import { onMounted, ref } from 'vue'
import { PALETTE } from '../game/levels.js'
import { PRODUCTS, buy, isDemo, loadPrices, restore } from '../services/purchases.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'
import AcornIcon from './ui/AcornIcon.vue'
import BeaverMark from './ui/BeaverMark.vue'
import Icon from './ui/Icon.vue'

const emit = defineEmits(['back'])
const prices = ref({})
const busy = ref(null)
const message = ref('')

onMounted(async () => {
  try {
    prices.value = await loadPrices()
  } catch (err) {
    message.value = 'Boutique indisponible pour le moment.'
    console.warn(err)
  }
})

async function purchase(product) {
  busy.value = product.id
  message.value = ''
  try {
    if (await buy(product)) message.value = `Merci ! « ${product.title} » est activé.`
  } catch (err) {
    message.value = "L'achat n'a pas pu aboutir."
    console.warn(err)
  } finally {
    busy.value = null
  }
}

async function restorePurchases() {
  busy.value = 'restore'
  try {
    await restore()
    message.value = 'Achats restaurés.'
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <main class="screen">
    <div class="sky" aria-hidden="true"><i class="cloud c1"></i><i class="cloud c3"></i></div>
    <header class="topbar">
      <button class="icon-btn glass" aria-label="Retour au menu" @click="emit('back')"><Icon name="back" /></button>
      <h1 class="page-title">Boutique</h1>
      <NutCounter class="glass" />
    </header>

    <section class="shop-hero glass">
      <BeaverMark :size="78" :carry="PALETTE.Y" />
      <div>
        <h2>Soutiens la colonie</h2>
        <p class="muted">Chaque achat aide un petit studio indépendant (et ses castors).</p>
      </div>
    </section>
    <p v-if="isDemo" class="chip">Mode démo · aucun paiement réel</p>

    <div class="shop-list">
      <article class="shop-item glass">
        <span class="shop-icon noads"><Icon name="noads" :size="30" /></span>
        <div class="shop-text">
          <h3>{{ PRODUCTS.removeAds.title }}</h3>
          <p class="muted">Plus de pub entre les niveaux. Les pubs récompensées restent au choix.</p>
        </div>
        <button v-if="save.noAds" class="btn btn-soft btn-small" disabled><Icon name="check" :size="18" /> Activé</button>
        <button v-else class="btn btn-primary btn-small" :disabled="!!busy" @click="purchase(PRODUCTS.removeAds)">
          {{ prices[PRODUCTS.removeAds.id] ?? '…' }}
        </button>
      </article>

      <article class="shop-item glass">
        <span class="shop-icon nuts"><AcornIcon :size="34" /></span>
        <div class="shop-text">
          <h3>{{ PRODUCTS.nuts500.title }}</h3>
          <p class="muted">De quoi agrandir le chantier quand tes castors sont bloqués.</p>
        </div>
        <button class="btn btn-primary btn-small" :disabled="!!busy" @click="purchase(PRODUCTS.nuts500)">
          {{ prices[PRODUCTS.nuts500.id] ?? '…' }}
        </button>
      </article>
    </div>

    <p v-if="message" class="chip" role="status">{{ message }}</p>
    <button class="btn btn-link" :disabled="!!busy" @click="restorePurchases">Restaurer mes achats</button>
  </main>
</template>
