import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { showToast } from '../../components/ToastContainer';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (error) {
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        default:
          errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="card text-center backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border-white/50 dark:border-slate-700/50 p-8">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
              <Send size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Email envoyé!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.<strong>Si vous ne recevez pas l'email dans les 2 minutes, vérifiez votre dossier Indésirables (Spam)</strong>
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 mb-8 text-left">
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                <strong>💡 Note professionnelle :</strong> Si vous ne recevez pas l'email dans les 2 minutes, vérifiez votre dossier <strong>Indésirables (Spam)</strong>. Pour un usage professionnel, vous pouvez personnaliser l'expéditeur dans votre console Firebase.
              </p>
            </div>

            <Link to="/login" className="btn btn-primary w-full justify-center">
              <ArrowLeft size={18} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-bold text-slate-900 dark:text-white">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="card backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border-white/50 dark:border-slate-700/50">
          <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


