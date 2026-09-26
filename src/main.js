import { createApp } from 'vue'
import App from './App.vue'
import { initAds } from './services/ads.js'
import { initPurchases } from './services/purchases.js'
import './style.css'

createApp(App).mount('#app')

initPurchases()
initAds()
