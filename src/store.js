import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { reactive, watch } from 'vue'

// Sauvegarde de la progression.
// Sur Android : @capacitor/preferences (stockage natif, qu'Android n'efface pas comme les données de la WebView).
// localStorage sert de copie de secours et de stockage dans le navigateur.
const KEY = 'cubiver-save-v1'
const OLD_KEY = 'castor-flow-save-v1' // nom du prototype : sa sauvegarde est reprise automatiquement
const defaults = { unlocked: 1, nuts: 0, noAds: false, wins: 0, sound: true, lives: 5, livesAt: null, attempt: false, freeHints: 1, stats: {} }
const isNative = Capacitor.isNativePlatform()

function parse(json) {
  try {
    return json ? JSON.parse(json) : null
  } catch {
    return null
  }
}

function readLocal() {
  try {
    return parse(localStorage.getItem(KEY)) ?? parse(localStorage.getItem(OLD_KEY))
  } catch {
    return null // stockage indisponible (navigation privée…)
  }
}

export const save = reactive({ ...defaults, ...readLocal() })

/**
 * À attendre avant d'afficher l'appli : charge la sauvegarde native.
 * Première fois : la sauvegarde localStorage des versions précédentes est reprise.
 */
export async function loadSave() {
  if (isNative) {
    try {
      const { value } = await Preferences.get({ key: KEY })
      const stored = parse(value)
      if (stored) Object.assign(save, { ...defaults, ...stored })
    } catch (err) {
      console.warn('[save] lecture impossible', err)
    }
  }
  write(save) // crée la sauvegarde native dès le premier lancement

  watch(save, write, { deep: true })
}

function write(value) {
  const json = JSON.stringify(value)
  try {
    localStorage.setItem(KEY, json)
  } catch {
    // stockage indisponible : on continue
  }
  if (isNative) Preferences.set({ key: KEY, value: json }).catch((err) => console.warn('[save] écriture impossible', err))
}
