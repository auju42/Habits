import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import HabitsPage from './pages/HabitsPage';
import Tasks from './pages/Tasks';
import QuranTracker from './pages/QuranTracker';
import Settings from './pages/Settings';
import { initializePushNotifications } from './services/notificationService';
import NotificationHandler from './components/NotificationHandler';

function App() {
  // Initialize push notification registration on app start
  useEffect(() => {
    initializePushNotifications();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <NotificationHandler />
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HabitsPage />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/quran" element={<QuranTracker />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

