import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToHabits, toggleHabitCompletion, incrementHabitProgress } from '../services/habitService';
import type { Habit } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Ban, Shield, PenTool } from 'lucide-react';
import { cn } from '../lib/utils';

type ViewMode = 'all' | 'individual';

export default function Calendar() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('all');
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
                // For count habits, increment on click
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
                    {isEditMode && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                            Click dates to edit
                        </span>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 self-start xl:self-auto">
                    <button
                        onClick={() => setViewMode('all')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            viewMode === 'all'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setViewMode('individual')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            viewMode === 'individual'
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
            {viewMode === 'all' ? (
                // VIEW MODE: ALL (Overview)
                <>
                    {/* Habit Coloring Legend */}
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

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="py-3 text-center text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                    <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                                    <span className="sm:hidden">{day}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isDayToday = isToday(day);

                                return (
                                    <div
                                        key={dateStr}
                                        className={cn(
                                            "min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-gray-100 dark:border-gray-700/50 transition-colors",
                                            !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/30",
                                            isDayToday && "bg-blue-50 dark:bg-blue-900/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "text-xs sm:text-sm font-medium mb-1",
                                            !isCurrentMonth && "text-gray-400 dark:text-gray-600",
                                            isCurrentMonth && "text-gray-700 dark:text-gray-300",
                                            isDayToday && "text-blue-600 dark:text-blue-400"
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="flex flex-wrap gap-0.5">
                                            {habits.map(habit => {
                                                const isCompleted = habit.completedDates?.includes(dateStr);
                                                const countProgress = habit.dailyProgress?.[dateStr] || 0;
                                                const dailyGoal = habit.dailyGoal || 1;

                                                // Calculate completion based on type
                                                let showAsComplete = false;
                                                if (habit.habitType === 'simple') {
                                                    showAsComplete = isCompleted || false;
                                                } else {
                                                    // Count Logic
                                                    if (habit.isQuitting) {
                                                        showAsComplete = countProgress <= dailyGoal; // Under limit = Good
                                                    } else {
                                                        showAsComplete = countProgress >= dailyGoal; // Met goal = Good
                                                    }
                                                }

                                                // Determine color
                                                let bgColor = "bg-gray-300 dark:bg-gray-600";
                                                if (habit.isQuitting) {
                                                    // Quitting Habit
                                                    // Good (Under limit): Green
                                                    // Bad (Over limit): Red
                                                    if (habit.habitType === 'count') {
                                                        bgColor = showAsComplete ? "bg-green-500" : "bg-red-500";
                                                    } else {
                                                        // Simple Quitting
                                                        // Completed (Avoided): Green
                                                        // Not Completed (Did it): Red (but usually unchecked is default state for simple)
                                                        // Wait, for simple quitting: checked means "Avoided" (Good -> Green). Unchecked means nothing/neutral?
                                                        // Or does unchecked mean "Failed"? Usually unchecked means "didn't track" or "failed".
                                                        // Let's stick to standard: Checked = Good (Green).
                                                        bgColor = showAsComplete ? "bg-green-500" : "bg-red-400 opacity-60";
                                                    }
                                                } else {
                                                    // Building Habit
                                                    // Good (Met goal): Green
                                                    // Bad (Not met): Gray/Red
                                                    bgColor = showAsComplete ? "bg-green-500" : "bg-red-400 opacity-60";
                                                }

                                                return (
                                                    <button
                                                        key={habit.id}
                                                        disabled={!isEditMode}
                                                        onClick={() => handleDayClick(habit, dateStr)}
                                                        className={cn(
                                                            "w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center text-[6px] sm:text-[8px] font-bold transition-all",
                                                            bgColor,
                                                            isEditMode && "hover:ring-2 hover:ring-offset-1 ring-blue-500 cursor-pointer hover:scale-110"
                                                        )}
                                                        title={`${habit.name}: ${showAsComplete ? (habit.isQuitting ? 'Good' : 'Completed') : 'Not completed'}`}
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

                            {/* Mini Calendar Grid for this Habit */}
                            <div className="p-4">
                                <div className="grid grid-cols-7 mb-2">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                        <div key={d} className="text-center text-xs text-gray-400 font-medium">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day) => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const isCurrentMonth = isSameMonth(day, currentMonth);
                                        const isDayToday = isToday(day);

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
                                                disabled={!isEditMode && !isCurrentMonth}
                                                onClick={() => isCurrentMonth && handleDayClick(habit, dateStr)}
                                                className={cn(
                                                    "aspect-square rounded-md flex items-center justify-center text-xs transition-all relative group",
                                                    !isCurrentMonth && "opacity-0 pointer-events-none",
                                                    isCurrentMonth && (
                                                        showAsComplete
                                                            ? habit.isQuitting
                                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800"
                                                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800"
                                                            : isDayToday
                                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-semibold border border-blue-200 dark:border-blue-800"
                                                                : "bg-gray-50 dark:bg-gray-800/50 text-gray-400"
                                                    ),
                                                    isEditMode && isCurrentMonth && "hover:ring-2 hover:ring-offset-1 ring-blue-500 cursor-pointer hover:scale-110"
                                                )}
                                                title={isCurrentMonth ? `${format(day, 'MMM d')}: ${habit.habitType === 'count' ? countProgress : (showAsComplete ? 'Done' : 'Not done')}` : ''}
                                            >
                                                {isCurrentMonth && (
                                                    <>
                                                        <span>{format(day, 'd')}</span>
                                                        {habit.isQuitting && showAsComplete && (
                                                            <Shield className="w-3 h-3 absolute -top-1 -right-1 text-green-500 fill-green-100" />
                                                        )}
                                                        {habit.habitType === 'count' && countProgress > 0 && (
                                                            <div className="absolute bottom-0.5 right-0.5 text-[0.6rem] leading-none text-gray-500 font-normal">
                                                                {countProgress}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </button>
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
