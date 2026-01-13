import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  CalendarDays,
  User,
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    if (!window.confirm('Voulez-vous vous déconnecter ?')) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tâches', icon: CheckSquare },
    { path: '/habits', label: 'Habits', icon: Repeat },
    { path: '/calendar', label: 'Temps', icon: CalendarDays },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar - Desktop & Mobile Header */}
      <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-slate-900 transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard size={20} />
              </div>
              <span className="hidden sm:block text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 italic tracking-tight">
                Soper <span className="text-blue-600">App</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2 ${active
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              <button
                onClick={handleSignOut}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-900 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${active
                  ? 'text-blue-600 dark:text-blue-400 scale-110'
                  : 'text-slate-400 dark:text-slate-600'
                  }`}>
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                </div>
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                )}
                <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'
                  }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;


