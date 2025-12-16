import { useState, useEffect } from 'react';
import { Plus, Flame, CheckCircle, Calendar, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToHabits, addHabit, toggleHabitCompletion, deleteHabit, incrementHabitProgress, decrementHabitProgress } from '../services/habitService';
import { subscribeToTasks, toggleTaskCompletion } from '../services/taskService';
import type { Habit, Task } from '../types';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

export default function Dashboard() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubHabits = subscribeToHabits(user.uid, (data) => {
            setHabits(data);
            setLoading(false);
        });

        const unsubTasks = subscribeToTasks(user.uid, (data) => {
            setTasks(data);
        });

        return () => {
            unsubHabits();
            unsubTasks();
        };
    }, [user]);

    const handleAddHabit = async (name: string, habitType: 'simple' | 'count', dailyGoal?: number, isQuitting?: boolean) => {
        if (!user) return;
        await addHabit(user.uid, name, habitType, dailyGoal, isQuitting);
    };

    const handleToggleHabit = async (habit: Habit, date: string) => {
        if (!user) return;
        await toggleHabitCompletion(user.uid, habit, date);
    };

    const handleIncrementHabit = async (habit: Habit, date: string) => {
        if (!user) return;
        await incrementHabitProgress(user.uid, habit, date);
    };

    const handleDecrementHabit = async (habit: Habit, date: string) => {
        if (!user) return;
        await decrementHabitProgress(user.uid, habit, date);
    };

    const handleDeleteHabit = async (habitId: string) => {
        if (!user || !window.confirm('Are you sure you want to delete this habit?')) return;
        await deleteHabit(user.uid, habitId);
    };

    const handleToggleTask = async (taskId: string, completed: boolean) => {
        if (!user) return;
        await toggleTaskCompletion(user.uid, taskId, completed);
    };

    // Today's data
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysTasks = tasks.filter(t =>
        !t.completed && (
            !t.dueDate ||
            t.dueDate === todayStr ||
            (t.dueDate && parseISO(t.dueDate) <= new Date())
        )
    ).slice(0, 5);

    // Stats
    const completedToday = habits.filter(h => h.completedDates?.includes(todayStr)).length;
    const totalHabits = habits.length;
    const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {greeting()}, {user?.displayName?.split(' ')[0] || 'there'}! 👋
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            {format(new Date(), 'EEEE, MMMM d, yyyy')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Habit</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Today's Progress</p>
                            <p className="text-2xl font-bold">{progressPercent}%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Completed</p>
                            <p className="text-2xl font-bold">{completedToday}/{totalHabits}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Flame className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-orange-100 text-sm">Total Streaks</p>
                            <p className="text-2xl font-bold">{totalStreak}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-purple-100 text-sm">Tasks Due</p>
                            <p className="text-2xl font-bold">{todaysTasks.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Habits Section - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Habits</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{habits.length} habits</span>
                    </div>

                    {habits.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="max-w-xs mx-auto">
                                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No habits yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">Start building better habits today!</p>
                                <button
                                    onClick={() => setIsFormOpen(true)}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create First Habit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {habits.map((habit) => (
                                <HabitCard
                                    key={habit.id}
                                    habit={habit}
                                    onToggle={handleToggleHabit}
                                    onDelete={handleDeleteHabit}
                                    onIncrement={handleIncrementHabit}
                                    onDecrement={handleDecrementHabit}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Tasks Section - Takes 1 column */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Tasks</h2>
                        <a href="/tasks" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</a>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {todaysTasks.length === 0 ? (
                            <div className="p-6 text-center">
                                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                                <p className="text-gray-600 dark:text-gray-400">All caught up! 🎉</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {todaysTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <button
                                            onClick={() => handleToggleTask(task.id, task.completed)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all",
                                                task.completed
                                                    ? "bg-green-500 border-green-500"
                                                    : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                task.completed ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"
                                            )}>
                                                {task.title}
                                            </p>
                                            {task.dueDate && (
                                                <p className="text-xs text-gray-500">{format(parseISO(task.dueDate), 'MMM d')}</p>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            task.priority === 'high' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                            task.priority === 'medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                            task.priority === 'low' && "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                        )}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <HabitForm
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleAddHabit}
                />
            )}
        </div>
    );
}
