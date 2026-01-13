import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import CalendarDay from '../components/CalendarDay';
import Modal from '../components/Modal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';

/**
 * Composant Calendrier (Calendar)
 * Offre une vue mensuelle globale des tâches et des habitudes.
 */
const Calendar = () => {
  // États de navigation et données
  const [currentDate, setCurrentDate] = useState(new Date()); // Mois affiché actuellement
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  // États pour le modal de détails du jour
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [selectedDayHabits, setSelectedDayHabits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronisation des données en temps réel
  useEffect(() => {
    if (!auth.currentUser) return;

    // Écouter les tâches de l'utilisateur
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });

    // Écouter les habitudes de l'utilisateur
    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const habitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHabits(habitsData);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, []);

  /**
   * Calcul des jours à afficher dans la grille (inclut les jours de débordement de la semaine)
   */
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  /**
   * Gère le clic sur un jour pour afficher ses détails
   */
  const handleDayClick = (date) => {
    setSelectedDate(date);
    const dayTasks = getTasksForDay(date);
    const dayHabits = getHabitsForDay(date);

    setSelectedDayTasks(dayTasks);
    setSelectedDayHabits(dayHabits);
    setIsModalOpen(true);
  };

  /**
   * Filtre les tâches ayant une échéance au jour spécifié
   */
  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  /**
   * Filtre les habitudes marquées comme validées au jour spécifié
   */
  const getHabitsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habits.filter(habit => {
      return habit.completions && habit.completions[dateStr] === true;
    });
  };

  // Actions de navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="page-transition min-h-screen pb-20">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
            Mon <span className="text-indigo-600">Calendrier</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Visualisez votre <span className="text-indigo-600 font-bold italic">progression</span> dans le temps.
          </p>
        </div>
        <button
          onClick={goToToday}
          className="btn btn-secondary h-12 px-6 rounded-2xl font-bold flex items-center gap-2 border-slate-200 dark:border-slate-800"
        >
          <CalendarIcon size={18} />
          Aujourd'hui
        </button>
      </div>

      {/* Grille de Calendrier principale */}
      <div className="card p-0 overflow-hidden border-slate-100 dark:border-slate-800 shadow-2xl">
        {/* Barre de navigation du mois */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button onClick={goToNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="p-2 sm:p-6 overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-7 gap-1 min-w-[320px] sm:min-w-full">
            {/* Jours de la semaine */}
            {weekDays.map((day) => (
              <div key={day} className="text-center font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 py-3">
                {day}
              </div>
            ))}

            {/* Cellules des jours */}
            {calendarDays.map((date) => (
              <CalendarDay
                key={date.toISOString()}
                date={date}
                tasks={getTasksForDay(date)}
                habits={getHabitsForDay(date)}
                onDayClick={handleDayClick}
                isToday={isSameDay(date, new Date())}
                isCurrentMonth={isSameMonth(date, currentDate)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Légende et Statistiques Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 card bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            Guide de lecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Tâches en attente</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Tâches terminées</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Date du jour</span>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 border-none text-white shadow-indigo-500/20">
          <h3 className="font-bold text-white/80 text-xs uppercase tracking-widest mb-2">Total ce mois</h3>
          <div className="flex items-end justify-between">
            <div>
              {/* Note: Le calcul ici est fait à chaque rendu sur les tâches du mois affiché */}
              <div className="text-3xl font-black leading-none">
                {tasks.filter(t => t.dueDate && isSameMonth(t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate), currentDate)).length}
              </div>
              <div className="text-[10px] font-bold uppercase opacity-80 mt-1">Objectifs</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black leading-none">{habits.length}</div>
              <div className="text-[10px] font-bold uppercase opacity-80 mt-1">Routines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'aperçu d'un jour spécifique */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? format(selectedDate, 'EEEE dd MMMM', { locale: fr }) : 'Détails du jour'}
      >
        <div className="space-y-6">
          {/* Section Objectifs */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              <Clock size={16} className="text-blue-500" />
              Objectifs du jour
            </h4>
            {selectedDayTasks.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-sm font-medium italic">Aucun objectif programmé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-lg ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {task.completed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <div>
                        <p className={`font-bold transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{task.priority}</span>
                      </div>
                    </div>
                    {task.completed && <span className="text-emerald-500 font-black text-xs">OK</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Routines */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              <Activity size={16} className="text-emerald-500" />
              Routines complétées
            </h4>
            {selectedDayHabits.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-sm font-medium italic">Aucune routine validée ce jour</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDayHabits.map((habit) => (
                  <div key={habit.id} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    {habit.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full py-4 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
          >
            Fermer l'aperçu
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;


