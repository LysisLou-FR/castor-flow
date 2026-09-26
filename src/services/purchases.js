// Achats intégrés via RevenueCat (qui utilise Google Play Billing sur Android).
// Dans le navigateur ou sans clé RevenueCat, les achats sont simulés.

import { Capacitor } from '@capacitor/core'
import { PRODUCT_CATEGORY, Purchases } from '@revenuecat/purchases-capacitor'
import { save } from '../store.js'

const API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY
const enabled = Capacitor.isNativePlatform() && !!API_KEY

// Identifiants à créer à l'identique dans la Google Play Console et dans RevenueCat
export const PRODUCTS = {
  removeAds: { id: 'remove_ads', title: 'Sans publicités', demoPrice: '2,99 €' },
  nuts500: { id: 'nuts_500', title: '500 noisettes', demoPrice: '0,99 €', nuts: 500 },
}
const NO_ADS_ENTITLEMENT = 'no_ads' // « entitlement » RevenueCat lié au produit remove_ads

export const isDemo = !enabled

function applyCustomerInfo(customerInfo) {
  if (customerInfo.entitlements.active[NO_ADS_ENTITLEMENT]) save.noAds = true
}

export async function initPurchases() {
  if (!enabled) return
  try {
    await Purchases.configure({ apiKey: API_KEY })
    const { customerInfo } = await Purchases.getCustomerInfo()
    applyCustomerInfo(customerInfo)
  } catch (err) {
    console.warn('[achats] initialisation impossible', err)
  }
}

/** Prix localisés venant du Play Store (ex. « 2,99 € »), indexés par id de produit. */
export async function loadPrices() {
  const ids = Object.values(PRODUCTS).map((p) => p.id)
  if (!enabled) return Object.fromEntries(Object.values(PRODUCTS).map((p) => [p.id, p.demoPrice]))
  const { products } = await Purchases.getProducts({
    productIdentifiers: ids,
    type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
  })
  return Object.fromEntries(products.map((p) => [p.identifier, p.priceString]))
}

/** Lance l'achat. Renvoie true si l'achat a abouti, false si le joueur a annulé. */
export async function buy(product) {
  if (!enabled) {
    await new Promise((resolve) => setTimeout(resolve, 600))
  } else {
    try {
      const { products } = await Purchases.getProducts({
        productIdentifiers: [product.id],
        type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
      })
      const { customerInfo } = await Purchases.purchaseStoreProduct({ product: products[0] })
      applyCustomerInfo(customerInfo)
    } catch (err) {
      if (err?.userCancelled) return false
      throw err
    }
  }
  if (product.id === PRODUCTS.removeAds.id) save.noAds = true
  if (product.nuts) save.nuts += product.nuts
  return true
}

/** Obligatoire sur les stores : permet de récupérer « Sans pubs » après une réinstallation. */
export async function restore() {
  if (!enabled) return
  const { customerInfo } = await Purchases.restorePurchases()
  applyCustomerInfo(customerInfo)
}
