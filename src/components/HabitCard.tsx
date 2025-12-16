import { Check, Flame, Trash2, Plus, Minus, Ban, Shield } from 'lucide-react';
import type { Habit } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface HabitCardProps {
    habit: Habit;
    onToggle: (habit: Habit, date: string) => void;
    onDelete: (habitId: string) => void;
    onIncrement?: (habit: Habit, date: string) => void;
    onDecrement?: (habit: Habit, date: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete, onIncrement, onDecrement }: HabitCardProps) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isCompletedToday = habit.completedDates?.includes(todayStr);

    // For count habits
    const currentProgress = habit.dailyProgress?.[todayStr] || 0;
    const dailyGoal = habit.dailyGoal || 1;
    const progressPercent = habit.habitType === 'count'
        ? Math.min((currentProgress / dailyGoal) * 100, 100)
        : 0;

    // For quitting habits: "completed" means they avoided it
    const isQuitting = habit.isQuitting;
    const isCountQuitting = isQuitting && habit.habitType === 'count';

    // Completion Logic
    // Simple habit: completedDates includes today
    // Count habit (Build): progress >= dailyGoal
    // Count habit (Quit): progress <= dailyGoal (dailyLimit)
    const isUnderLimit = isCountQuitting ? currentProgress <= dailyGoal : false;

    // Determine effective completion status for UI
    let showAsCompleted = false;
    if (habit.habitType === 'simple') {
        showAsCompleted = isCompletedToday || false;
    } else {
        if (isQuitting) {
            showAsCompleted = isUnderLimit;
        } else {
            showAsCompleted = currentProgress >= dailyGoal;
        }
    }

    // Determine card background style
    const cardStyle = isQuitting
        ? (isCountQuitting && !isUnderLimit) // Failed count quitting
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800/50"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

    return (
        <div className={cn(
            "rounded-xl p-4 shadow-sm border transition-all hover:shadow-md group",
            cardStyle
        )}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {isQuitting && <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {habit.name}
                        </h3>
                        {habit.habitType === 'count' && (
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                                isQuitting
                                    ? isUnderLimit
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            )}>
                                {currentProgress}/{dailyGoal}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-3 mt-1">
                        <div className={cn("flex items-center gap-1", habit.streak > 0 && "text-orange-500 font-medium")}>
                            <Flame className="w-4 h-4" />
                            <span>{habit.streak} day{habit.streak !== 1 ? 's' : ''}</span>
                        </div>
                        {isQuitting && showAsCompleted && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Shield className="w-3.5 h-3.5" />
                                <span className="text-xs">
                                    {isCountQuitting ? "Under limit" : "Avoided today"}
                                </span>
                            </span>
                        )}
                    </div>

                    {/* Progress bar for count habits */}
                    {habit.habitType === 'count' && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    isQuitting
                                        ? isUnderLimit ? "bg-green-500" : "bg-red-500"
                                        : showAsCompleted ? "bg-green-500" : "bg-blue-500"
                                )}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 ml-3">
                    {habit.habitType === 'count' ? (
                        // Count habit: +/- buttons (for both Building and Quitting)
                        <>
                            <button
                                onClick={() => onDecrement?.(habit, todayStr)}
                                disabled={currentProgress <= 0}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onIncrement?.(habit, todayStr)}
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                                    isQuitting
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                                        : showAsCompleted
                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                            : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                                )}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        // Simple habit: checkmark/shield button
                        <button
                            onClick={() => onToggle(habit, todayStr)}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                showAsCompleted
                                    ? isQuitting
                                        ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                        : "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                    : isQuitting
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-800/40"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                            title={isQuitting
                                ? (showAsCompleted ? "Marked as avoided" : "Mark as avoided today")
                                : (showAsCompleted ? "Completed today" : "Check in for today")
                            }
                        >
                            {isQuitting ? (
                                showAsCompleted ? <Shield className="w-5 h-5" /> : <Ban className="w-5 h-5" />
                            ) : (
                                <Check className="w-6 h-6" />
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(habit.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
