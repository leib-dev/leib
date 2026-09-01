# LEIB — Regarde. Gagne. Devient LEIB.

Application complète : APK Android (Expo) + export web + landing page marketing.

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement et remplir tes vraies clés
cp .env.example .env

# 3. Lancer le projet en développement
npx expo start
```

## Structure du projet

```
leib-app/
├── App.js                     # Point d'entrée
├── app.json                   # Config Expo (nom, icône, package Android, web)
├── vercel.json                # Config déploiement web (rewrite SPA)
├── .env.example                # Variables d'environnement à copier en .env
├── web-landing/
│   └── index.html              # Landing page marketing autonome (déployable seule)
├── src/
│   ├── config/
│   │   ├── appwrite.js         # Client Appwrite (auth, DB, storage)
│   │   ├── bunny.js            # Bunny Storage + Bunny Stream (vidéo)
│   │   ├── cloudinary.js       # Cloudinary (images + fallback vidéo)
│   │   ├── colors.js           # Palette officielle LEIB
│   │   ├── sebpay.js           # Paiements + retraits SebPay Africa
│   │   └── monetization.js     # Barème central des prix et répartitions
│   ├── services/
│   │   ├── smartUpload.js      # Upload Bunny en priorité, fallback Cloudinary
│   │   ├── authService.js      # Inscription / connexion / déconnexion Appwrite
│   │   ├── paymentService.js   # Déblocage vidéo : paiement + répartition des soldes
│   │   ├── videoService.js     # Récupération des vidéos du feed
│   │   ├── walletService.js    # Historique transactions + retraits SebPay
│   │   ├── uploadService.js    # Paiement 500F + Smart Upload + création vidéo
│   │   ├── liveService.js      # Cycle de vie live : démarrer, accès, dons, arrêt
│   │   └── adminService.js     # Gains, retraits en attente, utilisateurs, badges
│   ├── context/
│   │   └── AuthContext.js      # État global de session (useAuth())
│   ├── navigation/
│   │   └── AppNavigator.js     # Login/Register ↔ Onglets (+ Admin si isAdmin)
│   ├── screens/
│   │   ├── SplashScreen.js     # Écran de chargement (vérif session)
│   │   ├── LoginScreen.js      # Connexion
│   │   ├── RegisterScreen.js   # Inscription
│   │   ├── FeedScreen.js       # Feed vertical style TikTok
│   │   ├── WalletScreen.js     # Solde LEIB Pay + historique + retrait
│   │   ├── UploadScreen.js     # Publication vidéo (paiement + Smart Upload)
│   │   ├── LiveScreen.js       # Liste des lives en cours
│   │   ├── StartLiveScreen.js  # Démarrer un live (paiement + infos RTMP)
│   │   ├── LiveViewerScreen.js # Regarder un live (paiement accès + dons)
│   │   └── AdminDashboardScreen.js  # Vue d'ensemble + retraits + utilisateurs
│   └── components/
│       ├── VideoCard.js        # Vidéo + preview 3s + overlay paiement
│       ├── TopBar.js           # Logo + déconnexion
│       ├── TransactionRow.js   # Ligne d'historique wallet
│       ├── RetraitModal.js     # Modal de retrait (MTN/Orange/Virement/Stripe)
│       ├── RetraitEnAttenteRow.js   # Ligne de retrait à approuver (admin)
│       └── UtilisateurAdminRow.js   # Ligne utilisateur avec actions (admin)
```

## Avant de tester la brique 7 (admin)

Ajoute cet attribut à la collection **users** (en plus de ceux de la brique 2) :

| Attribut | Type    | Requis | Défaut |
|-----------|---------|--------|--------|
| banni      | boolean | oui    | false  |

Ajoute cet attribut à la collection **transactions** (en plus de ceux de la brique 3) :

| Attribut       | Type   | Requis |
|-----------------|--------|--------|
| statutRetrait    | string | non (rempli seulement pour type='retrait') |

Le dashboard admin n'apparaît que pour le compte dont l'ID Appwrite correspond à `EXPO_PUBLIC_ADMIN_ID` dans ton `.env` — ce compte reçoit automatiquement le rôle `admin` à l'inscription (voir `authService.js`, brique 2).

## Appels audio/vidéo 1-à-1

Réutilise LiveKit (déjà en place pour le live) — une salle privée à 2 participants au lieu d'une salle publique. **Prix : 10 000 F par appel, 100% pour l'admin LEIB** (l'admin lui-même appelle gratuitement). Une confirmation s'affiche avant de facturer. Détection d'appel entrant en temps réel via **Appwrite Realtime**, gratuit sans configuration supplémentaire côté Appwrite, complétée par une **notification push native** (voir section suivante) pour joindre l'appelé même app fermée. Bouton 📞 (audio) et 🎥 (vidéo) visibles sur chaque vidéo du feed, à côté du pseudo du créateur.

Crée la collection **calls** (base `leib_db`) :

| Attribut       | Type   | Requis |
|-----------------|--------|--------|
| callerId         | string | oui    |
| callerPseudo     | string | oui    |
| calleeId         | string | oui    |
| type             | string | oui (`audio` ou `video`) |
| statut           | string | oui (`en_attente` / `accepte` / `refuse` / `termine`) |
| nomSalle         | string | oui    |
| dateCreation     | string | oui    |

## Notifications push natives

Complète les SMS : arrive même si l'app LEIB est **totalement fermée** (pas juste en arrière-plan), via Expo Notifications. Utilisée pour les appels entrants — utile pour d'autres événements plus tard si besoin.

### 1. Déployer la Function `push-notification`

```bash
cd functions/push-notification
```

Crée une fonction Node.js dans la console Appwrite, uploade ce dossier — **aucune clé secrète requise** cette fois (l'API Expo Push de base est ouverte). Mets l'URL d'exécution dans `.env` (`EXPO_PUBLIC_PUSH_ENDPOINT`).

### 2. Ajoute l'attribut à la collection **users**

| Attribut  | Type   | Requis |
|------------|--------|--------|
| pushToken   | string | non (rempli automatiquement à la connexion, si permission accordée) |

⚠️ Ne fonctionne que sur mobile (Android/iOS) — pas de push natif sur web dans cette implémentation, et nécessite un **development build** (pas Expo Go) comme pour le live, puisque `expo-notifications` inclut des modules natifs.

## Notifications SMS

LEIB envoie un SMS à l'utilisateur pour ses gains (déblocage vidéo, dons, accès live) et ses retraits approuvés — **le SMS arrive même si l'app est fermée**, car il passe par le réseau téléphonique, pas par une notification push classique.

### 1. Créer un compte Twilio

Inscris-toi sur [twilio.com](https://twilio.com), récupère ton `Account SID`, ton `Auth Token`, et achète/active un numéro d'envoi.

### 2. Déployer la Function `sms-notification`

Même principe que pour LiveKit — le secret Twilio ne doit jamais être dans l'app :

```bash
cd functions/sms-notification
npm install
```

Crée une fonction Node.js dans la console Appwrite, uploade ce dossier, et dans ses **Variables d'environnement** ajoute `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Mets l'URL d'exécution dans `.env` (`EXPO_PUBLIC_SMS_ENDPOINT`).

