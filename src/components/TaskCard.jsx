import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskCard = ({ task, onToggle, onEdit, onDelete, onAddSubtask }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'normal':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  const isOverdue = task.dueDate && 
    (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)) < new Date() && 
    !task.completed;

  return (
    <div className={`card ${task.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-500 dark:border-red-700' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={task.completed || false}
              onChange={() => onToggle(task.id)}
              className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {task.priority && (
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'urgent' ? '🔴 Urgent' : 
                     task.priority === 'high' ? '🟠 Important' : 
                     task.priority === 'normal' ? '🔵 Normal' : '⚪ Faible'}
                  </span>
                )}
                
                {task.dueDate && (
                  <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    📅 {formatDate(task.dueDate)}
                    {isOverdue && ' (En retard)'}
                  </span>
                )}

                {task.recurrence && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    🔄 {task.recurrence === 'daily' ? 'Quotidien' :
                        task.recurrence === 'weekly' ? 'Hebdomadaire' :
                        task.recurrence === 'monthly' ? 'Mensuel' : task.recurrence}
                  </span>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    📋 {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} sous-tâches
                  </span>
                )}
              </div>

              {/* Sous-tâches */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 ml-8 space-y-2">
                  {task.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={subtask.completed || false}
                        className="w-4 h-4 text-primary-600 rounded"
                        readOnly
                      />
                      <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {onAddSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Ajouter une sous-tâche"
            >
              ➕
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Modifier"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;


