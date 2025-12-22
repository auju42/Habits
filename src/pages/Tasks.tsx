import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToTasks, addTask, toggleTaskCompletion, deleteTask } from '../services/taskService';
import type { Task } from '../types';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

type FilterType = 'all' | 'active' | 'completed';

export default function Tasks() {
    const { user, accessToken } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('active');

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToTasks(user.uid, (data) => {
            setTasks(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddTask = async (
        title: string,
        priority: 'low' | 'medium' | 'high',
        description?: string,
        dueDate?: string,
        dueTime?: string,
        recurrence: 'daily' | 'weekly' | 'monthly' | 'none' = 'none',
        itemType: 'task' | 'event' = 'task'
    ) => {
        if (!user) return;
        await addTask(user.uid, title, priority, description, dueDate, dueTime, accessToken, recurrence, itemType);
    };

    const handleToggleTask = async (task: Task) => {
        if (!user) return;
        await toggleTaskCompletion(user.uid, task, accessToken);
    };

    const handleDeleteTask = async (task: Task) => {
        if (!user || !window.confirm('Delete this task?')) return;
        await deleteTask(user.uid, task, accessToken);
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const activeTasks = tasks.filter(t => !t.completed).length;
    const completedTasks = tasks.filter(t => t.completed).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Tasks
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {activeTasks} active, {completedTasks} completed
                    </p>
                </div>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['all', 'active', 'completed'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {filter === 'all' && 'Create your first task to get started.'}
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Add Task
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleTask(task)}
                            onDelete={() => handleDeleteTask(task)}
                        />
                    ))}
                </div>
            )}

            {isFormOpen && (
                <TaskForm
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleAddTask}
                />
            )}
        </div>
    );
}
