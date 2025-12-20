import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, CheckSquare, Layers } from 'lucide-react';
import type { AppMode } from '../contexts/AuthContext';

export default function ModeSelection() {
    const { setAppMode, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSelectMode = (mode: AppMode) => {
        setAppMode(mode);
        if (mode === 'quran') {
            navigate('/quran');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Welcome, {user?.displayName?.split(' ')[0]}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    How would you like to use the app today?
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Habits Mode */}
                    <button
                        onClick={() => handleSelectMode('habits')}
                        className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 text-left"
                    >
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Habits & Tasks
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Focus on productivity, daily routines, and task management.
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                    </button>

                    {/* Both Mode */}
                    <button
                        onClick={() => handleSelectMode('both')}
                        className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-primary-100 dark:border-primary-900 ring-2 ring-primary-500/20 text-left"
                    >
                        <div className="absolute top-4 right-4 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Popular
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            All Features
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            The complete experience. Track your habits and Quran memorization together.
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                    </button>

                    {/* Quran Mode */}
                    <button
                        onClick={() => handleSelectMode('quran')}
                        className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 text-left"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Quran Hifz
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Dedicated interface for tracking your Quran memorization and review.
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => logout()}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                        Sign in with a different account
                    </button>
                </div>
            </div>
        </div>
    );
}
