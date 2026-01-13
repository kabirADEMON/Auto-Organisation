import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';

/**
 * Système de notifications Toast "Premium"
 * Utilise un pattern de listeners pour déclencher des notifications depuis n'importe quel fichier.
 */
let toastIdCounter = 0;
const toastListeners = [];

/**
 * Déclenche une notification
 * @param {string} message - Le contenu textuel
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée d'affichage en ms
 */
export const showToast = (message, type = 'info', duration = 4000) => {
  const id = ++toastIdCounter;
  const toast = { id, message, type, duration };

  // Notifie tous les containers actifs
  toastListeners.forEach(listener => listener(toast));

  // Auto-suppression après la durée spécifiée
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
};

/**
 * Supprime explicitement une notification par son ID
 */
export const removeToast = (id) => {
  toastListeners.forEach(listener => listener({ id, remove: true }));
};

/**
 * Composant de rendu des notifications (placé à la racine du projet)
 */
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // S'enregistrer comme listener lors du montage
    const listener = (toast) => {
      if (toast.remove) {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      } else {
        setToasts((prev) => [...prev, toast]);
      }
    };

    toastListeners.push(listener);
    return () => {
      // Nettoyage lors du démontage
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  /**
   * Retourne les styles et icônes correspondants au type de Toast
   */
  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-300',
          icon: <CheckCircle2 size={18} className="text-emerald-500" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300',
          icon: <AlertCircle size={18} className="text-red-500" />
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-300',
          icon: <AlertTriangle size={18} className="text-orange-500" />
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          icon: <Info size={18} className="text-blue-500" />
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-8 sm:right-8 z-[100] space-y-3 w-auto sm:max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              layout
              className={`
                pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 transition-all
                ${config.bg} ${config.border} ${config.text}
              `}
            >
              <div className="flex-shrink-0">{config.icon}</div>
              <p className="flex-1 text-sm font-bold leading-tight">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-50 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;


