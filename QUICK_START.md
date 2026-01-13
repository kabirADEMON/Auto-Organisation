# Guide de démarrage rapide

## 1. Installation

```bash
npm install
```

## 2. Configuration Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez **Authentication** (Email/Password)
3. Créez une **Firestore Database**
4. Configurez les règles Firestore (voir README.md)
5. Activez **Cloud Messaging**
6. Copiez votre configuration Firebase

## 3. Mise à jour des fichiers de configuration

### `src/firebaseConfig.js`
Remplacez `YOUR_*` par vos valeurs Firebase.

### `public/firebase-messaging-sw.js`
Remplacez la configuration Firebase dans ce fichier également.

## 4. Lancer en développement

```bash
npm run dev
```

## 5. Build et déploiement

```bash
npm run build
npm run deploy
```

## ⚠️ Important pour GitHub Pages

Modifiez `vite.config.js` ligne 59 pour correspondre à votre nom de repo:

```javascript
base: process.env.NODE_ENV === 'production' ? '/VOTRE-REPO-NAME/' : '/',
```

## 🔔 Notifications Push

⚠️ **Limitation**: FCM nécessite que `firebase-messaging-sw.js` soit à la racine du domaine.

- Si votre site est sur `user.github.io/repo/`, FCM ne fonctionnera **PAS**
- Solutions: Site utilisateur GitHub Pages (`user.github.io`) ou Firebase Hosting (recommandé)

Voir README.md pour plus de détails.


