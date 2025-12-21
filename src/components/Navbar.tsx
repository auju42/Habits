import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutGrid, Moon, Sun, CheckSquare, Menu, X, BookOpen, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const { user, enabledModules } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!user) return null;

    // Build nav links based on enabled modules
    const navLinks = [
        // Habits (Unified View)
        ...(enabledModules.habits
            ? [{ to: '/', icon: CheckSquare, label: 'Habits' }]
            : []),
        // Tasks
        ...(enabledModules.tasks
            ? [{ to: '/tasks', icon: LayoutGrid, label: 'Tasks' }]
            : []),
        // Quran
        ...(enabledModules.quran
            ? [{ to: '/quran', icon: BookOpen, label: 'Hifz' }]
            : []),
    ];

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 relative z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                Stride
                            </span>
                        </div>
                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navLinks.map(({ to, icon: Icon, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === to
                                        ? 'border-blue-500 text-gray-900 dark:text-white'
                                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>
                        <div className="hidden sm:flex flex-shrink-0 items-center gap-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {user.displayName}
                            </span>
                            <img
                                className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600"
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                                alt="User avatar"
                            />
                            <Link
                                to="/settings"
                                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden ml-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" />
                                ) : (
                                    <Menu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    <div className="pt-2 pb-3 space-y-1">
                        {navLinks.map(({ to, icon: Icon, label }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center px-4 py-3 text-base font-medium ${location.pathname === to
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300'
                                    : 'border-l-4 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {label}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-600"
                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                                    alt="User avatar"
                                />
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.displayName}</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                            <Link
                                to="/settings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <Settings className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
