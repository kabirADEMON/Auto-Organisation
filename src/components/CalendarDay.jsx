import React from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarDay = ({ date, tasks = [], habits = [], onDayClick, isToday, isCurrentMonth }) => {
  const dayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });

  const completedTasks = dayTasks.filter(t => t.completed).length;
  const pendingTasks = dayTasks.length - completedTasks;
  
  const dayHabits = habits.filter(habit => {
    // Vérifier si l'habitude a été complétée ce jour
    if (!habit.completions) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completions[dateStr] === true;
  }).length;

  const isSelected = isSameDay(date, new Date());

  return (
    <button
      onClick={() => onDayClick && onDayClick(date)}
      className={`
        relative p-2 h-24 border border-gray-200 dark:border-gray-700 rounded-lg
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900' : ''}
        ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}
      `}
    >
      <div className="text-left">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {format(date, 'd', { locale: fr })}
        </div>
        
        {dayTasks.length > 0 && (
          <div className="mt-1 space-y-1">
            {pendingTasks > 0 && (
              <div className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded px-1">
                {pendingTasks} tâche{pendingTasks > 1 ? 's' : ''}
              </div>
            )}
            {completedTasks > 0 && (
              <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded px-1">
                ✓ {completedTasks}
              </div>
            )}
          </div>
        )}

        {dayHabits > 0 && (
          <div className="mt-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded px-1">
            🔄 {dayHabits}
          </div>
        )}
      </div>
    </button>
  );
};

export default CalendarDay;


