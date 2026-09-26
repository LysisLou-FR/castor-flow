// Publicités AdMob via @capacitor-community/admob.
// Dans le navigateur (npm run dev), les pubs sont simulées pour pouvoir développer sans téléphone.

import { Capacitor } from '@capacitor/core'
import { ref } from 'vue'
import { AdMob, AdmobConsentStatus, RewardAdPluginEvents } from '@capacitor-community/admob'
import { save } from '../store.js'

const isNative = Capacitor.isNativePlatform()

// Identifiants de TEST publiés par Google : à remplacer par les tiens via le fichier .env
const TEST_IDS = {
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
}
const AD_IDS = {
  rewarded: import.meta.env.VITE_ADMOB_REWARDED_ID || TEST_IDS.rewarded,
  interstitial: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || TEST_IDS.interstitial,
}
const isTesting = AD_IDS.rewarded === TEST_IDS.rewarded

let ready = false

/** RGPD : true si le joueur doit pouvoir rouvrir ses choix de consentement (bouton dans le menu). */
export const privacyOptionsRequired = ref(false)

export async function initAds() {
  if (!isNative) return
  try {
    await AdMob.initialize({ initializeForTesting: isTesting })
    // RGPD : formulaire de consentement Google (UMP), obligatoire pour les joueurs européens
    const consent = await AdMob.requestConsentInfo()
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm()
    }
    const info = await AdMob.requestConsentInfo()
    privacyOptionsRequired.value = info.privacyOptionsRequirementStatus === 'REQUIRED' // enum non exporté par le plugin
    ready = true
  } catch (err) {
    console.warn('[ads] initialisation impossible', err)
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Vidéo récompensée. Renvoie true si le joueur a regardé la pub jusqu'au bout. */
export async function showRewarded() {
  if (!isNative) {
    console.info('[ads] pub récompensée simulée')
    await wait(800)
    return true
  }
  if (!ready) return false

  let rewarded = false
  let finish
  const closed = new Promise((resolve) => (finish = resolve))
  const listeners = await Promise.all([
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => (rewarded = true)),
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish()),
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish()),
  ])
  try {
    await AdMob.prepareRewardVideoAd({ adId: AD_IDS.rewarded, isTesting })
    await AdMob.showRewardVideoAd()
    await closed
  } catch (err) {
    console.warn('[ads] pub récompensée indisponible', err)
  } finally {
    listeners.forEach((l) => l.remove())
  }
  return rewarded
}

/** Pub plein écran entre deux niveaux, sauf si le joueur a acheté « Sans pubs ». */
export async function maybeShowInterstitial() {
  if (save.noAds || save.wins % 2 !== 0) return
  if (!isNative) {
    console.info('[ads] interstitiel simulé')
    return
  }
  if (!ready) return
  try {
    await AdMob.prepareInterstitial({ adId: AD_IDS.interstitial, isTesting })
    await AdMob.showInterstitial()
  } catch (err) {
    console.warn('[ads] interstitiel indisponible', err)
  }
}

/** Rouvre le formulaire de consentement Google pour que le joueur modifie ses choix. */
export async function showPrivacyOptions() {
  try {
    await AdMob.showPrivacyOptionsForm()
  } catch (err) {
    console.warn('[ads] formulaire de confidentialité indisponible', err)
  }
}
