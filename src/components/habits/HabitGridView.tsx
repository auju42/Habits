import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToHabits, toggleHabitCompletion, incrementHabitProgress, reorderHabits, deleteHabit, updateHabit } from '../../services/habitService';
import type { Habit } from '../../types';
import { format, subDays, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, Trophy, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import HabitEditForm from '../../components/HabitEditForm';
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
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component (or Static Row when not in reposition mode)
function SortableHabitRow({ habit, dates, DAYS_TO_SHOW, handleCellClick, onContextMenu }: any) {
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
        position: 'relative' as const,
        opacity: isDragging ? 0.5 : 1,
    };

    const habitColor = habit.color || '#3B82F6';
    const totalCount = habit.completedDates?.length || 0;
    const currentStreak = habit.streak || 0;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "grid grid-cols-[120px_1fr_60px] sm:grid-cols-[160px_1fr_80px] md:grid-cols-[200px_1fr_100px] hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group bg-white dark:bg-gray-800",
                isDragging && "shadow-lg ring-1 ring-blue-500/20"
            )}
            style={style}
        >
            {/* Habit Name & Context Menu - Draggable Area */}
            <div
                className="p-2 sm:p-3 md:p-4 flex items-center gap-1 sm:gap-2 border-r border-transparent border-b border-gray-50 dark:border-gray-800 cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'none' }}
                {...attributes}
                {...listeners}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, habit);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 sm:p-1 transition-colors flex-shrink-0"
                >
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div className="w-1 sm:w-1.5 h-6 sm:h-8 rounded-full flex-shrink-0" style={{ backgroundColor: habitColor }} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate" title={habit.name}>
                        {habit.name}
                    </p>
                    {habit.habitType === 'count' && (
                        <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                            Goal: {habit.dailyGoal}
                        </p>
                    )}
                </div>
            </div>

            {/* Date Cells */}
            <div className="grid border-b border-gray-50 dark:border-gray-800" style={{ gridTemplateColumns: `repeat(${DAYS_TO_SHOW}, 1fr)` }}>
                {dates.map((date: Date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isCompleted = habit.completedDates?.includes(dateStr);
                    const countProgress = habit.dailyProgress?.[dateStr] || 0;
                    const dailyGoal = habit.dailyGoal || 1;

                    let opacity = 0;

                    if (habit.habitType === 'simple') {
                        if (isCompleted) opacity = 1;
                    } else {
                        if (habit.isQuitting) {
                            if (countProgress <= dailyGoal) opacity = 1;
                            else opacity = 0;
                        } else {
                            if (countProgress >= dailyGoal) {
                                opacity = 1;
                            } else {
                                opacity = 0;
                            }
                        }
                    }

                    let cellStyle: React.CSSProperties = {};
                    if (opacity > 0) {
                        cellStyle.backgroundColor = habitColor;
                        cellStyle.opacity = Math.max(0.2, opacity);
                    }

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleCellClick(habit, dateStr)}
                            className="relative w-full h-full border-l border-dashed border-gray-100 dark:border-gray-700/50 first:border-l-0 flex items-center justify-center focus:outline-none"
                        >
                            <div
                                className={cn(
                                    "w-full h-full transition-all duration-300 transform flex items-center justify-center",
                                    opacity > 0 ? "scale-90 rounded-md" : "hover:bg-gray-100 dark:hover:bg-gray-700/50 scale-50 rounded-full"
                                )}
                                style={opacity > 0 ? cellStyle : undefined}
                            >
                                {/* Count indicator */}
                                {habit.habitType === 'count' && countProgress > 0 && (
                                    <span className={cn(
                                        "text-[9px] sm:text-[10px] font-bold",
                                        opacity > 0 ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" : "text-gray-500 dark:text-gray-400"
                                    )}>
                                        {countProgress}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Stats Column */}
            <div className="flex items-center gap-1 sm:gap-3 px-1 sm:px-4 border-l border-dashed border-gray-100 dark:border-gray-700 border-b border-gray-50 dark:border-gray-800">
                <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-0.5 sm:gap-1 text-orange-500 mb-0.5">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs font-bold">{currentStreak}</span>
                    </div>
                </div>
                <div className="w-px h-6 sm:h-8 bg-gray-100 dark:bg-gray-700" />
                <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-0.5 sm:gap-1 text-green-500 mb-0.5">
                        <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs font-bold">{totalCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function HabitGridView() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [endDate, setEndDate] = useState(new Date());
    const DAYS_TO_SHOW = 14;

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, habit: Habit } | null>(null);

    // Edit Form State
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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

    const handleCellClick = async (habit: Habit, dateStr: string) => {
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

    const handlePrev = () => setEndDate(d => subDays(d, 7));
    const handleNext = () => setEndDate(d => addDays(d, 7));
    const jumpToToday = () => setEndDate(new Date());

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

    const handleEditHabit = async (updates: { name: string; reminderTime?: string }) => {
        if (!user || !editingHabit) return;
        await updateHabit(user.uid, editingHabit.id, updates);
        setEditingHabit(null);
    };

    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
        // Reverse order: Today is first (index 0), then past days
        return subDays(endDate, i);
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative pb-4">
            {/* Header / Controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <button onClick={jumpToToday} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Today
                    </button>
                    <button onClick={handleNext} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                    {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d, yyyy')}
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-max">
                    {/* Grid Header */}
                    <div className="grid grid-cols-[120px_1fr_60px] sm:grid-cols-[160px_1fr_80px] md:grid-cols-[200px_1fr_100px] border-b border-gray-100 dark:border-gray-700">
                        <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Habit
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${DAYS_TO_SHOW}, 1fr)` }}>
                            {dates.map(date => (
                                <div key={date.toISOString()} className={cn(
                                    "flex flex-col items-center justify-center py-2 px-1 text-xs border-l border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                    isToday(date) && "bg-blue-50 dark:bg-blue-900/10"
                                )}>
                                    <span className="text-gray-400 font-medium">{format(date, 'EEE')}</span>
                                    <span className={cn(
                                        "font-bold mt-1 w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday(date) ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {format(date, 'd')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center border-l w-[120px] border-dashed border-gray-100 dark:border-gray-700">
                            Stats
                        </div>
                    </div>

                    {/* Grid Body */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                        }}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {habits.map(habit => (
                                    <SortableHabitRow
                                        key={habit.id}
                                        habit={habit}
                                        dates={dates}
                                        DAYS_TO_SHOW={DAYS_TO_SHOW}
                                        handleCellClick={handleCellClick}
                                        onContextMenu={handleContextMenu}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

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
                        onClick={() => {
                            setEditingHabit(contextMenu.habit);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit Habit
                    </button>

                    <button
                        onClick={handleDeleteHabit}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Habit
                    </button>

                </div>
            )}

            {/* Edit Habit Form */}
            {editingHabit && (
                <HabitEditForm
                    habit={editingHabit}
                    onClose={() => setEditingHabit(null)}
                    onSubmit={handleEditHabit}
                />
            )}
        </div >
    );
}
