import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth, requestNotificationPermission, onMessageListener } from '../firebaseConfig';
import { showToast } from '../components/ToastContainer';
import { useTheme } from '../contexts/ThemeContext';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: false
  });
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!auth.currentUser) return;

    const loadUserData = async () => {
      try {
        // Charger les données depuis Firestore
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            name: auth.currentUser.displayName || data.name || '',
            email: auth.currentUser.email || '',
            notifications: data.preferences?.notifications !== false
          });
        } else {
          setFormData({
            name: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            notifications: true
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showToast('Erreur lors du chargement du profil', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Vérifier la permission de notification
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Écouter les messages FCM
    const unsubscribe = onMessageListener((payload) => {
      showToast(payload.notification?.title || 'Nouvelle notification', 'info');
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      // Mettre à jour le profil Firebase Auth
      if (formData.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: formData.name });
      }

      // Mettre à jour Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: formData.name,
        preferences: {
          theme: theme,
          notifications: formData.notifications
        },
        updatedAt: new Date()
      });

      showToast('Profil mis à jour', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        // Sauvegarder le token dans Firestore
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: token,
          notificationPermission: 'granted'
        });
        setNotificationPermission('granted');
        showToast('Notifications activées!', 'success');
      } else {
        setNotificationPermission('denied');
        showToast('Permission refusée', 'warning');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'activation des notifications', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Mon Profil
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Informations personnelles */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Préférences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode sombre
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Actuellement: {theme === 'dark' ? 'Activé' : 'Désactivé'}
                </p>
              </div>
              <button onClick={toggleTheme} className="btn btn-secondary">
                {theme === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications push
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Statut: {
                    notificationPermission === 'granted' ? '✅ Activées' :
                    notificationPermission === 'denied' ? '❌ Refusées' :
                    '⏸️ Non demandées'
                  }
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <button onClick={handleRequestNotifications} className="btn btn-primary">
                  Activer les notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </button>
        </div>

        {/* Informations Firebase */}
        <div className="card bg-blue-50 dark:bg-blue-900">
          <h3 className="text-lg font-semibold mb-2">Informations techniques</h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>ID utilisateur: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{auth.currentUser?.uid}</code></p>
            <p>Projet Firebase configuré: {auth.app ? '✅ Oui' : '❌ Non'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


