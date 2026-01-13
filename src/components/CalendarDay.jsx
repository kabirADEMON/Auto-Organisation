import React from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarDay = ({ date, tasks = [], habits = [], onDayClick, isToday, isCurrentMonth }) => {
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const dayHabitCount = habits.length;

  return (
    <button
      onClick={() => onDayClick && onDayClick(date)}
      className={`
        relative group h-24 sm:h-32 p-2 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-1 overflow-hidden
        ${!isCurrentMonth ? 'opacity-20 hover:opacity-100 dark:border-slate-800' : 'dark:border-slate-800/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10'}
        ${isToday
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 ring-2 ring-blue-500/20'
          : 'bg-white dark:bg-slate-900/40 border-slate-100'}
      `}
    >
      <span className={`text-sm font-black transition-colors ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
        {format(date, 'd')}
      </span>

      <div className="w-full space-y-1">
        {pendingTasks > 0 && (
          <div className="w-full h-1.5 bg-red-400/20 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${(pendingTasks / tasks.length) * 100}%` }}></div>
          </div>
        )}
        {completedTasks > 0 && (
          <div className="w-full h-1.5 bg-emerald-400/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(completedTasks / tasks.length) * 100}%` }}></div>
          </div>
        )}
      </div>

      <div className="mt-auto w-full flex flex-wrap gap-1">
        {tasks.length > 0 && (
          <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-[9px] uppercase tracking-tighter text-slate-500">
            {tasks.length} T
          </div>
        )}
        {dayHabitCount > 0 && (
          <div className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded font-black text-[9px] uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">
            {dayHabitCount} H
          </div>
        )}
      </div>

      {isToday && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export default CalendarDay;


