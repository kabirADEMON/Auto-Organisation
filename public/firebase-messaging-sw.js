// Firebase Cloud Messaging Service Worker
// Ce fichier DOIT être placé dans le dossier public/ et servi à la racine de l'origine (/firebase-messaging-sw.js)
// Pour GitHub Pages avec sous-chemin, voir README.md pour les solutions alternatives

// Import et configuration Firebase
// IMPORTANT: Remplacez cette configuration par vos propres clés Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase
// Remplacez ces valeurs par votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDTyOiYMz2p1XQWx-EWm064K1gAOMj5pbU",
  authDomain: "projetgestion-9b52f.firebaseapp.com",
  projectId: "projetgestion-9b52f",
  storageBucket: "projetgestion-9b52f.firebasestorage.app",
  messagingSenderId: "714877031996",
  appId: "1:714877031996:web:5ca0f56cea1b42f13a1539"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les messages en arrière-plan (quand l'app est fermée ou en arrière-plan)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez un nouveau message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.taskId || 'default',
    data: payload.data || {},
    requireInteraction: false,
    actions: payload.data?.actions || []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification cliquée:', event);
  
  event.notification.close();

  // Ouvrir l'application (ou un onglet spécifique selon les données)
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focaliser
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Note importante pour GitHub Pages:
// Si votre site est servi depuis un sous-chemin (ex: user.github.io/repo/),
// FCM nécessite que firebase-messaging-sw.js soit à la racine de l'origine.
// Solutions possibles:
// 1. Utiliser un site utilisateur GitHub Pages (user.github.io)
// 2. Utiliser un domaine personnalisé
// 3. Utiliser Firebase Hosting (recommandé pour FCM)


