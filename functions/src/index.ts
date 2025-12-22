/**
 * Firebase Cloud Functions for Stride Habit Tracker
 * Sends push notifications for task reminders and habit reminders
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/scheduler";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

/**
 * Scheduled function that runs every 2 minutes to check for:
 * 1. Tasks that are due at the current time
 * 2. Habits with reminder times matching current time
 */
export const sendNotifications = onSchedule(
    {
        schedule: "every 2 minutes",
        timeZone: "UTC",
    },
    async () => {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        // Round to nearest 2-minute window
        const roundedMinute = Math.floor(currentMinute / 2) * 2;
        const timeStr = `${currentHour.toString().padStart(2, "0")}:${roundedMinute.toString().padStart(2, "0")}`;
        const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

        console.log(`[sendNotifications] Running at ${now.toISOString()}, checking for time: ${timeStr}`);

        try {
            // Get all users
            const usersSnapshot = await db.collection("users").get();

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;

                // Get user's FCM token
                const tokenDoc = await db.doc(`users/${userId}/fcmTokens/web`).get();
                if (!tokenDoc.exists) {
                    continue;
                }
                const fcmToken = tokenDoc.data()?.token;
                if (!fcmToken) {
                    continue;
                }

                // Check tasks due now
                const tasksSnapshot = await db
                    .collection(`users/${userId}/tasks`)
                    .where("dueDate", "==", todayStr)
                    .where("dueTime", ">=", timeStr)
                    .where("dueTime", "<", incrementTime(timeStr, 2))
                    .where("completed", "==", false)
                    .get();

                for (const taskDoc of tasksSnapshot.docs) {
                    const task = taskDoc.data();
                    await sendPushNotification(
                        fcmToken,
                        "⏰ Task Reminder",
                        task.title || "You have a task due now!",
                        { type: "task", taskId: taskDoc.id }
                    );
                    console.log(`[sendNotifications] Sent task notification: ${task.title}`);
                }

                // Check habits with reminders at this time
                const habitsSnapshot = await db
                    .collection(`users/${userId}/habits`)
                    .where("reminderTime", ">=", timeStr)
                    .where("reminderTime", "<", incrementTime(timeStr, 2))
                    .get();

                for (const habitDoc of habitsSnapshot.docs) {
                    const habit = habitDoc.data();

                    // Check if habit is already completed today
                    const completedDates = habit.completedDates || [];
                    if (completedDates.includes(todayStr)) {
                        continue; // Already done, skip
                    }

                    await sendPushNotification(
                        fcmToken,
                        "🎯 Habit Reminder",
                        `Time for: ${habit.name}`,
                        { type: "habit", habitId: habitDoc.id }
                    );
                    console.log(`[sendNotifications] Sent habit notification: ${habit.name}`);
                }
            }

            console.log("[sendNotifications] Completed successfully");
        } catch (error) {
            console.error("[sendNotifications] Error:", error);
            throw error;
        }
    }
);

/**
 * Helper to increment a time string by N minutes
 */
function incrementTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
}

/**
 * Send a push notification via FCM
 */
async function sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: Record<string, string>
): Promise<void> {
    try {
        await messaging.send({
            token,
            notification: {
                title,
                body,
            },
            data,
            webpush: {
                notification: {
                    icon: "/android-chrome-192x192.png",
                    badge: "/favicon-32x32.png",
                    requireInteraction: true,
                },
            },
        });
    } catch (error: any) {
        // If token is invalid, log it but don't throw
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
            console.warn(`Invalid FCM token: ${token.substring(0, 20)}...`);
        } else {
            throw error;
        }
    }
}

