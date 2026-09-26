import { reactive, watch } from 'vue'

// Sauvegarde locale de la progression.
// Pour la production : @capacitor/preferences (plus fiable que localStorage sur Android)
// ou Firebase pour une sauvegarde dans le cloud.
const KEY = 'castor-flow-save-v1'
const defaults = { unlocked: 1, nuts: 0, noAds: false, wins: 0 }

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

export const save = reactive(load())

watch(
  save,
  (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // stockage indisponible (navigation privée…) : on continue sans sauvegarde
    }
  },
  { deep: true },
)
