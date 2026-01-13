/**
 * Configuration Firebase
 * 
 * INSTRUCTIONS:
 * 1. Créez un projet Firebase sur https://console.firebase.google.com/
 * 2. Activez Authentication (Email/Password)
 * 3. Créez une base de données Firestore
 * 4. Activez Cloud Messaging (FCM)
 * 5. Copiez votre configuration Firebase ci-dessous
 * 6. Pour FCM, générez une paire de clés VAPID (voir README.md)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Configuration Firebase
// REMPLACEZ ces valeurs par votre propre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDTyOiYMz2p1XQWx-EWm064K1gAOMj5pbU",
  authDomain: "projetgestion-9b52f.firebaseapp.com",
  projectId: "projetgestion-9b52f",
  storageBucket: "projetgestion-9b52f.firebasestorage.app",
  messagingSenderId: "714877031996",
  appId: "1:714877031996:web:5ca0f56cea1b42f13a1539",
  // Ajoutez votre clé publique VAPID ici (optionnel, peut être défini plus tard)
  // vapidKey: "YOUR_VAPID_PUBLIC_KEY"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuration de messaging (FCM)
let messaging = null;

// Initialiser messaging uniquement si supporté (navigateur avec service worker)
const initMessaging = async () => {
  try {
    const isMessagingSupported = await isSupported();
    if (isMessagingSupported) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.warn('Firebase Cloud Messaging non supporté:', error);
  }
};

// Appeler l'initialisation
initMessaging();

/**
 * Demander la permission pour les notifications et obtenir le token FCM
 * @returns {Promise<string|null>} Le token FCM ou null si refusé/erreur
 */
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('Messaging non initialisé');
    return null;
  }

  try {
    // Demander la permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permission de notification accordée');
      
      // Obtenir le token FCM
      // IMPORTANT: La clé VAPID doit être configurée dans Firebase Console > Project Settings > Cloud Messaging
      const token = await getToken(messaging, {
        vapidKey: firebaseConfig.vapidKey || 'YOUR_VAPID_PUBLIC_KEY'
      });
      
      if (token) {
        console.log('Token FCM obtenu:', token);
        return token;
      } else {
        console.warn('Aucun token disponible');
        return null;
      }
    } else {
      console.log('Permission de notification refusée');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return null;
  }
};

/**
 * Écouter les messages FCM quand l'application est au premier plan
 * @param {Function} callback - Fonction appelée quand un message est reçu
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Message reçu au premier plan:', payload);
    callback(payload);
  });
};

export default app;


