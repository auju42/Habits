import Navbar from './Navbar';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { appMode } = useAuth();
    const location = useLocation();

    // If no mode selected, redirect to selection
    if (!appMode && location.pathname !== '/mode-selection') {
        return <Navigate to="/mode-selection" replace />;
    }

    // If Quran mode selected and trying to access root, redirect to Quran
    if (appMode === 'quran' && location.pathname === '/') {
        return <Navigate to="/quran" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
}