### 3. Ajoute l'attribut téléphone à la collection **users**

| Attribut  | Type   | Requis |
|------------|--------|--------|
| telephone   | string | non (le SMS est juste ignoré si absent) |

Le numéro est maintenant demandé à l'inscription (format international recommandé, ex: `+229...`).

## Live streaming (LiveKit — mise à jour)

⚠️ **Changement d'architecture** : le live ne passe plus par Bunny Stream/RTMP mais par **LiveKit** (WebRTC). Raison : RTMP ne peut pas être diffusé depuis un navigateur, seulement depuis une app externe — LiveKit permet de **diffuser et regarder un live directement depuis le mobile ET le web**, sans logiciel tiers.

### 1. Créer un projet LiveKit

Inscris-toi sur [livekit.io](https://livekit.io) (offre Cloud gratuite pour démarrer), crée un projet, récupère :
- l'URL du serveur (`wss://ton-projet.livekit.cloud`)
- la clé API (`LIVEKIT_API_KEY`) et le secret (`LIVEKIT_API_SECRET`)

### 2. Déployer la Function de génération de token

Le secret LiveKit ne doit **jamais** être dans l'app (mobile ou web) — il reste uniquement côté serveur, dans une Appwrite Function (`functions/livekit-token/`).

```bash
cd functions/livekit-token
npm install
```

Dans la console Appwrite → Functions → crée une fonction Node.js, uploade ce dossier (ou via CLI Appwrite), puis dans ses **Variables d'environnement** ajoute `LIVEKIT_API_KEY` et `LIVEKIT_API_SECRET`. Récupère l'URL d'exécution de la fonction et mets-la dans `.env` (`EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT`).

### 3. Crée la collection **lives** (base `leib_db`)

| Attribut          | Type    | Requis |
|--------------------|---------|--------|
| createurId          | string  | oui    |
| createurPseudo      | string  | oui    |
| titre               | string  | oui    |
| statut              | string  | oui    |
| nomSalle            | string  | oui    |
| dateDebut           | string  | oui    |
| dateFin             | string  | non    |

### 4. Limite importante pour tester sur mobile

`@livekit/react-native` utilise des modules natifs (caméra/micro WebRTC) — **Expo Go ne suffit plus** pour tester le live sur mobile. Il faut un "development build" :

```bash
npx eas build --profile development --platform android
```

Installe l'APK généré sur ton téléphone, puis `npx expo start --dev-client` au lieu d'Expo Go. Les autres écrans (feed, wallet, upload) continuent de fonctionner normalement dans Expo Go — seule la partie live nécessite ce build.

## Déployer le site web (brique 8)

Deux déploiements séparés et indépendants :

### 1. L'application elle-même en version web

```bash
npx expo export --platform web
# Génère le dossier dist/, prêt à déployer
```

Sur Vercel : connecte le repo, le fichier `vercel.json` à la racine gère déjà la commande de build et les rewrites nécessaires pour React Navigation (SPA). Sur Netlify : build command `npx expo export --platform web`, publish directory `dist`.

✅ Le live fonctionne maintenant en diffusion **et** en lecture depuis un navigateur (grâce à LiveKit) — plus de limitation web contrairement à l'ancienne version basée sur Bunny/RTMP.

### 2. Landing page marketing (déployable dès maintenant)

Le dossier `web-landing/index.html` est un site vitrine autonome — aucune dépendance, aucune clé API requise. Utile pour communiquer sur LEIB avant que le backend (Appwrite/Bunny/SebPay) soit configuré.

```bash
# Déploiement Vercel en une commande (depuis web-landing/)
cd web-landing
npx vercel --prod
```

Ou glisse-dépose simplement `web-landing/index.html` sur Netlify Drop (netlify.com/drop).

## Avant de tester la brique 5 (upload)

Ajoute ces deux attributs à la collection **videos** (en plus de ceux de la brique 3) :

| Attribut     | Type    | Requis |
|---------------|---------|--------|
| fournisseur    | string  | non    |
| miniature      | string  | non    |

N'importe quel utilisateur connecté peut publier — il est automatiquement promu du rôle `viewer` à `creator` lors de sa première publication (le rôle `admin` n'est jamais modifié).

