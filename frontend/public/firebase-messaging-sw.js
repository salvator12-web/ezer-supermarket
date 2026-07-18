/* eslint-disable no-undef */
// Firebase config is passed as query params on registration (see utils/push.js)
// instead of hardcoded here, since this file is served as a static asset and
// never touches Vite's import.meta.env.
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

// Only fires when the rider app is backgrounded/closed. Foreground pushes are
// handled in JS via onMessage (see utils/push.js) so we don't double-notify.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'EZER Supermarket', {
    body: body || 'You have a new delivery update.',
    data: payload.data,
    tag: payload.data?.orderId || 'ezer-notification',
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const url = orderId ? `/rider` : '/rider';
  event.waitUntil(clients.openWindow(url));
});
