import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import { showToast } from '../components/ToastContainer';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Tag,
  PlusCircle
} from 'lucide-react';

/**
 * Composant de gestion des tâches (Tasks)
 * Permet de visualiser, créer, modifier et supprimer des tâches.
 * Intègre des fonctionnalités de recherche, filtrage et sous-tâches.
 */
const Tasks = () => {
  // États pour les données et filtres
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // Filtre statut: all, active, completed
  const [priorityFilter, setPriorityFilter] = useState('all'); // Filtre par priorité
  const [searchQuery, setSearchQuery] = useState(''); // Recherche textuelle

  // États pour le formulaire et le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Tâche en cours d'édition
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    dueDate: '',
    startTime: '',
    endTime: '',
    recurrence: '',
    subtasks: []
  });
  const [newSubtask, setNewSubtask] = useState('');

  // Récupération des données en temps réel depuis Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    // Requête pour les tâches de l'utilisateur connecté
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', auth.currentUser.uid)
    );

    // Écouteur en temps réel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Tri par statut (non complété en premier)
      setTasks(tasksData.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      }));
    });

    return () => unsubscribe();
  }, []);

  // Soumission du formulaire (Création ou Mise à jour)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Le titre est requis', 'error');
      return;
    }

    try {
      const taskData = {
        ...formData,
        userId: auth.currentUser.uid,
        completed: false,
        createdAt: editingTask ? editingTask.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Conversion de la date string vers Firebase Timestamp
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null
      };

      if (editingTask) {
        // Mise à jour existante
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
        showToast('Les modifications ont été enregistrées avec succès.', 'success');
      } else {
        // Création nouvelle tâche
        await addDoc(collection(db, 'tasks'), taskData);
        showToast('Nouvel objectif créé avec succès.', 'success');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Une erreur est survenue lors de l\'enregistrement des données.', 'error');
    }
  };

  // Basculer le statut complété d'une tâche
  const handleToggle = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: !task.completed,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // Suppression d'une tâche
  const handleDelete = async (taskId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      showToast('Tâche supprimée', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Préparation de l'édition (remplit le formulaire avec les données de la tâche)
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'normal',
      // Formatage de la date pour l'input HTML type="date"
      dueDate: task.dueDate ? (task.dueDate.toDate ? task.dueDate.toDate().toISOString().split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0]) : '',
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      recurrence: task.recurrence || '',
      subtasks: task.subtasks || []
    });
    setIsModalOpen(true);
  };

  // Ajouter une sous-tâche au formulaire local
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { title: newSubtask, completed: false }]
    });
    setNewSubtask('');
  };

  // Supprimer une sous-tâche du formulaire local
  const handleRemoveSubtask = (index) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((_, i) => i !== index)
    });
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'normal',
      dueDate: '',
      startTime: '',
      endTime: '',
      recurrence: '',
      subtasks: []
    });
    setEditingTask(null);
    setNewSubtask('');
  };

  // Filtrage des tâches selon la recherche et les filtres actifs
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="page-transition min-h-screen pb-20">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
            Mes <span className="text-blue-600">Tâches</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Vous avez <span className="text-blue-600 dark:text-blue-400 font-bold">{activeCount}</span> tâches en cours aujourd'hui.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn btn-primary h-12 px-6 rounded-2xl group shadow-blue-500/20"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
            <Plus size={20} />
          </div>
          Nouvelle tâche
        </button>
      </div>

      {/* Barre de contrôle (Recherche et Filtres) */}
      <div className="card mb-8 p-2 md:p-3 flex flex-col md:flex-row gap-3 md:gap-4 items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Recherche */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 rounded-xl"
          />
        </div>

        {/* Sélecteurs de filtres */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex overflow-x-auto no-scrollbar bg-slate-100/50 dark:bg-slate-900/40 p-1 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-800/50">
            {[
              { id: 'all', label: 'Toutes', icon: LayoutGrid },
              { id: 'active', label: 'En cours', icon: Circle },
              { id: 'completed', label: 'Terminées', icon: CheckCircle2 }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex-1 sm:flex-none whitespace-nowrap ${filter === item.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl py-2 px-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
          >
            <option value="all">Priorité (Toutes)</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">Important</option>
            <option value="normal">Normal</option>
            <option value="low">Faible</option>
          </select>
        </div>
      </div>

      {/* Grille des tâches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          // État vide
          <div className="col-span-full card py-20 bg-slate-50 dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Search size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Aucune tâche ne correspond à vos critères</p>
            <p className="text-slate-400 text-sm mt-1">Essayez de modifier vos filtres ou lancez une nouvelle recherche</p>
          </div>
        ) : (
          // Liste des tâches (TaskCard)
          filteredTasks.map((task, index) => (
            <div key={task.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
              <TaskCard
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTask ? 'Modifier l\'objectif' : 'Nouvel objectif'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Titre */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Tag size={16} className="text-blue-500" />
                Désignation de la tâche
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-lg font-medium"
                placeholder="Faire les courses, Préparer la réunion..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Détails supplémentaires
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="Notes, instructions, liens..."
              />
            </div>

            {/* Priorité et Échéance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input font-bold"
                >
                  <option value="low">⚪ Faible</option>
                  <option value="normal">🔵 Normal</option>
                  <option value="high">🟠 Important</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <CalendarIcon size={16} className="text-indigo-500" />
                  Échéance
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input font-medium"
                />
              </div>
            </div>

            {/* Plage horaire */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input font-medium"
                />
              </div>
            </div>

            {/* Récurrence */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <LayoutGrid size={16} className="text-violet-500" />
                Récurrence
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="input font-medium"
              >
                <option value="">Une seule fois</option>
                <option value="daily">Chaque jour</option>
                <option value="weekly">Chaque semaine</option>
                <option value="monthly">Chaque mois</option>
              </select>
            </div>

            {/* Section Sous-tâches */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <List size={16} className="text-emerald-500" />
                Sous-tâches secondaires
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="input py-2 flex-1"
                  placeholder="Élément de liste..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="btn btn-secondary h-full px-4 rounded-xl border-none bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <PlusCircle size={20} />
                </button>
              </div>

              {/* Liste des sous-tâches ajoutées */}
              {formData.subtasks.length > 0 && (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{subtask.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="p-1 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions du formulaire */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="btn btn-secondary flex-1 py-3 rounded-xl border-none hover:bg-slate-100"
            >
              Ignorer
            </button>
            <button type="submit" className="btn btn-primary flex-[2] py-3 rounded-xl shadow-blue-500/25">
              {editingTask ? 'Confirmer les modifications' : 'Créer l\'objectif'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;


