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
  ArrowRight,
  Zap,
  Sparkles,
  Flame,
  LayoutDashboard
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
      return { start: startOfWeek(now, { locale: fr, weekStartsOn: 1 }), end: endOfWeek(now, { locale: fr, weekStartsOn: 1 }) };
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

      const todayStr = format(today, 'yyyy-MM-dd');
      if (completions[todayStr] !== true) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      while (true) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (completions[dateStr] === true) {
          streak++;
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
        day: format(date, 'EEE', { locale: fr }).replace('.', ''),
        complétées: dateTasks.filter(t => t.completed).length,
        totales: dateTasks.length
      });
    }
    return days;
  })();

  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, textColor }) => (
    <div className={`card overflow-hidden relative group p-6 shadow-xl border-none ${gradient}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all">
        <Icon size={80} strokeWidth={2.5} />
      </div>
      <div className="relative">
        <p className={`text-xs font-black uppercase tracking-widest ${textColor} opacity-70`}>{title}</p>
        <h3 className={`text-4xl font-black mt-2 ${textColor}`}>{value}</h3>
        <p className={`text-sm font-bold mt-2 ${textColor} opacity-80 flex items-center gap-1`}>
          <TrendingUp size={14} />
          {subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 page-transition pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Aperçu Quotidien</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight italic">
            Salut, <span className="text-blue-600">{userName.split(' ')[0]}</span> !
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
            Prêt pour une journée <span className="text-blue-600 font-bold italic">incroyable</span> ? Voici où vous en êtes dans vos objectifs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mois
            </button>
          </div>
          <Link to="/tasks" className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all">
            <Plus size={24} />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tâches du jour"
          value={`${completedToday}/${todayTasks.length}`}
          subtitle={`${todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0}% de succès`}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          textColor="text-white"
        />
        <StatCard
          title="Productivité"
          value={`${productivityRate}%`}
          subtitle={`${completedPeriod} validés ce ${period === 'week' ? 'sem' : 'mois'}`}
          icon={Zap}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          textColor="text-white"
        />
        <StatCard
          title="Routines"
          value={`${avgHabitCompletion}%`}
          subtitle="Taux moyen"
          icon={Target}
          gradient="bg-gradient-to-br from-indigo-600 to-violet-700"
          textColor="text-white"
        />
        <StatCard
          title="Point de Série"
          value={`${maxStreak}j`}
          subtitle="Meilleur streak"
          icon={Flame}
          gradient="bg-gradient-to-br from-orange-500 to-rose-600"
          textColor="text-white"
        />
      </div>

      {/* Graphiques Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique barres - Main Chart */}
        <div className="lg:col-span-2 card p-8 border-slate-100 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 italic">
                <Activity size={20} className="text-blue-500" />
                Flux d'Activité
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Objectifs par jour</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={8}>
                <CartesianGrid strokeDasharray="8 8" vertical={false} strokeOpacity={0.1} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontWeight: 'bold' }}
                />
                <Bar dataKey="complétées" fill="#10b981" radius={[10, 10, 10, 10]} name="Fait" barSize={12} />
                <Bar dataKey="totales" fill="#3b82f6" radius={[10, 10, 10, 10]} name="Total" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie */}
        <div className="card p-8 border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col items-center">
          <div className="w-full mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 italic">
              <Target size={20} className="text-rose-500" />
              Focus Actuel
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Répartition des priorités</p>
          </div>

          <div className="h-[280px] w-full relative flex items-center justify-center">
            {priorityData.every(d => d.value === 0) ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Sparkles size={32} />
                </div>
                <p className="text-slate-400 font-bold italic">Rien à afficher</p>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">{tasks.filter(t => !t.completed).length}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">À faire</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-6">
            {priorityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase truncate">{entry.name}</span>
                <span className="ml-auto text-xs font-black text-slate-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Card */}
      <div className="card bg-slate-900 border-none p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>

        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-1 flex items-center gap-3 italic">
            <ArrowRight size={24} className="text-blue-400" />
            Vitesse Maximale
          </h3>
          <p className="text-slate-400 font-bold mb-8">Accédez instantanément à vos modules préférés</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/tasks" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group/btn">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover/btn:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Tâches</p>
                <p className="text-xs text-slate-500">Ajouter/Gérer</p>
              </div>
            </Link>

            <Link to="/habits" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group/btn">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover/btn:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Habitudes</p>
                <p className="text-xs text-slate-500">Suivi quotidien</p>
              </div>
            </Link>

            <Link to="/calendar" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group/btn">
              <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl group-hover/btn:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Temps</p>
                <p className="text-xs text-slate-500">Vue d'ensemble</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

