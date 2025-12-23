// ... imports
import { Check, Flame, Plus, Minus, Ban, Shield, MoreVertical } from 'lucide-react';
import type { Habit } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface HabitCardProps {
    habit: Habit;
    onToggle: (habit: Habit, date: string) => void;
    onIncrement?: (habit: Habit, date: string) => void;
    onDecrement?: (habit: Habit, date: string) => void;
    onContextMenu?: (e: React.MouseEvent, habit: Habit) => void;
    dragHandleProps?: any;
}

export default function HabitCard({ habit, onToggle, onIncrement, onDecrement, onContextMenu, dragHandleProps }: HabitCardProps) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isCompletedToday = habit.completedDates?.includes(todayStr);

    // For count habits
    const currentProgress = habit.dailyProgress?.[todayStr] || 0;
    const dailyGoal = habit.dailyGoal || 1;
    const progressPercent = habit.habitType === 'count'
        ? Math.min((currentProgress / dailyGoal) * 100, 100)
        : 0;

    // For quitting habits
    const isQuitting = habit.isQuitting;
    const isCountQuitting = isQuitting && habit.habitType === 'count';
    const isUnderLimit = isCountQuitting ? currentProgress <= dailyGoal : false;

    // Effective completion for UI
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

    const habitColor = habit.color || '#3B82F6';

    return (
        <div
            onContextMenu={(e) => onContextMenu?.(e, habit)}
            className={cn(
                "rounded-xl p-4 shadow-sm border transition-all hover:shadow-md group relative bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            )}
            style={{
                borderLeftWidth: '4px',
                borderLeftColor: habitColor,
                touchAction: 'manipulation' // Allow scrolling, but likely handled by parent style too
            }}
            {...dragHandleProps} // Spread props to make whole card draggable
        >
            <div className="flex items-center justify-between">
                {/* Context Menu Trigger */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag/click on parent
                        onContextMenu?.(e, habit);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                    className="mr-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {isQuitting && <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {habit.name}
                        </h3>
                        {habit.habitType === 'count' && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {currentProgress}/{dailyGoal}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-3 mt-1">
                        <div className={cn("flex items-center gap-1", habit.streak > 0 && "text-orange-500 font-medium")}>
                            <Flame className="w-4 h-4" />
                            <span>{habit.streak} day{habit.streak !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Progress bar for count habits */}
                    {habit.habitType === 'count' && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor: habitColor
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 ml-3">
                    {habit.habitType === 'count' ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDecrement?.(habit, todayStr); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                disabled={currentProgress <= 0}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onIncrement?.(habit, todayStr); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-white shadow-lg"
                                style={{
                                    backgroundColor: habitColor,
                                    boxShadow: `0 4px 6px -1px ${habitColor}40` // semi-transparent shadow
                                }}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(habit, todayStr); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                !showAsCompleted && "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                            style={showAsCompleted ? {
                                backgroundColor: habitColor,
                                color: 'white',
                                boxShadow: `0 4px 6px -1px ${habitColor}40`
                            } : {}}
                        >
                            {isQuitting ? (
                                showAsCompleted ? <Shield className="w-5 h-5" /> : <Ban className="w-5 h-5" />
                            ) : (
                                <Check className="w-6 h-6" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
