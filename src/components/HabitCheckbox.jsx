import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const HabitCheckbox = ({ habit, date, isChecked, onToggle, streak, completionRate }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
      isChecked 
        ? 'bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-700' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    } ${isToday ? 'ring-2 ring-primary-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isChecked || false}
              onChange={() => onToggle(habit.id, dateStr)}
              className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
              disabled={format(date, 'yyyy-MM-dd') > format(new Date(), 'yyyy-MM-dd')}
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {habit.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-4 text-sm">
            {streak !== undefined && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                🔥 Streak: {streak} jours
              </span>
            )}
            {completionRate !== undefined && (
              <span className="text-blue-600 dark:text-blue-400">
                📊 {Math.round(completionRate)}% complété
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {format(date, 'dd MMM', { locale: fr })}
          </div>
          {isToday && (
            <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
              Aujourd'hui
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HabitCheckbox;


