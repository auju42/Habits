import { useState } from 'react';
import Navbar from './Navbar';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModuleSetupModal from './ModuleSetupModal';
import { Toaster } from 'sonner';

export default function Layout() {
    const { enabledModules, hasCompletedSetup } = useAuth();
    const location = useLocation();
    const [showSetupModal, setShowSetupModal] = useState(!hasCompletedSetup);

    // Determine default route based on enabled modules
    const getDefaultRoute = () => {
        if (enabledModules.habits || enabledModules.tasks) return '/';
        if (enabledModules.quran) return '/quran';
        return '/';
    };

    // Redirect logic based on enabled modules
    if (location.pathname === '/') {
        if (!enabledModules.habits && !enabledModules.tasks && enabledModules.quran) {
            return <Navigate to="/quran" replace />;
        }
    }

    if (location.pathname === '/quran' && !enabledModules.quran) {
        return <Navigate to={getDefaultRoute()} replace />;
    }

    if (location.pathname === '/tasks' && !enabledModules.tasks) {
        return <Navigate to={getDefaultRoute()} replace />;
    }



    const handleSetupComplete = () => {
        setShowSetupModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <main>
                <Outlet />
            </main>

            {/* First-time setup modal */}
            <ModuleSetupModal
                isOpen={showSetupModal}
                onComplete={handleSetupComplete}
            />
            <Toaster position="top-right" />
        </div>
    );
}
