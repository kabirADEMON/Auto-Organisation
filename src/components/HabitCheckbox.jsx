import React from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check } from 'lucide-react';

const HabitCheckbox = ({ habit, date, isChecked, onToggle }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const today = startOfDay(new Date());
  const isToday = format(today, 'yyyy-MM-dd') === dateStr;
  const isFuture = isAfter(date, today);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {format(date, 'EEE', { locale: fr }).replace('.', '')}
      </span>

      <button
        onClick={() => !isFuture && onToggle(habit.id, dateStr)}
        disabled={isFuture}
        className={`
                relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300
                ${isChecked
            ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20 text-white scale-105'
            : isFuture
              ? 'bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 opacity-30 cursor-not-allowed'
              : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/50'
          }
                ${isToday && !isChecked ? 'ring-2 ring-blue-500/50 shadow-blue-500/10' : ''}
                active:scale-90
            `}
      >
        <span className={`text-xs font-bold ${!isChecked && !isFuture ? 'text-slate-400 dark:text-slate-500' : ''}`}>
          {isChecked ? <Check size={18} strokeWidth={4} /> : format(date, 'd')}
        </span>

        {isToday && !isChecked && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
        )}
      </button>
    </div>
  );
};

export default HabitCheckbox;


