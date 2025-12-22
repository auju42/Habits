import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Check if notifications are supported
export const isNotificationSupported = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;
    return await isSupported();
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }
    return await Notification.requestPermission();
};

// Get FCM token and store it
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
    try {
        const supported = await isNotificationSupported();
        if (!supported) {
            console.warn('Push notifications are not supported');
            return null;
        }

        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        // Register service worker for Firebase messaging
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);

        // Get messaging instance
        const messaging = getMessaging();

        // Get the FCM token
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('FCM Token:', token);
            // Store token in Firestore under user document
            await storeFCMToken(userId, token);
            return token;
        } else {
            console.warn('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
};

// Store FCM token in Firestore
const storeFCMToken = async (userId: string, token: string): Promise<void> => {
    const tokenRef = doc(db, `users/${userId}/fcmTokens`, 'web');
    await setDoc(tokenRef, {
        token,
        updatedAt: new Date().toISOString(),
        platform: 'web'
    }, { merge: true });
};

// Get stored FCM token
export const getStoredFCMToken = async (userId: string): Promise<string | null> => {
    try {
        const tokenRef = doc(db, `users/${userId}/fcmTokens`, 'web');
        const docSnap = await getDoc(tokenRef);
        if (docSnap.exists()) {
            return docSnap.data().token;
        }
        return null;
    } catch (error) {
        console.error('Error getting stored FCM token:', error);
        return null;
    }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) => {
    try {
        const messaging = getMessaging();
        return onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            callback(payload);
        });
    } catch (error) {
        console.error('Error setting up foreground message listener:', error);
        return () => { };
    }
};

// Show a local notification (for foreground messages)
export const showLocalNotification = (title: string, body: string, data?: Record<string, string>): void => {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        tag: data?.type || 'default',
        data
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };
};
