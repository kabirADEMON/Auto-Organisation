# Auto-Organisation - PWA React + Firebase

Application Progressive Web App (PWA) complète pour la gestion de tâches, habitudes et calendrier, construite avec React, Firebase, TailwindCSS et déployable sur GitHub Pages.

## 🚀 Fonctionnalités

- ✅ **Authentification complète** (Inscription, Connexion, Réinitialisation de mot de passe)
- 📋 **Gestion des tâches** (CRUD, sous-tâches, priorités, récurrence)
- 🔄 **Suivi des habitudes** (check quotidien, streaks, statistiques)
- 📅 **Calendrier interactif** (vue mensuelle, détails du jour)
- 📊 **Dashboard** (KPI, graphiques, productivité)
- 🔔 **Notifications push** (Firebase Cloud Messaging)
- 🌙 **Mode sombre/clair** (persistance des préférences)
- 📱 **PWA** (installable, fonctionne hors-ligne partiellement)

## 🛠️ Stack Technique

- **React 18** (avec Vite)
- **Firebase** (Auth, Firestore, Cloud Messaging)
- **TailwindCSS** (styling, mode sombre)
- **React Router** (navigation)
- **Recharts** (graphiques)
- **Framer Motion** (animations)
- **date-fns** (gestion des dates)

## 📋 Prérequis

- Node.js 18+ et npm
- Un compte Firebase (gratuit)
- Un compte GitHub (pour le déploiement)

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd gestion
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Firebase

#### 3.1 Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Suivez les étapes de création (notez le nom du projet)
4. Désactivez Google Analytics si vous le souhaitez (optionnel)

#### 3.2 Activer Authentication

1. Dans Firebase Console, allez dans **Authentication** > **Get Started**
2. Activez la méthode **Email/Password**
3. Cliquez sur "Email/Password" > Activer > Sauvegarder

#### 3.3 Créer une base de données Firestore

1. Allez dans **Firestore Database** > **Create database**
2. Choisissez le mode **Production** ou **Test** (pour débuter)
3. Choisissez une région (ex: `europe-west`)
4. Cliquez sur "Enable"

#### 3.4 Configurer les règles Firestore

Dans **Firestore Database** > **Rules**, remplacez les règles par:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour les tâches
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Règles pour les habitudes
    match /habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Règles pour les tokens FCM (optionnel, pour notifications)
    match /users/{userId}/tokens/{tokenId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Cliquez sur "Publish".

#### 3.5 Activer Cloud Messaging (FCM)

1. Dans Firebase Console, allez dans **Project Settings** (⚙️)
2. Onglet **Cloud Messaging**
3. Si nécessaire, activez l'API Firebase Cloud Messaging dans Google Cloud Console

#### 3.6 Obtenir la configuration Firebase

1. Toujours dans **Project Settings** > **General**
2. Faites défiler jusqu'à "Your apps"
3. Cliquez sur l'icône Web (`</>`) pour ajouter une application web
4. Donnez un nom à l'app (ex: "Auto-Organisation")
5. **Ne cochez PAS** "Also set up Firebase Hosting" pour le moment
6. Copiez la configuration Firebase qui s'affiche (elle ressemble à):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### 3.7 Générer une clé VAPID pour FCM

1. Dans **Project Settings** > **Cloud Messaging**
2. Section "Web configuration" > "Web Push certificates"
3. Cliquez sur "Generate key pair" si aucune clé n'existe
4. Copiez la **clé publique** (Public Key) - vous en aurez besoin plus tard

### 4. Configurer l'application

#### 4.1 Mettre à jour `src/firebaseConfig.js`

Remplacez les valeurs par votre configuration Firebase:

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID",
  vapidKey: "VOTRE_VAPID_PUBLIC_KEY" // Optionnel, ajoutez-le ici ou plus tard
};
```

#### 4.2 Mettre à jour `public/firebase-messaging-sw.js`

Remplacez la configuration Firebase dans ce fichier également:

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

**Important**: Ce fichier DOIT être servi à la racine de votre domaine (`/firebase-messaging-sw.js`) pour que FCM fonctionne correctement.

### 5. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📦 Build pour production

```bash
npm run build
```

Le dossier `dist/` contiendra les fichiers optimisés pour la production.

Pour prévisualiser la version de production localement:

```bash
npm run preview
```

## 🚀 Déploiement sur GitHub Pages

### Option 1: Utiliser `gh-pages` (recommandé pour débuter)

#### Étape 1: Configurer le base path dans `vite.config.js`

Assurez-vous que le `base` est correct pour votre repo:

```javascript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/gestion/' : '/',
  // ... reste de la config
});
```

Remplacez `/gestion/` par le nom de votre repository GitHub.

#### Étape 2: Déployer

```bash
npm run deploy
```

Cette commande va:
1. Build l'application (`npm run build`)
2. Déployer le dossier `dist/` sur la branche `gh-pages`

#### Étape 3: Activer GitHub Pages

1. Allez dans votre repo GitHub > **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` > dossier: `/ (root)`
4. Cliquez sur "Save"

Votre site sera disponible sur: `https://votre-username.github.io/gestion/`

### Option 2: GitHub Actions (automatique)

Le workflow `.github/workflows/gh-pages.yml` est déjà configuré pour déployer automatiquement à chaque push sur `main`.

1. Assurez-vous que GitHub Pages est activé dans les Settings du repo
2. Poussez votre code sur la branche `main`
3. Le workflow se déclenchera automatiquement

## ⚠️ Limitations importantes avec GitHub Pages et FCM

### Problème avec les sous-chemins

