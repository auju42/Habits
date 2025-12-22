// Firebase Messaging Service Worker for background push notifications
// This file must be at the root of the public directory

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// IMPORTANT: Replace these with your actual Firebase config values
// You can find these in your Firebase Console > Project Settings > General
firebase.initializeApp({
    apiKey: 'AIzaSyBZ9CjPPTC2jnFMj3gDxl_MNp1s6ZCjvwg',
    authDomain: 'habit-tracker-e81f4.firebaseapp.com',
    projectId: 'habit-tracker-e81f4',
    storageBucket: 'habit-tracker-e81f4.firebasestorage.app',
    messagingSenderId: '183255939378',
    appId: '1:183255939378:web:167747ed7c3608f85b7f2b'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Stride Reminder';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a reminder!',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        tag: payload.data?.type || 'default',
        data: payload.data,
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);
    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
