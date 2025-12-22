import { useState, useEffect } from 'react';
import { Plus, Flame, CheckCircle, Target, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToHabits, addHabit, toggleHabitCompletion, deleteHabit, incrementHabitProgress, decrementHabitProgress, reorderHabits, updateHabit } from '../../services/habitService';
import type { Habit } from '../../types';
import HabitCard from '../../components/HabitCard';
import HabitForm from '../../components/HabitForm';
import { format } from 'date-fns';
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

// Sortable Wrapper Component
function SortableHabitItem({ habit, onToggle, onIncrement, onDecrement, onContextMenu }: any) {
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
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <HabitCard
                habit={habit}
                onToggle={onToggle}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onContextMenu={onContextMenu}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

export default function DailyHabitsView() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, habit: Habit } | null>(null);


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!user) return;
        const unsubHabits = subscribeToHabits(user.uid, (data) => {
            setHabits(data);
            setLoading(false);
        });
        return () => unsubHabits();
    }, [user]);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleAddHabit = async (name: string, habitType: 'simple' | 'count', dailyGoal?: number, isQuitting?: boolean, color?: string, reminderTime?: string) => {
        if (!user) return;
        await addHabit(user.uid, name, habitType, dailyGoal, isQuitting, color, reminderTime);
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

    const handleDeleteHabit = async () => {
        if (!user || !contextMenu || !window.confirm('Are you sure you want to delete this habit?')) return;
        await deleteHabit(user.uid, contextMenu.habit.id);
        setContextMenu(null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !user) return;

        const oldIndex = habits.findIndex((h) => h.id === active.id);
        const newIndex = habits.findIndex((h) => h.id === over.id);

        const newHabits = arrayMove(habits, oldIndex, newIndex);
        setHabits(newHabits); // Optimistic UI update

        await reorderHabits(user.uid, newHabits);
    };

    const handleContextMenu = (e: React.MouseEvent, habit: Habit) => {
        e.preventDefault();
        e.stopPropagation();
        // Clamp position to viewport
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

    // Colors list
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
    ];

    // Today's data
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const completedToday = habits.filter(h => h.completedDates?.includes(todayStr)).length;
    const totalHabits = habits.length;
    const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative pb-20">
            {/* Header */}
            <div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            {/* Main Content */}
            <div>
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {habits.map((habit) => (
                                    <SortableHabitItem
                                        key={habit.id}
                                        habit={habit}
                                        onToggle={handleToggleHabit}
                                        onIncrement={handleIncrementHabit}
                                        onDecrement={handleDecrementHabit}
                                        onContextMenu={handleContextMenu}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {isFormOpen && (
                <HabitForm
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleAddHabit}
                />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] py-1 animation-scale-in"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()} // Prevent close on click inside
                >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{contextMenu.habit.name}</span>
                    </div>

                    {/* Color Picker Submenu Option */}
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
