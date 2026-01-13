import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import CalendarDay from '../components/CalendarDay';
import Modal from '../components/Modal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { showToast } from '../components/ToastContainer';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Écouter les tâches
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

    // Écouter les habitudes
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const handleDayClick = (date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });

    setSelectedDayTasks(dayTasks);
    setIsModalOpen(true);
  };

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const getHabitsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habits.filter(habit => {
      return habit.completions && habit.completions[dateStr] === true;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Calendrier
        </h1>
        <div className="flex items-center space-x-2">
          <button onClick={goToToday} className="btn btn-secondary">
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Navigation mois */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousMonth} className="btn btn-secondary">
            ←
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button onClick={goToNextMonth} className="btn btn-secondary">
            →
          </button>
        </div>

        {/* Grille calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes des jours */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2"
            >
              {day}
            </div>
          ))}

          {/* Jours du calendrier */}
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

      {/* Légende */}
      <div className="card">
        <h3 className="font-semibold mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded"></div>
            <span>Tâches en retard</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
            <span>Tâches complétées</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded"></div>
            <span>Habitudes complétées</span>
          </div>
        </div>
      </div>

      {/* Modal détails du jour */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : 'Détails'}
      >
        {selectedDayTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Aucune tâche prévue pour ce jour</p>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${
                  task.completed
                    ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}
                    {task.priority && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 rounded">
                        {task.priority}
                      </span>
                    )}
                  </div>
                  {task.completed && (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;


