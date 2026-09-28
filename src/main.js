import { createApp } from 'vue'
import App from './App.vue'
import { tap } from './game/sfx.js'
import { initAds } from './services/ads.js'
import { initPurchases } from './services/purchases.js'
import '@fontsource-variable/fredoka'
import './style.css'

createApp(App).mount('#app')

// petit clic sur les boutons de l'interface (les cartes d'équipes ont leur propre son)
document.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.closest('button:not(.crew-card)')) tap()
})

initPurchases()
initAds()
