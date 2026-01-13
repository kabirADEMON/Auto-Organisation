import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth, requestNotificationPermission, onMessageListener } from '../firebaseConfig';
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
  Camera
} from 'lucide-react';

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

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

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
      if (formData.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: formData.name });
      }

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
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform">
            {formData.name.charAt(0).toUpperCase() || 'U'}
            <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-blue-500 transition-colors">
              <Camera size={20} />
            </div>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tight"> Mon <span className="text-blue-600">Espace</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gérez vos informations et préférences personnelles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Identity Card */}
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
                    disabled
                    className="input pl-12 bg-slate-50 dark:bg-slate-800 cursor-not-allowed text-slate-500 font-medium opacity-70"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 italic flex items-center gap-1">
                  <ShieldCheck size={12} /> L'email est vérifié et non modifiable
                </p>
              </div>
            </div>
          </div>

          {/* Automation & UI Card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                <Zap size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Préférences</h2>
            </div>

            <div className="space-y-4">
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


