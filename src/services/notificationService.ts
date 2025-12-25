import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// Check if we're running on a native platform
const isNative = Capacitor.isNativePlatform();

/**
 * Initialize push notifications (for Android/iOS)
 * Requests permission and registers for push notifications
 */
export async function initializePushNotifications(): Promise<string | null> {
    if (!isNative) {
        console.log('Push notifications only available on native platforms');
        return null;
    }

    try {
        // Request permission
        const permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Register with FCM/APNs
        await PushNotifications.register();

        // Register action types
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'HABIT_REMINDER',
                    actions: [
                        { id: 'done', title: 'Mark as Done', foreground: true },
                        { id: 'close', title: 'Close', foreground: false, destructive: true }
                    ]
                },
                {
                    id: 'TASK_REMINDER',
                    actions: [
                        { id: 'close', title: 'Close', foreground: false }
                    ]
                }
            ]
        });

        // Get the FCM token
        return new Promise((resolve) => {
            PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token:', token.value);
                resolve(token.value);
            });

            PushNotifications.addListener('registrationError', (err) => {
                console.error('Push registration error:', err.error);
                resolve(null);
            });
        });
    } catch (error) {
        console.error('Error initializing push notifications:', error);
        return null;
    }
}

/**
 * Schedule a local notification for habit reminders
 */
export async function scheduleHabitReminder(
    habitId: string,
    habitName: string,
    hour: number,
    minute: number
): Promise<void> {
    if (!isNative) {
        console.log('Local notifications only available on native platforms');
        return;
    }

    try {
        // Request permission for local notifications
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') {
            console.log('Local notification permission denied');
            return;
        }

        // Cancel any existing notification for this habit
        await cancelHabitReminder(habitId);

        // Schedule daily recurring notification
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: hashCode(habitId),
                    title: '⏰ Habit Reminder',
                    body: `Time to complete: ${habitName}`,
                    schedule: {
                        at: scheduledTime,
                        repeats: true,
                        every: 'day',
                        allowWhileIdle: true,
                    },
                    sound: 'default',
                    smallIcon: 'ic_stat_icon_config_sample',
                    actionTypeId: 'HABIT_REMINDER',
                    autoCancel: true,
                    extra: { habitId },
                },
            ],
        });

        console.log(`Scheduled reminder for ${habitName} at ${hour}:${minute}`);
    } catch (error) {
        console.error('Error scheduling habit reminder:', error);
    }
}

/**
 * Schedule a task due date reminder
 */
export async function scheduleTaskReminder(
    taskId: string,
    taskTitle: string,
    dueDate: Date,
    hoursBeforeDue: number = 1
): Promise<void> {
    if (!isNative) {
        console.log('Local notifications only available on native platforms');
        return;
    }

    try {
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') {
            return;
        }

        // Cancel any existing notification for this task
        await cancelTaskReminder(taskId);

        // Calculate when to send the reminder
        let reminderTime = new Date(dueDate);
        const originalDueDate = new Date(dueDate);
        reminderTime.setHours(reminderTime.getHours() - hoursBeforeDue);

        const now = new Date();

        // If reminder time is in the past but the actual task is still in the future,
        // schedule for 10 seconds from now so the user gets notified immediately
        let bodyText = `"${taskTitle}" is due in ${hoursBeforeDue} hour(s)`;

        if (reminderTime <= now) {
            if (originalDueDate > now) {
                reminderTime = new Date(now.getTime() + 10000); // 10 seconds from now
                bodyText = `"${taskTitle}" is due shortly!`;
                console.log('Lead time already passed, scheduling immediate reminder');
            } else {
                console.log('Task due date is in the past, skipping notification');
                return;
            }
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: hashCode(taskId),
                    title: '📋 Task Due Soon',
                    body: bodyText,
                    schedule: {
                        at: reminderTime,
                        allowWhileIdle: true,
                    },
                    sound: 'default',
                    smallIcon: 'ic_stat_icon_config_sample',
                    actionTypeId: 'TASK_REMINDER',
                    autoCancel: true,
                    extra: { taskId },
                },
            ],
        });

        console.log(`Scheduled task reminder for ${taskTitle}`);
    } catch (error) {
        console.error('Error scheduling task reminder:', error);
    }
}

/**
 * Cancel a habit reminder
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
    if (!isNative) return;

    try {
        await LocalNotifications.cancel({
            notifications: [{ id: hashCode(habitId) }],
        });
    } catch (error) {
        console.error('Error canceling habit reminder:', error);
    }
}

/**
 * Cancel a task reminder
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
    if (!isNative) return;

    try {
        await LocalNotifications.cancel({
            notifications: [{ id: hashCode(taskId) }],
        });
    } catch (error) {
        console.error('Error canceling task reminder:', error);
    }
}

/**
 * Set up notification listeners for handling taps
 */
export function setupNotificationListeners(
    onHabitReminderTap?: (habitId: string, isDone?: boolean) => void,
    onTaskReminderTap?: (taskId: string) => void
): void {
    if (!isNative) return;

    // Handle push notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
    });

    // Handle push notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
    });

    // Handle local notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification.extra;
        const actionId = action.actionId;

        // Automatically dismiss the notification on any action
        LocalNotifications.cancel({ notifications: [{ id: action.notification.id }] });

        if (actionId === 'close') {
            return;
        }

        if (action.notification.actionTypeId === 'HABIT_REMINDER' && extra?.habitId) {
            onHabitReminderTap?.(extra.habitId, actionId === 'done');
        } else if (action.notification.actionTypeId === 'TASK_REMINDER' && extra?.taskId) {
            onTaskReminderTap?.(extra.taskId);
        }
    });
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
    if (!isNative) return false;

    try {
        const status = await LocalNotifications.checkPermissions();
        return status.display === 'granted';
    } catch {
        return false;
    }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (!isNative) return false;

    try {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    } catch {
        return false;
    }
}

// Helper to generate numeric ID from string
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
