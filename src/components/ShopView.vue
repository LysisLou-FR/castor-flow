<script setup>
import { onMounted, ref } from 'vue'
import { PRODUCTS, buy, isDemo, loadPrices, restore } from '../services/purchases.js'
import { save } from '../store.js'
import NutCounter from './NutCounter.vue'

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
    <header class="topbar">
      <button class="btn btn-small" @click="emit('back')">← Menu</button>
      <NutCounter />
    </header>
    <h2>Boutique</h2>
    <p v-if="isDemo" class="hint">Mode démo : les achats sont simulés (aucun paiement).</p>

    <div class="shop-list">
      <article class="shop-item">
        <div class="shop-icon" aria-hidden="true">🚫📺</div>
        <div class="shop-text">
          <h3>{{ PRODUCTS.removeAds.title }}</h3>
          <p>Plus aucune pub entre les niveaux. Les pubs récompensées restent disponibles si tu le souhaites.</p>
        </div>
        <button v-if="save.noAds" class="btn btn-small" disabled>Activé ✓</button>
        <button v-else class="btn btn-primary btn-small" :disabled="!!busy" @click="purchase(PRODUCTS.removeAds)">
          {{ prices[PRODUCTS.removeAds.id] ?? '…' }}
        </button>
      </article>

      <article class="shop-item">
        <div class="shop-icon" aria-hidden="true">🌰</div>
        <div class="shop-text">
          <h3>{{ PRODUCTS.nuts500.title }}</h3>
          <p>De quoi agrandir ton chantier quand tes castors sont bloqués.</p>
        </div>
        <button class="btn btn-primary btn-small" :disabled="!!busy" @click="purchase(PRODUCTS.nuts500)">
          {{ prices[PRODUCTS.nuts500.id] ?? '…' }}
        </button>
      </article>
    </div>

    <p v-if="message" class="hint" role="status">{{ message }}</p>
    <button class="btn btn-ghost" :disabled="!!busy" @click="restorePurchases">Restaurer mes achats</button>
  </main>
</template>
