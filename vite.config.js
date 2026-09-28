import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const LEVELS_FILE = fileURLToPath(new URL('./src/game/levels.json', import.meta.url))

/**
 * Map builder (builder.html, en dev uniquement) : GET /__levels lit levels.json, POST /__levels l'enregistre.
 * Absent de la version livrée (le plugin ne s'applique qu'au serveur de dev, et builder.html n'est pas compilé).
 */
function levelsEditor() {
  return {
    name: 'cubiver-levels-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__levels', (req, res) => {
        res.setHeader('content-type', 'application/json; charset=utf-8')
        if (req.method === 'GET') {
          res.end(readFileSync(LEVELS_FILE, 'utf8'))
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('{"error":"méthode non prise en charge"}')
          return
        }
        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const levels = JSON.parse(body)
            if (!Array.isArray(levels) || !levels.every((l) => Array.isArray(l.art) && typeof l.name === 'string')) {
              throw new Error('liste de niveaux invalide')
            }
            writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2) + '\n')
            res.end(JSON.stringify({ ok: true, count: levels.length }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
    // Enregistrer depuis l'éditeur ne doit pas recharger l'éditeur lui-même (il perdrait son historique)
    handleHotUpdate({ file }) {
      if (file.replaceAll('\\', '/') === LEVELS_FILE.replaceAll('\\', '/')) return []
    },
  }
}

export default defineConfig({
  plugins: [vue(), levelsEditor()],
  // Chemins relatifs : indispensable pour que la WebView Capacitor trouve les fichiers
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // Phaser pèse ~1,2 Mo, c'est normal
  },
})
