# Auto-Organisation

Application web progressive (PWA) développée avec React et Firebase pour faciliter l'organisation personnelle. Elle centralise la gestion des tâches, le suivi des habitudes et la planification des activités dans une interface unique.

## Fonctionnalités

- **Authentification :** inscription, connexion et réinitialisation du mot de passe.
- **Gestion des tâches :** création, modification, suppression, priorités, sous-tâches et récurrence.
- **Suivi des habitudes :** validation quotidienne, suivi des séries et statistiques.
- **Calendrier :** visualisation mensuelle et consultation des activités par jour.
- **Tableau de bord :** indicateurs de productivité et graphiques de suivi.
- **Notifications :** notifications push avec Firebase Cloud Messaging.
- **Thème :** prise en charge des modes clair et sombre avec sauvegarde des préférences.
- **PWA :** application installable avec prise en charge partielle du fonctionnement hors ligne.

## Technologies utilisées

| Technologie | Utilisation |
|---|---|
| React 18 | Interface utilisateur |
| Vite | Environnement de développement et build |
| Firebase Authentication | Authentification |
| Cloud Firestore | Stockage des données |
| Firebase Cloud Messaging | Notifications push |
| Tailwind CSS | Mise en forme |
| React Router | Navigation |
| Recharts | Visualisation des données |
| Framer Motion | Animations |
| date-fns | Manipulation des dates |

## Prérequis

- Node.js 18 ou supérieur
- npm
- Un projet Firebase configuré

## Installation

Cloner le dépôt :

```bash
git clone <URL_DU_DEPOT>
cd gestion
```

Installer les dépendances :

```bash
npm install
```

## Configuration

### 1. Configurer Firebase

Créer un projet depuis la [console Firebase](https://console.firebase.google.com/), puis activer les services suivants :

- Firebase Authentication avec la méthode Email/Password.
- Cloud Firestore.
- Firebase Cloud Messaging pour les notifications push.

### 2. Configurer les variables Firebase

Renseigner les informations du projet Firebase dans `src/firebaseConfig.js` :

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

Pour les notifications push, configurer également la clé publique VAPID.

Le fichier `public/firebase-messaging-sw.js` doit recevoir la configuration Firebase correspondante.

### 3. Configurer les règles Firestore

Les règles de sécurité Firestore doivent limiter l'accès aux données en fonction de l'identifiant de l'utilisateur authentifié.

Il est recommandé de vérifier les règles de lecture, d'écriture, de création et de suppression avant toute mise en production.

## Démarrage

Lancer le serveur de développement :

```bash
npm run dev
```

L'application sera accessible à l'adresse :

```text
http://localhost:5173
```

## Build et prévisualisation

Générer les fichiers de production :

```bash
npm run build
```

Prévisualiser le résultat :

```bash
npm run preview
```

Les fichiers générés sont disponibles dans le dossier `dist/`.

## Déploiement

Le projet prévoit un déploiement sur GitHub Pages à l'aide de `gh-pages` ou de GitHub Actions.

```bash
npm run deploy
```

**Remarque concernant Firebase Cloud Messaging :**

GitHub Pages utilise généralement un sous-chemin pour les dépôts classiques. Cette configuration peut poser problème au service worker Firebase Cloud Messaging, qui nécessite un chemin adapté à la racine de l'origine.

Pour une configuration plus simple des notifications push, Firebase Hosting constitue une alternative à considérer.

## Structure du projet

```text
gestion/
├── public/
│   ├── firebase-messaging-sw.js
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── firebaseConfig.js
│   ├── serviceWorkerRegistration.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── gh-pages.yml
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Licence

Ce projet est distribué sous licence MIT.
