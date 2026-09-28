# 🦫 Cubiver

Le concept de Colony Flow inversé : au lieu de fourmis qui mangent les cubes d'un dessin, des équipes de castors le **construisent**, bloc par bloc.

**Stack :** Vue 3 + Vite (interface) · Phaser 4 (jeu en WebGL) · Capacitor 8 (application Android) · AdMob (publicités) · RevenueCat (achats intégrés).

## Règles du jeu

- Le dessin se construit **colonne par colonne, de bas en haut** : seules les cases entourées de blanc sont accessibles.
- Touche une équipe de castors pour l'envoyer au **chantier**. Ses castors partent construire les cases accessibles de leur couleur.
- Si une équipe ne trouve rien à construire, elle occupe sa place. Quand toutes les places sont prises et que plus personne ne peut construire, le **chantier est bloqué**.
- Pour continuer : regarder une **pub récompensée** ou payer **90 noisettes**, et tu gagnes une place de plus.
- **Vies** (5 au maximum, une revient toutes les 20 minutes) : rater un niveau en coûte une, c'est-à-dire recommencer ou quitter après avoir envoyé au moins une équipe. Fermer l'appli en pleine partie compte aussi comme un échec. Gagner ne coûte rien. Sans vie, on ne peut plus lancer de niveau : il faut attendre, regarder une pub (+1 vie) ou payer 120 noisettes (+5 vies). Les réglages sont en haut de `src/lives.js`.
- Les cases accessibles ne sont pas signalées : c'est au joueur de lire le dessin. Le bonus **Indice** (bouton ampoule, 40 noisettes ou une pub récompensée, le premier est offert) les illumine pendant 6 secondes. Les prix et la durée sont en haut de `src/components/GameView.vue`.
- **Récompense** : 20 + 2 × (numéro du niveau − 1) noisettes, × 2 en hard et × 3 en super hard. **Rejouer** un niveau déjà réussi demande de regarder une pub (sauf avec « Sans pubs ») et ne rapporte rien (`src/replay.js`).
- **Tutoriel** : les niveaux 1, 2, 3 et 5 affichent des bulles d'aide (champ `tutorial` du niveau : `send`, `column`, `slots` ou `hint`).
- **Statistiques de test** : Paramètres > Statistiques de jeu. Pour chaque niveau : parties, gagnées, ratées, places achetées et indices, avec un bouton pour les copier et les envoyer.

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
    study.js        ← joueurs simulés, solveur, réglage automatique (npm run study, npm run tune)
    GameScene.js    ← rendu et animations Phaser
    art.js          ← cubes, échafaudages, décor : dessinés par code
    beaverArt.js    ← le castor : ton dessin assets/castor.svg, découpé en vues (face, dos, pieds)
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
  replay.js         ← rejouer un niveau déjà réussi (pub obligatoire)
  stats.js          ← statistiques de test par niveau
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
npm run study -- --curve      # la courbe de difficulté de tout le parcours
```

Le script (`scripts/study-levels.mjs`, logique dans `src/game/study.js`) fait jouer des milliers de parties à plusieurs joueurs simulés :

- **parfait** : explore toutes les suites de choix ; donne le nombre minimum de places ;
- **moyen** : envoie une équipe qui peut construire quand il en voit une, sinon une file au hasard ;
- **au hasard** : touche n'importe quelle file ;
- **automatique** : toujours la première équipe utile.

Pour chacun : le pourcentage de parties gagnées sans acheter de place, et le nombre de places achetées (pubs ou noisettes). Le modèle pose les cubes instantanément : dans le vrai jeu, les colonnes se libèrent moins vite, donc les niveaux sont un peu plus durs que les chiffres.

### Régler la difficulté automatiquement

Chaque niveau a une **cible** (`target`) : le taux de victoire visé pour le joueur moyen, de 0 à 1. La courbe du parcours de 40 niveaux :

- niveaux 1 à 3 : tutoriel, 100 % ;
- niveaux normaux : de 95 % (niveau 4) à 60 % (niveau 39), avec un niveau plus facile juste après chaque niveau dur ;
- hard (niveaux 5, 15, 25 et 35) : de 72 % à 45 % ;
- super hard (niveaux 10, 20, 30 et 40) : de 50 % à 25 %.

```bash
npm run tune          # règle tous les niveaux qui ont une cible
npm run tune -- 12 15 # seulement les niveaux 12 et 15
```

Le script cherche la graine, puis si besoin les places, la taille des équipes et le nombre de files, qui rapprochent le joueur moyen de la cible. Le niveau reste toujours faisable par un joueur parfait. Dans l'éditeur, le champ **Objectif de difficulté** et le bouton **Trouver les réglages** font la même chose pour le niveau affiché.

Un dessin qui a peu de couleurs mélangées dans ses colonnes reste facile, quels que soient les réglages : il faut le placer tôt dans le parcours. `npm test` échoue si un niveau s'éloigne de plus de 12 points de sa cible.

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

La tête du castor est tirée de ton dessin `assets/castor.svg` (oreilles, tête, visage, touffes et mèche ; voir `src/game/castorHead.js`), le même que dans le jeu. Le script `scripts/build-icons.mjs` la pose, avec un contour blanc, sur un fond de cubes isométriques aux couleurs du jeu et génère `assets/icon-only.svg`. L'accueil affiche la même tête (`src/components/ui/BeaverHead.vue`). En haut du script, tu peux régler `BEAVER_SCALE` (largeur de la tête dans l'icône), `ADAPTIVE_SCALE` (sa largeur dans l'icône adaptative) et `CUBE` (taille des cubes).

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
- Étoiles selon le nombre de places utilisées
