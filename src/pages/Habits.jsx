import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import HabitCheckbox from '../components/HabitCheckbox';
import Modal from '../components/Modal';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { showToast } from '../components/ToastContainer';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Calendar as CalendarIcon,
  Settings2,
  Trash2,
  Edit3,
  Target,
  Sparkles
} from 'lucide-react';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'habits'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHabits(habitsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Le nom est requis', 'error');
      return;
    }

    try {
      const habitData = {
        ...formData,
        userId: auth.currentUser.uid,
        completions: editingHabit?.completions || {},
        createdAt: editingHabit ? editingHabit.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (editingHabit) {
        await updateDoc(doc(db, 'habits', editingHabit.id), habitData);
        showToast('Habitude mise à jour', 'success');
      } else {
        await addDoc(collection(db, 'habits'), habitData);
        showToast('Habitude créée', 'success');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleToggle = async (habitId, dateStr) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const completions = habit.completions || {};
    const newValue = !completions[dateStr];

    try {
      await updateDoc(doc(db, 'habits', habitId), {
        [`completions.${dateStr}`]: newValue,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette habitude?')) return;

    try {
      await deleteDoc(doc(db, 'habits', habitId));
      showToast('Habitude supprimée', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name || '',
      description: habit.description || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingHabit(null);
  };

  const calculateStreak = (habit) => {
    if (!habit.completions) return 0;

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    // Check if completed today, if not start from yesterday
    const todayStr = format(today, 'yyyy-MM-dd');
    if (habit.completions[todayStr] !== true) {
      currentDate = subDays(today, 1);
    }

    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (habit.completions[dateStr] === true) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateCompletionRate = (habit) => {
    if (!habit.completions) return 0;

    const completions = Object.values(habit.completions);
    const completed = completions.filter(c => c === true).length;
    return completions.length > 0 ? (completed / completions.length) * 100 : 0;
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 })
  });

  return (
    <div className="page-transition min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
            Mes <span className="text-emerald-500">Habitudes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            La discipline est la clé de la <span className="text-emerald-500 font-bold italic">réussite</span>.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 px-6 h-12 rounded-2xl group"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
            <Plus size={20} />
          </div>
          Nouvelle routine
        </button>
      </div>

      {/* Week Navigator */}
      <div className="card mb-8 p-3 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 7);
            setSelectedDate(newDate);
          }}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg">
            <CalendarIcon size={18} className="text-emerald-500" />
            <span>
              {format(weekDays[0], 'dd MMM', { locale: fr })} - {format(weekDays[6], 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          {isSameDay(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }), startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 })) && (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Semaine actuelle</span>
          )}
        </div>

        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 7);
            setSelectedDate(newDate);
          }}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-6">
        {habits.length === 0 ? (
          <div className="card py-20 bg-slate-50 dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl mb-4">
              <Sparkles size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Aucune routine enregistrée</p>
            <p className="text-slate-400 text-sm mt-1">Commencez par créer votre première habitude pour suivre vos progrès</p>
          </div>
        ) : (
          habits.map((habit, habitIdx) => {
            const streak = calculateStreak(habit);
            const rate = calculateCompletionRate(habit);

            return (
              <div key={habit.id} className="card p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${habitIdx * 100}ms` }}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Target size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">{habit.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end text-orange-500 font-black">
                            <Flame size={16} fill="currentColor" />
                            <span>{streak}j</span>
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Série</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end text-blue-500 font-black">
                            <Trophy size={16} />
                            <span>{Math.round(rate)}%</span>
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Succès</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                        <button onClick={() => handleEdit(habit)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(habit.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Week Grid */}
                  <div className="grid grid-cols-7 gap-3 sm:gap-4">
                    {weekDays.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isChecked = habit.completions && habit.completions[dateStr] === true;

                      return (
                        <HabitCheckbox
                          key={dateStr}
                          habit={habit}
                          date={date}
                          isChecked={isChecked}
                          onToggle={handleToggle}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Upgrade */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingHabit ? 'Modifier la routine' : 'Nouvelle routine'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Intitulé de l'habitude
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input text-lg font-medium"
                required
                placeholder="Méditation, Sport, Lecture..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pourquoi est-ce important ?
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="Décrivez votre motivation ou les détails de l'exercice..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="btn btn-secondary flex-1 py-3 rounded-xl border-none hover:bg-slate-100"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-600 flex-[2] py-3 rounded-xl shadow-emerald-500/20">
              {editingHabit ? 'Confirmer' : 'Commencer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;


