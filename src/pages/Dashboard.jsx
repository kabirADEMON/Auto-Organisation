import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Target,
  Trophy,
  TrendingUp,
  Plus,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [period, setPeriod] = useState('week'); // week, month
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    setUserName(auth.currentUser.displayName || 'Utilisateur');

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

  const getPeriodRange = () => {
    const now = new Date();
    if (period === 'week') {
      return { start: startOfWeek(now, { locale: fr }), end: endOfWeek(now, { locale: fr }) };
    } else {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getTodayTasks = () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return isWithinInterval(taskDate, { start: todayStart, end: todayEnd });
    });
  };

  const getPeriodTasks = () => {
    const { start, end } = getPeriodRange();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return isWithinInterval(taskDate, { start, end });
    });
  };

  const todayTasks = getTodayTasks();
  const periodTasks = getPeriodTasks();
  const completedToday = todayTasks.filter(t => t.completed).length;
  const completedPeriod = periodTasks.filter(t => t.completed).length;
  const totalPeriod = periodTasks.length;
  const productivityRate = totalPeriod > 0 ? Math.round((completedPeriod / totalPeriod) * 100) : 0;

  // Statistiques habitudes
  const calculateHabitStats = () => {
    return habits.map(habit => {
      const completions = habit.completions || {};
      const completed = Object.values(completions).filter(c => c === true).length;
      const total = Object.keys(completions).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calcul du streak
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);

      while (true) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        // Check current date or previous dates
        if (completions[dateStr] === true) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && !completions[dateStr]) {
          // If today is not checked yet, don't break, check yesterday
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        name: habit.name,
        completionRate: rate,
        streak: streak
      };
    });
  };

  const habitStats = calculateHabitStats();
  const avgHabitCompletion = habitStats.length > 0
    ? Math.round(habitStats.reduce((acc, h) => acc + h.completionRate, 0) / habitStats.length)
    : 0;
  const maxStreak = habitStats.length > 0 ? Math.max(...habitStats.map(h => h.streak)) : 0;

  // Données pour graphiques
  const priorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent' && !t.completed).length },
    { name: 'Important', value: tasks.filter(t => t.priority === 'high' && !t.completed).length },
    { name: 'Normal', value: tasks.filter(t => t.priority === 'normal' && !t.completed).length },
    { name: 'Faible', value: tasks.filter(t => t.priority === 'low' && !t.completed).length }
  ];

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#94a3b8'];

  const weeklyData = (() => {
    const { start } = getPeriodRange();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      days.push({
        day: format(date, 'EEE', { locale: fr }).slice(0, 3),
        complétées: dateTasks.filter(t => t.completed).length,
        totales: dateTasks.length
      });
    }
    return days;
  })();

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="card hover:scale-105 transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {subtitle}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{userName}</span> 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Voici un aperçu de vos progrès aujourd'hui.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-auto min-w-[150px]"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tâches du jour"
          value={`${completedToday}/${todayTasks.length}`}
          subtitle={`${todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0}% complété`}
          icon={CheckCircle2}
          colorClass="bg-emerald-500 text-emerald-600"
        />
        <StatCard
          title="Productivité"
          value={`${productivityRate}%`}
          subtitle={`Sur ${totalPeriod} tâches (${period === 'week' ? 'semaine' : 'mois'})`}
          icon={Activity}
          colorClass="bg-blue-500 text-blue-600"
        />
        <StatCard
          title="Habitudes"
          value={`${avgHabitCompletion}%`}
          subtitle="Taux moyen de réussite"
          icon={Target}
          colorClass="bg-violet-500 text-violet-600"
        />
        <StatCard
          title="Meilleur Streak"
          value={`${maxStreak}jrs`}
          subtitle="Continuez sans lâcher !"
          icon={Trophy}
          colorClass="bg-amber-500 text-amber-600"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique barres - Tâches par jour */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Activité
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="complétées" fill="#10b981" radius={[4, 4, 0, 0]} name="Complétées" />
                <Bar dataKey="totales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Totales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique camembert - Tâches par priorité */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-violet-500" />
            Priorités en cours
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {priorityData.every(d => d.value === 0) ? (
              <div className="text-center text-slate-400">
                <p>Aucune tâche en cours</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {priorityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card bg-gradient-to-r from-slate-800 to-slate-900 text-white border-none">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <ArrowRight size={20} className="text-blue-400" />
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/tasks" className="btn bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
            <Plus size={18} /> Nouvelle tâche
          </Link>
          <Link to="/habits" className="btn bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
            <Target size={18} /> Nouvelle habitude
          </Link>
          <Link to="/calendar" className="btn bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
            <Calendar size={18} /> Voir le calendrier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

