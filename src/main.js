import { createApp } from 'vue'
import App from './App.vue'
import { setAudioPaused, tap } from './game/sfx.js'
import { initLives } from './lives.js'
import { initAds } from './services/ads.js'
import { initPlatform, onAppPause } from './services/platform.js'
import { initPurchases } from './services/purchases.js'
import { loadSave } from './store.js'
import '@fontsource-variable/fredoka'
import './style.css'

// la sauvegarde native est lue avant d'afficher quoi que ce soit (vies, niveaux débloqués…)
loadSave().then(() => {
  initLives()
  initPlatform()
  onAppPause(setAudioPaused) // arrière-plan : plus aucun son
  createApp(App).mount('#app')
  initPurchases()
  initAds()
})

// petit clic sur les boutons de l'interface (les cartes d'équipes ont leur propre son)
document.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.closest('button:not(.crew-card)')) tap()
})
