import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutGrid, CheckSquare, BookOpen, Settings } from 'lucide-react';

export default function MobileBottomNav() {
    const { enabledModules } = useAuth();
    const location = useLocation();

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
        // Settings (Easy access)
        { to: '/settings', icon: Settings, label: 'Settings' }
    ];

    if (navLinks.length === 0) return null;

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)] z-50">
            <div className="flex justify-around items-center h-16">
                {navLinks.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'fill-current opacity-20 stroke-2' : 'stroke-[1.5]'}`} />
                            {/* Fill icon style for active state if appropriate, or just color change */}
                            <span className="text-[10px] font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
