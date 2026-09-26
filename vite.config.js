import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Chemins relatifs : indispensable pour que la WebView Capacitor trouve les fichiers
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // Phaser pèse ~1,2 Mo, c'est normal
  },
})
