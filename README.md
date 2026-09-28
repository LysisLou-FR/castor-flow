# 🦫 Cubiver

Le concept de Colony Flow inversé : au lieu de fourmis qui mangent les cubes d'un dessin, des équipes de castors le **construisent**, bloc par bloc.

**Stack :** Vue 3 + Vite (interface) · Phaser 4 (jeu en WebGL) · Capacitor 8 (application Android) · AdMob (publicités) · RevenueCat (achats intégrés).

## Règles du jeu

- Le dessin se construit **colonne par colonne, de bas en haut** : seules les cases entourées de blanc sont accessibles.
- Touche une équipe de castors pour l'envoyer au **chantier**. Ses castors partent construire les cases accessibles de leur couleur.
- Si une équipe ne trouve rien à construire, elle occupe sa place. Quand toutes les places sont prises et que plus personne ne peut construire, le **chantier est bloqué**.
- Pour continuer : regarder une **pub récompensée** ou payer **30 noisettes**, et tu gagnes une place de plus.
- **Vies** (5 au maximum, une revient toutes les 20 minutes) : rater un niveau en coûte une, c'est-à-dire recommencer ou quitter après avoir envoyé au moins une équipe. Fermer l'appli en pleine partie compte aussi comme un échec. Gagner ne coûte rien. Sans vie, on ne peut plus lancer de niveau : il faut attendre, regarder une pub (+1 vie) ou payer 50 noisettes (+5 vies). Les réglages sont en haut de `src/lives.js`.
- Les cases accessibles ne sont pas signalées : c'est au joueur de lire le dessin. Le bonus **Indice** (bouton ampoule, 15 noisettes ou une pub récompensée) les illumine pendant 6 secondes. Les prix et la durée sont en haut de `src/components/GameView.vue`.

## Développement (navigateur)

```bash
npm install
npm run dev      # http://localhost:5173 ; pubs et achats simulés
npm test         # tests de la logique + vérifie que chaque niveau est faisable
```

Dans la console du navigateur, en mode développement, `cubiverDebug.scene` donne accès à la scène Phaser.

## Structure

```
src/
  game/
    levels.json     ← les niveaux (édités avec le map builder)
    levels.js       ← palette, difficultés, chargement des niveaux
    logic.js        ← règles pures : grille, colonnes, génération des équipes
    study.js        ← joueurs simulés et solveur (npm run study, analyse de l'éditeur)
    GameScene.js    ← rendu et animations Phaser
    art.js          ← castor, cubes, échafaudages, décor : tout est dessiné par code
    island.js       ← socle de l'île (dégradés, arrondis)
    createGame.js   ← pont entre Phaser et Vue
  components/       ← écrans Vue : menu, niveaux, jeu, boutique
  builder/          ← map builder (outil de dev, npm run builder)
  services/
    ads.js          ← AdMob : vidéo récompensée, interstitiel, consentement RGPD
    purchases.js    ← RevenueCat : « Sans pubs », packs de noisettes, restauration
    platform.js     ← Android : bouton retour, passage en arrière-plan
  store.js          ← sauvegarde (@capacitor/preferences sur Android, localStorage dans le navigateur)
  lives.js          ← vies : perte, recharge, achat
android/            ← projet Android Studio généré par Capacitor
```

### Créer des niveaux : le map builder

```bash
npm run builder
```

Cette commande ouvre l'éditeur de niveaux (`/builder.html`) dans ton navigateur. C'est un outil de développement : il n'est jamais inclus dans l'appli livrée. Il lit et enregistre directement `src/game/levels.json`.

- **Liste** : créer, dupliquer, monter ou descendre, supprimer des niveaux. L'ordre de la liste est l'ordre du jeu.
- **Dessin** :
  - outils crayon (B), gomme (E), pot de peinture (G) et pipette (I) ;
  - touches 1 à 0 pour choisir une couleur de la palette, clic droit pour gommer ;
  - Ctrl+Z et Ctrl+Y pour annuler et rétablir ;
  - boutons pour décaler le dessin.
- **Importer une image** : l'image est réduite à la taille de la grille (posée en bas, centrée) et convertie aux couleurs de la palette, avec un nombre maximum de couleurs.
- **Difficulté** : `Normal`, `Hard` ou `Super hard`.
  - Elle mélange plus ou moins l'ordre d'arrivée des équipes, et multiplie la récompense (× 1, × 2, × 3).
  - Dans le jeu, les niveaux hard et super hard portent un badge.
  - Les réglages de chaque difficulté sont dans `DIFFICULTIES` (`src/game/levels.js`).
- **Réglages** : taille des équipes, nombre de files, places au chantier, et **graine** du tirage (🎲 pour un autre ordre des équipes).
- **Analyse en direct** : faisable ou non, nombre de blocs, de couleurs et d'équipes, et **places nécessaires**. Ce dernier chiffre est le minimum trouvé par un joueur automatique ; un joueur attentif fait parfois mieux. L'éditeur affiche aussi les files d'équipes dans leur ordre d'arrivée.
- **Enregistrer** (Ctrl+S) écrit `levels.json`. **Tester dans le jeu** enregistre puis ouvre le jeu directement sur ce niveau (`/?play=N`, uniquement en dev).

