import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Navbar from './components/Navbar';
import ThemeProvider from './contexts/ThemeContext';
import AuthContext from './contexts/AuthContext';

// Import des pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Import des composants globaux
import ToastContainer from './components/ToastContainer';

/**
 * Composant Racine de l'application
 * Gère l'état global de l'authentification, le routage et les contextes (Thème, Auth).
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Surveillance de l'état d'authentification de l'utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Écran de chargement initial stylisé
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="mt-8">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase italic">Soper</h1>
              <div className="flex justify-center gap-1 mt-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user }}>
        <Router basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30">
            {user ? (
              /* Routes pour utilisateurs Authentifiés */
              <>
                <Navbar />
                <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </>
            ) : (
              /* Routes pour utilisateurs Non-Authentifiés */
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
            {/* Overlay global pour les notifications */}
            <ToastContainer />
          </div>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;

