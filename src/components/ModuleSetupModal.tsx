import { useState } from 'react';
import { CheckSquare, ListTodo, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth, type EnabledModules } from '../contexts/AuthContext';

interface Props {
    isOpen: boolean;
    onComplete: () => void;
}

const MODULES: Array<{
    key: keyof EnabledModules;
    name: string;
    icon: typeof CheckSquare;
    color: 'emerald' | 'blue' | 'purple';
    description: string;
}> = [
        {
            key: 'habits',
            name: 'Habits',
            icon: CheckSquare,
            color: 'emerald',
            description: 'Build positive routines by tracking daily habits. See your streaks grow and visualize progress on a calendar.',
        },
        {
            key: 'tasks',
            name: 'Tasks',
            icon: ListTodo,
            color: 'blue',
            description: 'Manage your to-do list with priorities, due dates, and Google Calendar integration.',
        },
        {
            key: 'quran',
            name: 'Quran Hifz',
            icon: BookOpen,
            color: 'purple',
            description: 'Track your Quran memorization journey page by page, and log your daily reviews.',
        },
    ];


export default function ModuleSetupModal({ isOpen, onComplete }: Props) {
    const { user, enabledModules, setAllModules, completeSetup } = useAuth();
    const [localModules, setLocalModules] = useState<EnabledModules>({ ...enabledModules });

    const toggleModule = (key: keyof EnabledModules) => {
        setLocalModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleComplete = () => {
        // Ensure at least one module is enabled
        const hasAny = localModules.habits || localModules.tasks || localModules.quran;
        if (!hasAny) {
            setLocalModules({ habits: true, tasks: true, quran: true });
            setAllModules({ habits: true, tasks: true, quran: true });
        } else {
            setAllModules(localModules);
        }
        completeSetup();
        onComplete();
    };

    if (!isOpen) return null;

    const enabledCount = Object.values(localModules).filter(Boolean).length;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome, {user?.displayName?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Choose the modules you want to use. You can change this anytime in Settings.
                    </p>
                </div>

                {/* Modules */}
                <div className="p-6 space-y-4">
                    {MODULES.map((module) => {
                        const Icon = module.icon;
                        const isEnabled = localModules[module.key];
                        const colorClasses = {
                            emerald: {
                                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                                icon: 'text-emerald-600 dark:text-emerald-400',
                                ring: 'ring-emerald-500',
                                checkbox: 'bg-emerald-500',
                            },
                            blue: {
                                bg: 'bg-blue-100 dark:bg-blue-900/30',
                                icon: 'text-blue-600 dark:text-blue-400',
                                ring: 'ring-blue-500',
                                checkbox: 'bg-blue-500',
                            },
                            purple: {
                                bg: 'bg-purple-100 dark:bg-purple-900/30',
                                icon: 'text-purple-600 dark:text-purple-400',
                                ring: 'ring-purple-500',
                                checkbox: 'bg-purple-500',
                            },
                        }[module.color];

                        return (
                            <button
                                key={module.key}
                                onClick={() => toggleModule(module.key)}
                                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${isEnabled
                                    ? `border-transparent ring-2 ${colorClasses.ring} bg-gray-50 dark:bg-gray-700/50`
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses.bg}`}>
                                    <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {module.name}
                                        </h3>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isEnabled
                                            ? `${colorClasses.checkbox} border-transparent`
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {isEnabled && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                    <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {module.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleComplete}
                        disabled={enabledCount === 0}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                    >
                        Get Started with {enabledCount} Module{enabledCount !== 1 ? 's' : ''}
                        <ArrowRight size={18} />
                    </button>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                        At least one module must be enabled
                    </p>
                </div>
            </div>
        </div>
    );
}