Après avoir modifié des niveaux, lance `npm test` : il vérifie que chaque niveau est valide et qu'un joueur parfait peut le finir sans acheter de place.

### Mesurer la difficulté réelle

```bash
npm run study                 # tous les niveaux
npm run study -- 7            # le niveau 7
npm run study -- 7 --seeds 40 # compare aussi 40 graines pour ce niveau
```

Le script (`scripts/study-levels.mjs`, logique dans `src/game/study.js`) fait jouer des milliers de parties à plusieurs joueurs simulés :

- **parfait** : explore toutes les suites de choix ; donne le nombre minimum de places ;
- **moyen** : envoie une équipe qui peut construire quand il en voit une, sinon une file au hasard ;
- **au hasard** : touche n'importe quelle file ;
- **automatique** : toujours la première équipe utile.

Pour chacun : le pourcentage de parties gagnées sans acheter de place, et le nombre de places achetées (pubs ou noisettes). L'éditeur affiche aussi le taux du joueur moyen et la **difficulté ressentie** : normal au-dessus de 90 %, hard de 40 à 90 %, super hard en dessous. Le modèle pose les cubes instantanément : dans le vrai jeu, les colonnes se libèrent moins vite.

## Compiler l'application Android

1. Installe [Android Studio](https://developer.android.com/studio). Il fournit le SDK Android et le JDK.
2. Lance :
   ```bash
   npm run android   # build web + synchronisation + ouverture d'Android Studio
   ```
3. Dans Android Studio : ▶ **Run** sur un téléphone branché en USB (avec le débogage USB activé) ou sur un émulateur.
4. Pour le Play Store : **Build > Generate Signed App Bundle** (fichier `.aab`).

> Le wrapper Gradle a été passé de 8.14.3 à **9.2.1** (`android/gradle/wrapper/gradle-wrapper.properties`), car le JDK 25 livré avec Android Studio n'est pas supporté par Gradle 8. Si `npx cap add android` régénère un jour le dossier `android/`, refais cette modification.
>
> APK de debug en ligne de commande : `cd android` puis `gradlew assembleDebug`. Le fichier sort dans `android/app/build/outputs/apk/debug/`.

Après chaque modification du code web, relance `npm run android` (ou `npm run build && npx cap sync android`).

## Icône de l'application

Le castor vient de `assets/icon-beaver.svg` : ton dessin, sans fond, en deux groupes, `head` (oreilles et tête) et `face` (le visage). Le script `scripts/build-icons.mjs` le pose sur un fond de cubes isométriques aux couleurs du jeu et génère `assets/icon-only.svg`. En haut du script, tu peux régler `BEAVER_SCALE` (taille du castor), `ADAPTIVE_SCALE` (sa taille dans l'icône adaptative) et `CUBE` (taille des cubes).

Après une modification :

```bash
npm run icons
```

Cette commande génère les PNG sources dans `assets/`, toutes les icônes Android (icône adaptative et icône classique, pour chaque densité), et `assets/play-store-512.png` à envoyer sur la Play Console.

## Publicités (AdMob)

Le projet utilise les **identifiants de test** de Google : c'est sans risque pendant le développement. Cliquer sur tes propres vraies pubs peut faire bannir ton compte AdMob.

Avant la publication :
1. Crée l'application et deux blocs d'annonces (**Avec récompense** et **Interstitiel**) sur [admob.google.com](https://admob.google.com).
2. Copie `.env.example` en `.env` et renseigne `VITE_ADMOB_REWARDED_ID` et `VITE_ADMOB_INTERSTITIAL_ID`.
3. Remplace l'`APPLICATION_ID` de test dans `android/app/src/main/AndroidManifest.xml`.
4. Dans AdMob, section **Confidentialité et messages**, crée un message RGPD. Le formulaire de consentement s'affiche alors automatiquement (`initAds()`).
5. Ajoute un fichier `app-ads.txt` sur ton site web.

## Achats intégrés (RevenueCat + Google Play Billing)

Tant que `VITE_REVENUECAT_ANDROID_KEY` est vide, les achats sont simulés.

1. Crée l'application dans la [Google Play Console](https://play.google.com/console). L'inscription coûte 25 $ une seule fois.
2. Envoie un premier `.aab` en **test interne**. Les produits ne peuvent être créés qu'après ça.
3. Dans **Monétiser > Produits intégrés**, crée `remove_ads` et `nuts_500`.
4. Sur [RevenueCat](https://www.revenuecat.com) :
   - connecte le Play Store (compte de service) ;
   - importe les deux produits ;
   - crée l'entitlement `no_ads` lié à `remove_ads` ;
   - marque `remove_ads` comme non consommable.
5. Mets la clé publique Android (`goog_…`) dans `.env`.
6. Ajoute ton compte Google comme **testeur de licence** (Play Console > Paramètres) pour payer sans être débité.

> Pour la production, crédite les noisettes côté serveur (webhooks RevenueCat), sinon un joueur peut tricher.

## Pistes pour la suite

- Sons : coups de marteau, « plouf », musique
- Skins de castors à acheter avec des noisettes
- Sauvegarde dans le cloud (Firebase) pour retrouver sa progression sur un autre téléphone
- Éditeur de niveaux, ou conversion automatique d'une image en pixel art
- Étoiles selon le nombre de places utilisées