⚠️ Le paiement de publication (500F) passe par SebPay comme le déblocage vidéo — teste avec tes identifiants sandbox SebPay une fois disponibles.

## Avant de tester la brique 4 (wallet)

Aucune nouvelle collection Appwrite nécessaire : le wallet réutilise `users` (attribut `soldeLeibPay`) et `transactions` créées en brique 3. Le type `retrait` est ajouté automatiquement aux transactions existantes.

⚠️ `walletService.js` fait deux requêtes Appwrite (payeur + bénéficiaire) car Appwrite ne supporte pas un `OR` entre deux attributs différents dans une seule requête — c'est normal, pas un bug.

## Avant de tester la brique 3 (feed + paiement)

Dans la console Appwrite, crée la collection **videos** (base `leib_db`) avec ces attributs :

| Attribut          | Type    | Requis |
|--------------------|---------|--------|
| createurId          | string  | oui    |
| createurPseudo      | string  | oui    |
| urlLecture          | string  | oui    |
| legende             | string  | non    |
| datePublication     | string  | oui    |

Et la collection **transactions** :

| Attribut          | Type    | Requis |
|--------------------|---------|--------|
| type                | string  | oui    |
| montant             | integer | oui    |
| partAdmin           | integer | oui    |
| partCreateur        | integer | oui    |
| payeurId            | string  | oui    |
| beneficiaireId      | string  | oui    |
| videoId             | string  | non    |
| referenceSebpay     | string  | non    |
| date                | string  | oui    |

⚠️ `paymentService.js` attend une vraie réponse de l'API SebPay (`initierPaiement` / `verifierPaiement`). Tant que tes clés SebPay ne sont pas actives, teste avec des données de démonstration insérées manuellement dans la collection `videos`.

## Avant de tester la brique 2 (auth)

Dans ta console Appwrite, crée la collection **users** (dans la base `leib_db`) avec ces attributs :

| Attribut         | Type    | Requis |
|-------------------|---------|--------|
| pseudo            | string  | oui    |
| email              | string  | oui    |
| role               | string  | oui    |
| soldeLeibPay       | integer | oui    |
| badgeVerifie       | boolean | oui    |
| badgeVip           | boolean | oui    |
| photoProfil        | string  | non    |
| dateInscription    | string  | oui    |

Active aussi "Email/Password" dans Auth → Settings sur Appwrite.

## Générer l'APK Android (une fois le projet avancé)

```bash
# Installer l'outil EAS (une seule fois)
npm install -g eas-cli

# Se connecter à ton compte Expo
eas login

# Configurer le build (une seule fois)
eas build:configure

# Lancer le build APK (preview = fichier .apk direct, pas besoin du Play Store)
eas build --platform android --profile preview
```

Le lien de téléchargement de l'APK apparaît dans le terminal et sur ton dashboard expo.dev à la fin du build.

## Déployer le site web (Expo Web)

```bash
npx expo export --platform web
# Le dossier "dist/" généré peut être déployé sur Vercel, Netlify ou Render
```

## Prochaines briques

1. ~~Structure + config~~ ✅
2. ~~Authentification (inscription / connexion Appwrite)~~ ✅
3. ~~Feed vidéo + blocage 3s + paiement déblocage~~ ✅
4. ~~Wallet LEIB Pay + répartition des gains~~ ✅
5. ~~Upload créateur (Smart Upload)~~ ✅
6. ~~Live streaming + dons~~ ✅
7. ~~Dashboard admin~~ ✅
8. ~~Site web~~ ✅ (celle-ci)

## Toutes les briques sont terminées 🎉

L'app couvre maintenant : auth, feed payant, wallet + retraits, upload créateur, live + dons, dashboard admin, et web (app + landing page). Prochaines étapes naturelles pour toi : configurer tes vraies clés Appwrite/Bunny/Cloudinary/SebPay dans `.env`, créer les collections listées dans ce README, tester sur un vrai téléphone Android via `npx expo start`, puis générer l'APK avec `eas build`.
