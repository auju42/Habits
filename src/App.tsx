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
import { initializePushNotifications, setupNotificationListeners } from './services/notificationService';

function App() {
  // Initialize notifications on app start
  useEffect(() => {
    const initNotifications = async () => {
      const token = await initializePushNotifications();
      if (token) {
        console.log('FCM Token:', token);
        // Token can be stored in Firestore for server-side push notifications later
      }

      // Set up tap handlers
      setupNotificationListeners(
        (habitId) => {
          console.log('Habit reminder tapped:', habitId);
          // Could navigate to habits page
        },
        (taskId) => {
          console.log('Task reminder tapped:', taskId);
          // Could navigate to tasks page
        }
      );
    };

    initNotifications();
  }, []);

  return (
    <Router>
      <AuthProvider>
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