Firebase Cloud Messaging (FCM) **nécessite** que `firebase-messaging-sw.js` soit servi à la **racine de l'origine** (`https://votre-domaine.com/firebase-messaging-sw.js`).

Si votre site est déployé sur GitHub Pages avec un sous-chemin (ex: `user.github.io/repo/`), FCM ne fonctionnera **PAS correctement** car le service worker sera à `user.github.io/repo/firebase-messaging-sw.js` au lieu de `user.github.io/firebase-messaging-sw.js`.

### Solutions possibles

#### Solution 1: Site utilisateur GitHub Pages (Recommandé pour GitHub Pages)

1. Créez un repo nommé exactement `votre-username.github.io`
2. Déployez-y votre application
3. Votre site sera accessible sur `https://votre-username.github.io/` (sans sous-chemin)
4. FCM fonctionnera correctement

#### Solution 2: Domaine personnalisé

1. Configurez un domaine personnalisé dans les Settings GitHub Pages
2. Assurez-vous que le domaine pointe vers la racine
3. FCM fonctionnera avec le domaine personnalisé

#### Solution 3: Firebase Hosting (RECOMMANDÉ pour FCM)

Firebase Hosting est mieux adapté pour les PWA avec FCM:

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser Firebase Hosting
firebase init hosting

# Build l'application
npm run build

# Déployer
firebase deploy --only hosting
```

Avantages:
- FCM fonctionne parfaitement
- HTTPS automatique
- CDN global
- Gratuit jusqu'à 10 GB/mois

## 🔔 Configuration des notifications push

### 1. Activer les notifications dans l'application

1. Connectez-vous à l'application
2. Allez dans **Profil**
3. Cliquez sur "Activer les notifications"
4. Acceptez la permission du navigateur

### 2. Tester les notifications via Firebase Console

1. Dans Firebase Console > **Cloud Messaging**
2. Cliquez sur "Send your first message"
3. Entrez un titre et un message
4. Cliquez sur "Send test message"
5. Collez le token FCM de l'utilisateur (visible dans la console du navigateur après activation)
6. Envoyez

### 3. Tester les notifications via script (optionnel)

Créez un fichier `scripts/send-notification.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Téléchargez depuis Firebase Console > Project Settings > Service Accounts

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: 'Nouvelle tâche!',
    body: 'Vous avez une nouvelle tâche à compléter'
  },
  token: 'USER_FCM_TOKEN_HERE' // Remplacez par un token réel
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Notification envoyée:', response);
  })
  .catch((error) => {
    console.error('Erreur:', error);
  });
```

## 📁 Structure du projet

```
/
├── public/
│   ├── firebase-messaging-sw.js    # Service Worker pour FCM
│   ├── manifest.json               # Manifest PWA
│   └── favicon.ico
├── src/
│   ├── components/                 # Composants réutilisables
│   │   ├── Navbar.jsx
│   │   ├── TaskCard.jsx
│   │   ├── HabitCheckbox.jsx
│   │   ├── CalendarDay.jsx
│   │   ├── Modal.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── ToastContainer.jsx
│   ├── contexts/                   # Contextes React
│   │   ├── ThemeContext.jsx
│   │   └── AuthContext.jsx
│   ├── pages/                      # Pages de l'application
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── Tasks.jsx
│   │   ├── Habits.jsx
│   │   ├── Calendar.jsx
│   │   ├── Dashboard.jsx
│   │   └── Profile.jsx
│   ├── firebaseConfig.js           # Configuration Firebase
│   ├── serviceWorkerRegistration.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .github/workflows/
│   └── gh-pages.yml                # Workflow GitHub Actions
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🧪 Tests

Pour tester l'application:

1. Créez un compte via l'interface d'inscription
2. Créez quelques tâches avec différentes priorités
3. Ajoutez des habitudes et cochez-les quotidiennement
4. Consultez le calendrier et le dashboard
5. Activez les notifications dans le profil
6. Testez l'installation PWA (bouton "Installer" dans le navigateur)

## 🐛 Dépannage

### Les notifications ne fonctionnent pas

- Vérifiez que `firebase-messaging-sw.js` est accessible à la racine de votre domaine
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que la clé VAPID est correctement configurée
- Vérifiez que les permissions de notification sont accordées

### Erreur "Firebase: Error (auth/permission-denied)"

- Vérifiez que les règles Firestore sont correctement configurées
- Vérifiez que l'utilisateur est bien authentifié

### L'application ne se charge pas après le déploiement

- Vérifiez que le `base` dans `vite.config.js` correspond au nom de votre repo
- Vérifiez que le build a réussi sans erreurs
- Vérifiez la console du navigateur pour les erreurs

### Mode PWA ne fonctionne pas

- Vérifiez que le site est servi en HTTPS (requis pour les PWA)
- Vérifiez que `manifest.json` est présent dans `public/`
- Vérifiez que les icônes sont présentes

## 📝 Scripts disponibles

- `npm run dev` - Lancer en mode développement
- `npm run build` - Build pour la production
- `npm run preview` - Prévisualiser le build de production
- `npm run deploy` - Déployer sur GitHub Pages (nécessite `gh-pages`)

## 🔐 Sécurité

- Les règles Firestore empêchent les utilisateurs d'accéder aux données d'autres utilisateurs
- Les mots de passe sont gérés par Firebase Auth (hashage sécurisé)
- Les tokens FCM sont stockés par utilisateur dans Firestore

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Note importante**: Pour une utilisation en production avec FCM, nous recommandons fortement d'utiliser Firebase Hosting plutôt que GitHub Pages, car il est mieux adapté pour les PWA avec notifications push.


