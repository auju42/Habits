import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setupNotificationListeners } from '../services/notificationService';
import { getHabit, incrementHabitProgress, toggleHabitCompletion } from '../services/habitService';
import { format } from 'date-fns';

export default function NotificationHandler() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        setupNotificationListeners(
            async (habitId, isDone) => {
                console.log('Habit action:', habitId, 'Done:', isDone);

                if (isDone) {
                    try {
                        const habit = await getHabit(user.uid, habitId);
                        if (!habit) return;

                        const today = format(new Date(), 'yyyy-MM-dd');
                        if (habit.habitType === 'count') {
                            await incrementHabitProgress(user.uid, habit, today);
                        } else {
                            await toggleHabitCompletion(user.uid, habit, today);
                        }
                    } catch (error) {
                        console.error('Error processing habit action:', error);
                    }
                }
                // If not isDone, it was just a tap - maybe navigate?
                // For now, it just dismissing is handled by notificationService
            },
            (taskId) => {
                console.log('Task notification tapped:', taskId);
            }
        );
    }, [user]);

    return null;
}
