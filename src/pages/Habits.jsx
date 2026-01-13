import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import HabitCheckbox from '../components/HabitCheckbox';
import Modal from '../components/Modal';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { showToast } from '../components/ToastContainer';

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
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (habit.completions[dateStr] === true) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
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
    start: startOfWeek(selectedDate, { locale: fr }),
    end: endOfWeek(selectedDate, { locale: fr })
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Mes Habitudes
        </h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          ➕ Nouvelle habitude
        </button>
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 7);
            setSelectedDate(newDate);
          }}
          className="btn btn-secondary"
        >
          ← Semaine précédente
        </button>
        <h2 className="text-lg font-semibold">
          {format(startOfWeek(selectedDate, { locale: fr }), 'dd MMM', { locale: fr })} - {format(endOfWeek(selectedDate, { locale: fr }), 'dd MMM yyyy', { locale: fr })}
        </h2>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 7);
            setSelectedDate(newDate);
          }}
          className="btn btn-secondary"
        >
          Semaine suivante →
        </button>
      </div>

      {/* Liste des habitudes */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucune habitude. Créez-en une pour commencer!</p>
          </div>
        ) : (
          habits.map((habit) => {
            const streak = calculateStreak(habit);
            const completionRate = calculateCompletionRate(habit);
            
            return (
              <div key={habit.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {habit.name}
                    </h3>
                    {habit.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(habit)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-orange-50 dark:bg-orange-900 p-3 rounded-lg">
                    <div className="text-sm text-orange-600 dark:text-orange-400">Streak actuel</div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{streak} jours</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Taux de complétion</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{Math.round(completionRate)}%</div>
                  </div>
                </div>

                {/* Semaine */}
                <div className="grid grid-cols-7 gap-2">
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
            );
          })
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingHabit ? 'Modifier l\'habitude' : 'Nouvelle habitude'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder="Ex: Boire 2L d'eau"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Description optionnelle"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingHabit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;


