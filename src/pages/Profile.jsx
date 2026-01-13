import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, requestNotificationPermission, onMessageListener } from '../firebaseConfig';
import { showToast } from '../components/ToastContainer';
import { useTheme } from '../contexts/ThemeContext';
import {
  User,
  Mail,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  Save,
  Fingerprint,
  Zap,
  Camera,
  Loader2
} from 'lucide-react';

/**
 * Composant de Profil Utilisateur (Profile)
 * Gère les informations personnelles, les préférences de thème et de notifications.
 */
const Profile = () => {
  // États de données et chargement
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: false
  });

  const [notificationPermission, setNotificationPermission] = useState('default');
  const { theme, toggleTheme } = useTheme();

  // Chargement initial des données depuis Firebase Auth et Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const loadUserData = async () => {
      try {
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
          // Cas où le document user n'existe pas encore
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

    // Vérifier les permissions de notification navigateur
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Écouteur pour les notifications FCM entrantes
    const unsubscribe = onMessageListener((payload) => {
      showToast(payload.notification?.title || 'Nouvelle notification', 'info');
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Gère le changement d'image de profil
   */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner une image valide', 'error');
      return;
    }

    // Validation de la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('L\'image est trop volumineuse (max 2MB)', 'error');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Mettre à jour le profil Auth
      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // Mettre à jour Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: downloadURL,
        updatedAt: new Date()
      });

      showToast('Photo de profil mise à jour', 'success');
    } catch (error) {
      console.error('Erreur upload:', error);
      showToast('Erreur lors du téléchargement de l\'image', 'error');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Sauvegarde les modifications (Auth DisplayName + Firestore Doc)
   */
  const handleSave = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      // 1. Mettre à jour l'email si modifié (nécessite une nouvelle vérification ou ré-authentification récente)
      if (formData.email !== auth.currentUser.email) {
        try {
          // Utilise verifyBeforeUpdateEmail (recommandé v9+) pour envoyer un mail de confirmation
          await verifyBeforeUpdateEmail(auth.currentUser, formData.email);
          showToast('Un email de vérification a été envoyé à la nouvelle adresse', 'info');
        } catch (emailError) {
          console.error('Erreur email:', emailError);
          if (emailError.code === 'auth/requires-recent-login') {
            showToast('Veuillez vous reconnecter pour changer votre email', 'warning');
          } else {
            showToast('Erreur lors du changement d\'email', 'error');
          }
          setSaving(false);
          return;
        }
      }

      // 2. Mettre à jour le profil d'authentification si le nom a changé
      if (formData.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: formData.name });
      }

      // 3. Mettre à jour les préférences dans Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: formData.name,
        email: formData.email,
        preferences: {
          theme: theme,
          notifications: formData.notifications
        },
        updatedAt: new Date()
      });

      showToast('Votre profil a été mis à jour avec succès.', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Une erreur est survenue lors de la mise à jour de votre profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Gère la demande d'autorisation pour les notifications Push (FCM)
   */
  const handleRequestNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        // Enregistrer le token FCM dans Firestore pour pouvoir envoyer des messages
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

  // État de chargement global
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-4xl mx-auto pb-20">
      {/* En-tête de profil */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => !uploading && fileInputRef.current.click()}
            className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform cursor-pointer overflow-hidden relative`}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={40} />
            ) : auth.currentUser?.photoURL ? (
              <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              formData.name.charAt(0).toUpperCase() || 'U'
            )}

            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${uploading ? 'opacity-100' : ''}`}>
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
            <Camera size={20} />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tight"> Mon <span className="text-blue-600">Espace</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gérez vos informations et préférences personnelles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Carte d'Identité */}
          <div className="card overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Identité</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input pl-12 font-bold text-slate-800 dark:text-white"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Adresse électronique</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input pl-12 text-slate-800 dark:text-white font-medium"
                    placeholder="votre@email.com"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 italic flex items-center gap-1">
                  <ShieldCheck size={12} /> Le changement d'email nécessite une validation
                </p>
              </div>
            </div>
          </div>

          {/* Préférences UI & Notifications */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                <Zap size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Préférences</h2>
            </div>

            <div className="space-y-4">
              {/* Thème */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-500">
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Apparence </p>
                    <p className="text-xs font-medium text-slate-500">{theme === 'dark' ? 'Mode sombre' : 'Mode clair'} activé</p>
                  </div>
                </div>
                <button onClick={toggleTheme} className="btn btn-secondary h-10 px-4 rounded-xl border-none font-bold">
                  Changer
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm ${notificationPermission === 'granted' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Alertes & Rappels</p>
                    <p className="text-xs font-medium text-slate-500">
                      {notificationPermission === 'granted' ? 'Notifications push activées' : 'Notifications désactivées'}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'granted' && (
                  <button onClick={handleRequestNotifications} className="btn btn-primary h-10 px-4 rounded-xl shadow-blue-500/20 font-bold">
                    Autoriser
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary h-14 px-8 rounded-2xl shadow-blue-500/25 font-black text-sm uppercase tracking-widest gap-3"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informations Système (UID, État) */}
        <div className="space-y-6">
          <div className="card bg-slate-900 border-none text-white shadow-xl overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <Fingerprint size={20} />
              </div>
              <h2 className="text-lg font-bold">Données système</h2>
            </div>

            <div className="space-y-4 relative">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Identifiant unique</p>
                <code className="block p-3 bg-white/5 rounded-xl text-xs font-mono text-blue-300 break-all border border-white/5">
                  {auth.currentUser?.uid}
                </code>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">État Firebase</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase">Operationnel</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/40">
            <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm mb-2">Version PWA</h4>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/60 leading-relaxed">
              Votre application est à jour. Les fonctionnalités de synchronisation hors-ligne sont actives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


