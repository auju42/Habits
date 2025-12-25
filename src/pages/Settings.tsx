import { CheckSquare, BookOpen, LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, type EnabledModules } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MODULES = [
    {
        key: 'habits' as keyof EnabledModules,
        name: 'Habits',
        icon: CheckSquare,
        color: 'emerald',
        description: 'Build positive routines by tracking daily habits with streaks and calendar view.',
    },
    /*
    {
        key: 'tasks' as keyof EnabledModules,
        name: 'Tasks',
        icon: ListTodo,
        color: 'blue',
        description: 'Manage your to-do list with priorities, due dates, and Google Calendar sync.',
    },
    */
    {
        key: 'quran' as keyof EnabledModules,
        name: 'Quran Hifz',
        icon: BookOpen,
        color: 'purple',
        description: 'Track your Quran memorization and review progress page by page.',
    },
];

export default function Settings() {
    const { user, enabledModules, setModuleEnabled, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleToggle = (key: keyof EnabledModules) => {
        // Ensure at least one module stays enabled
        const otherEnabled = Object.entries(enabledModules)
            .filter(([k]) => k !== key)
            .some(([, v]) => v);

        if (!enabledModules[key] || otherEnabled) {
            setModuleEnabled(key, !enabledModules[key]);
        } else {
            toast.error('At least one module must be enabled');
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email || 'Guest Account'}
                    </p>
                </div>
            </div>

            {/* Modules Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Modules</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Enable or disable app features
                    </p>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MODULES.map((module) => {
                        const Icon = module.icon;
                        const isEnabled = enabledModules[module.key];
                        const colorClasses = {
                            emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                        }[module.color];

                        return (
                            <div
                                key={module.key}
                                className="flex items-center gap-4 p-4"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {module.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {module.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle(module.key)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Account Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Account</h2>
                </div>

                <div className="p-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
