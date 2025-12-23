import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToHabits, toggleHabitCompletion, incrementHabitProgress, reorderHabits, deleteHabit, updateHabit } from '../../services/habitService';
import type { Habit } from '../../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Ban, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ViewMode = 'overview' | 'detailed';

// Sortable Calendar Card
function SortableCalendarCard({ habit, currentMonth, days, handleDayClick, onContextMenu }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: habit.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm relative group",
                isDragging && "ring-2 ring-blue-500 shadow-xl"
            )}
            onContextMenu={(e) => onContextMenu(e, habit)}
            {...attributes}
            {...listeners} // Whole card draggable
            style={{ ...style, touchAction: 'manipulation' }}
        >
            {/* More Button */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, habit);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 transition-all text-gray-400 dark:text-gray-500"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

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
                    {days.map((day: Date) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        if (!isCurrentMonth) {
                            return <div key={dateStr} className="aspect-square" />;
                        }

                        const isCompleted = habit.completedDates?.includes(dateStr);
                        const countProgress = habit.dailyProgress?.[dateStr] || 0;
                        const dailyGoal = habit.dailyGoal || 1;
                        const habitColor = habit.color || '#3B82F6';

                        let showAsComplete = false;
                        let style: React.CSSProperties = {};
                        let bgClass = "bg-gray-200 dark:bg-gray-700";

                        if (habit.habitType === 'simple') {
                            showAsComplete = isCompleted || false;
                            if (showAsComplete) {
                                style = { backgroundColor: habitColor };
                                bgClass = ""; // remove default class if setting style
                            }
                        } else {
                            if (habit.isQuitting) {
                                showAsComplete = countProgress <= dailyGoal;
                                if (showAsComplete) bgClass = "bg-green-500";
                                else bgClass = "bg-red-500"; // Over limit
                            } else {
                                // Progress bar logic
                                const percent = Math.min(100, Math.round((countProgress / dailyGoal) * 100));
                                if (percent >= 100) {
                                    style = { backgroundColor: habitColor };
                                    showAsComplete = true;
                                } else if (percent > 0) {
                                    // Partial fill
                                    style = {
                                        background: `linear-gradient(to top, ${habitColor} ${percent}%, transparent ${percent}%)`
                                    };
                                    bgClass = "bg-gray-200 dark:bg-gray-700";
                                }
                            }
                        }

                        return (
                            <button
                                key={dateStr}
                                onClick={() => handleDayClick(habit, dateStr)}
                                className={cn(
                                    "aspect-square rounded flex flex-col items-center justify-center relative transition-all hover:scale-110 cursor-pointer overflow-hidden p-0",
                                    !style.backgroundColor && !style.background ? bgClass : "",
                                    isDayToday && "ring-2 ring-blue-500 ring-offset-1",
                                )}
                                style={style}
                                title={`${format(day, 'MMM d')}: ${habit.habitType === 'count' ? `${countProgress}/${dailyGoal}` : (showAsComplete ? 'Done' : 'Not done')}`}
                            >
                                <span className={cn(
                                    "absolute top-0.5 left-0.5 text-[8px] font-medium z-10 leading-none",
                                    (style.backgroundColor || style.background || bgClass === "bg-green-500" || bgClass === "bg-red-500")
                                        ? "text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                                        : "text-gray-300 dark:text-gray-600"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function HabitCalendarView() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('detailed');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, habit: Habit } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToHabits(user.uid, (data) => {
            setHabits(data);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleDayClick = async (habit: Habit, dateStr: string) => {
        if (!user) return;

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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !user) return;

        const oldIndex = habits.findIndex((h) => h.id === active.id);
        const newIndex = habits.findIndex((h) => h.id === over.id);

        const newHabits = arrayMove(habits, oldIndex, newIndex);
        setHabits(newHabits);
        await reorderHabits(user.uid, newHabits);
    };

    const handleContextMenu = (e: React.MouseEvent, habit: Habit) => {
        e.preventDefault();
        e.stopPropagation();
        const menuWidth = 220;
        const menuHeight = 200;
        const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
        const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
        setContextMenu({ x: Math.max(10, x), y: Math.max(10, y), habit });
    };

    const handleColorChange = async (color: string) => {
        if (!user || !contextMenu) return;
        await updateHabit(user.uid, contextMenu.habit.id, { color });
        setContextMenu(null);
    };

    const handleDeleteHabit = async () => {
        if (!user || !contextMenu || !window.confirm('Are you sure you want to delete this habit?')) return;
        await deleteHabit(user.uid, contextMenu.habit.id);
        setContextMenu(null);
    };

    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
    ];


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
        <div className="space-y-6 relative pb-4">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex items-center gap-4">
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

                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('overview')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                viewMode === 'overview'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">Overview</span>
                        </button>
                        <button
                            onClick={() => setViewMode('detailed')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                viewMode === 'detailed'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <LayoutList className="w-4 h-4" />
                            <span className="hidden sm:inline">Detailed</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Views */}
            {viewMode === 'overview' ? (
                // VIEW MODE: OVERVIEW - Compact dots only, no dates visible
                <>
                    {/* Habit Legend */}
                    {habits.length > 0 && (
                        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
                                            "aspect-square flex flex-col items-center justify-start p-1 relative",
                                            isDayToday && "bg-blue-50 dark:bg-blue-900/20 rounded"
                                        )}
                                    >
                                        <span className="absolute top-0.5 left-1 text-[8px] text-gray-300 dark:text-gray-600 font-normal leading-none z-10">
                                            {format(day, 'd')}
                                        </span>
                                        <div className="flex flex-wrap gap-0.5 justify-center content-center w-full h-full pt-1">
                                            {habits.map(habit => {
                                                const isCompleted = habit.completedDates?.includes(dateStr);
                                                const countProgress = habit.dailyProgress?.[dateStr] || 0;
                                                const dailyGoal = habit.dailyGoal || 1;
                                                const habitColor = habit.color || '#3B82F6';

                                                let showAsComplete = false;
                                                let style: React.CSSProperties = {};

                                                if (habit.habitType === 'simple') {
                                                    showAsComplete = isCompleted || false;
                                                    if (showAsComplete) {
                                                        style = { backgroundColor: habitColor };
                                                    }
                                                } else {
                                                    // Count habit logic
                                                    if (habit.isQuitting) {
                                                        showAsComplete = countProgress <= dailyGoal;
                                                    } else {
                                                        // For non-quitting count habits, show progress bar
                                                        const percent = Math.min(100, Math.round((countProgress / dailyGoal) * 100));
                                                        if (percent >= 100) {
                                                            style = { backgroundColor: habitColor };
                                                            showAsComplete = true;
                                                        } else if (percent > 0) {
                                                            // Partial fill
                                                            style = {
                                                                background: `linear-gradient(to top, ${habitColor} ${percent}%, transparent ${percent}%)`
                                                            };
                                                        }
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={habit.id}
                                                        onClick={() => handleDayClick(habit, dateStr)}
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full transition-all border border-transparent hover:scale-150 cursor-pointer",
                                                            habit.habitType === 'simple' || habit.isQuitting || (!showAsComplete && Object.keys(style).length === 0)
                                                                ? (showAsComplete ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600")
                                                                : "",
                                                            Object.keys(style).length > 0 && "bg-gray-300 dark:bg-gray-600"
                                                        )}
                                                        style={style}
                                                        title={`${habit.name}: ${habit.habitType === 'count' ? `${countProgress}/${dailyGoal}` : (showAsComplete ? 'Done' : 'Not done')}`}
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={habits.map(h => h.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {habits.map(habit => (
                                <SortableCalendarCard
                                    key={habit.id}
                                    habit={habit}
                                    days={days}
                                    currentMonth={currentMonth}
                                    handleDayClick={handleDayClick}
                                    onContextMenu={handleContextMenu}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] py-1 animation-scale-in"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{contextMenu.habit.name}</span>
                    </div>

                    <div className="p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-2">Change Color</p>
                        <div className="grid grid-cols-4 gap-2 px-2">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${contextMenu.habit.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

                    <button
                        onClick={handleDeleteHabit}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Habit
                    </button>

                </div>
            )}
        </div>
    );
}
