// Firebase Messaging Service Worker for background push notifications
// This file must be at the root of the public directory

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - will be replaced by actual values at build time
firebase.initializeApp({
    apiKey: 'PLACEHOLDER', // Replaced at runtime
    authDomain: 'PLACEHOLDER',
    projectId: 'PLACEHOLDER',
    storageBucket: 'PLACEHOLDER',
    messagingSenderId: 'PLACEHOLDER',
    appId: 'PLACEHOLDER'
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
