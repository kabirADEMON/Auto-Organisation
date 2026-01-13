import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  PlusSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Flag
} from 'lucide-react';

const TaskCard = ({ task, onToggle, onEdit, onDelete, onAddSubtask }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: '🔴', label: 'Urgent' };
      case 'high':
        return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: '🟠', label: 'Important' };
      case 'normal':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🔵', label: 'Normal' };
      default:
        return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20', icon: '⚪', label: 'Faible' };
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

  const priority = getPriorityInfo(task.priority);

  return (
    <div className={`card group p-0 overflow-hidden relative ${task.completed ? 'opacity-70 grayscale-[0.3]' : ''} ${isOverdue ? 'ring-2 ring-red-500/50' : ''}`}>
      {/* Top indicator bar based on priority */}
      <div className={`h-1.5 w-full ${priority.bg.replace('/20', '')}`}></div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={task.completed || false}
              onChange={() => onToggle(task.id)}
              className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/50 cursor-pointer transition-all active:scale-90"
            />
            {task.completed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-lg font-bold truncate transition-all ${task.completed ? 'line-through text-slate-500 italic' : 'text-slate-800 dark:text-slate-100'}`}>
                {task.title}
              </h3>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onAddSubtask && (
                  <button onClick={() => onAddSubtask(task.id)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Sous-tâche">
                    <PlusSquare size={18} />
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="Modifier">
                    <Edit3 size={18} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {task.description && (
              <p className={`mt-1 text-sm line-clamp-2 ${task.completed ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${priority.bg} ${priority.color}`}>
                <Flag size={12} />
                {priority.label}
              </span>

              {task.dueDate && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                  <Calendar size={14} />
                  {formatDate(task.dueDate)}
                  {isOverdue && <AlertCircle size={14} className="animate-pulse" />}
                </span>
              )}

              {task.recurrence && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock size={14} />
                  {task.recurrence === 'daily' ? 'Chaque jour' :
                    task.recurrence === 'weekly' ? 'Semaine' :
                      task.recurrence === 'monthly' ? 'Mois' : task.recurrence}
                </span>
              )}

              {task.subtasks && task.subtasks.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📋 {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content - Subtasks */}
        {isExpanded && task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-300">
            {task.subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
                <div className={`w-1.5 h-1.5 rounded-full ${subtask.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {subtask.title}
                </span>
                {subtask.completed && <div className="text-emerald-500">✅</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;


