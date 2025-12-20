import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToHabits, toggleHabitCompletion, incrementHabitProgress } from '../services/habitService';
import type { Habit } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Ban, PenTool } from 'lucide-react';
import { cn } from '../lib/utils';

type ViewMode = 'overview' | 'detailed';

export default function Calendar() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('detailed'); // Default to detailed
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToHabits(user.uid, (data) => {
            setHabits(data);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const handleDayClick = async (habit: Habit, dateStr: string) => {
        if (!user || !isEditMode) return;

        try {
            if (habit.habitType === 'simple') {
                await toggleHabitCompletion(user.uid, habit, dateStr);
            } else {
                await incrementHabitProgress(user.uid, habit, dateStr);
            }
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const firstDay = startOfWeek(startOfMonth(currentMonth));
    const lastDay = endOfWeek(endOfMonth(currentMonth));
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Calendar
                    </h1>

                    {/* Edit Mode Toggle */}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                            isEditMode
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        title={isEditMode ? "Clicking days will edit data" : "Enable Edit Mode"}
                    >
                        <PenTool className="w-4 h-4" />
                        {isEditMode ? 'Edit Mode ON' : 'Edit Mode'}
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 self-start xl:self-auto">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            viewMode === 'overview'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setViewMode('detailed')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            viewMode === 'detailed'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <LayoutList className="w-4 h-4" />
                        Detailed
                    </button>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Calendar Views */}
            {viewMode === 'overview' ? (
                // VIEW MODE: OVERVIEW - Compact dots only, no dates visible
                <>
                    {/* Habit Legend */}
                    {habits.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            {habits.map(habit => (
                                <div key={habit.id} className="flex items-center gap-2">
                                    {habit.isQuitting ? (
                                        <Ban className="w-3.5 h-3.5 text-red-500" />
                                    ) : (
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: habit.color || '#3B82F6' }}
                                        />
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{habit.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-4">
                        {/* Compact grid - no day headers, just dots */}
                        <div className="grid grid-cols-7 gap-0.5">
                            {days.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isDayToday = isToday(day);

                                if (!isCurrentMonth) {
                                    return <div key={dateStr} className="aspect-square" />;
                                }

                                return (
                                    <div
                                        key={dateStr}
                                        className={cn(
                                            "aspect-square flex items-center justify-center p-0.5",
                                            isDayToday && "bg-blue-50 dark:bg-blue-900/20 rounded"
                                        )}
                                    >
                                        <div className="flex flex-wrap gap-0.5 justify-center">
                                            {habits.map(habit => {
                                                const isCompleted = habit.completedDates?.includes(dateStr);
                                                const countProgress = habit.dailyProgress?.[dateStr] || 0;
                                                const dailyGoal = habit.dailyGoal || 1;

                                                let showAsComplete = false;
                                                if (habit.habitType === 'simple') {
                                                    showAsComplete = isCompleted || false;
                                                } else {
                                                    if (habit.isQuitting) {
                                                        showAsComplete = countProgress <= dailyGoal;
                                                    } else {
                                                        showAsComplete = countProgress >= dailyGoal;
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={habit.id}
                                                        disabled={!isEditMode}
                                                        onClick={() => handleDayClick(habit, dateStr)}
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full transition-all",
                                                            showAsComplete ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
                                                            isEditMode && "hover:scale-150 cursor-pointer"
                                                        )}
                                                        title={`${habit.name}: ${showAsComplete ? 'Done' : 'Not done'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                // VIEW MODE: DETAILED (Mini Calendars Grid)
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {habits.map(habit => (
                        <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between ${habit.isQuitting ? 'bg-red-50 dark:bg-red-900/10' : ''
                                }`}>
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {habit.isQuitting && <Ban className="w-4 h-4 text-red-500" />}
                                    {habit.name}
                                </h3>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    {habit.habitType === 'count' && (
                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                            {habit.isQuitting ? 'Limit' : 'Goal'}: {habit.dailyGoal}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Mini Calendar Grid - compact dots only */}
                            <div className="p-4">
                                <div className="grid grid-cols-7 gap-0.5">
                                    {days.map((day) => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const isCurrentMonth = isSameMonth(day, currentMonth);
                                        const isDayToday = isToday(day);

                                        if (!isCurrentMonth) {
                                            return <div key={dateStr} className="aspect-square" />;
                                        }

                                        const isCompleted = habit.completedDates?.includes(dateStr);
                                        const countProgress = habit.dailyProgress?.[dateStr] || 0;
                                        const dailyGoal = habit.dailyGoal || 1;

                                        let showAsComplete = false;
                                        if (habit.habitType === 'simple') {
                                            showAsComplete = isCompleted || false;
                                        } else {
                                            if (habit.isQuitting) {
                                                showAsComplete = countProgress <= dailyGoal;
                                            } else {
                                                showAsComplete = countProgress >= dailyGoal;
                                            }
                                        }

                                        return (
                                            <button
                                                key={dateStr}
                                                disabled={!isEditMode}
                                                onClick={() => handleDayClick(habit, dateStr)}
                                                className={cn(
                                                    "aspect-square rounded flex items-center justify-center transition-all",
                                                    showAsComplete
                                                        ? "bg-green-500"
                                                        : "bg-gray-200 dark:bg-gray-700",
                                                    isDayToday && "ring-2 ring-blue-500 ring-offset-1",
                                                    isEditMode && "hover:scale-110 cursor-pointer"
                                                )}
                                                title={`${format(day, 'MMM d')}: ${showAsComplete ? 'Done' : 'Not done'}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
