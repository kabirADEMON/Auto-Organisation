/**
 * Service Worker Registration
 * 
 * Ce fichier enregistre le service worker pour la PWA et FCM
 * IMPORTANT: Firebase Messaging nécessite son propre service worker (firebase-messaging-sw.js)
 */

// Enregistrer le service worker Vite PWA (géré par vite-plugin-pwa)
// Ce service worker sera généré automatiquement lors du build

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vite PWA plugin gère automatiquement l'enregistrement
    // Le service worker Vite sera enregistré automatiquement
    
    // Vérifier si nous sommes en développement
    if (import.meta.env.DEV) {
      console.log('[Service Worker] Mode développement - Service Worker désactivé');
      return;
    }

    // En production, le service worker Vite PWA sera automatiquement enregistré
    console.log('[Service Worker] Vite PWA Service Worker sera enregistré automatiquement après le build');
  });
}

// Note importante sur Firebase Cloud Messaging:
// FCM nécessite que firebase-messaging-sw.js soit servi à la racine de l'origine
// Si votre site est sur GitHub Pages avec un sous-chemin (user.github.io/repo/),
// vous devrez soit:
// 1. Utiliser un site utilisateur GitHub Pages (user.github.io)
// 2. Utiliser un domaine personnalisé
// 3. Utiliser Firebase Hosting (recommandé pour FCM)

export default {};


