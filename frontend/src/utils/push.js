import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '../config/firebase.js';
import { api } from './api.js';

let messagingInstance = null;

function buildServiceWorkerUrl() {
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

// Registers the rider's device for push notifications: requests permission,
// gets an FCM token, and saves it to the backend via PUT /api/auth/fcm-token.
// Safe to call repeatedly (e.g. on every rider login) — it's a no-op if the
// browser doesn't support push, or if the rider has denied/not granted
// permission. Never throws; a failure here should never block rider login.
export async function registerRiderPush() {
  try {
    if (!('serviceWorker' in navigator) || !(await isSupported())) return false;
    if (Notification.permission === 'denied') return false;
    if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
      console.warn('VITE_FIREBASE_VAPID_KEY not set — skipping push registration.');
      return false;
    }

    const registration = await navigator.serviceWorker.register(buildServiceWorkerUrl());

    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    if (!messagingInstance) messagingInstance = getMessaging(app);

    const token = await getToken(messagingInstance, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    await api.put('/auth/fcm-token', { fcmToken: token });
    return true;
  } catch (err) {
    console.warn('Push registration skipped:', err.message);
    return false;
  }
}

// Subscribes to pushes that arrive while the rider app is open (foregrounded).
// Returns an unsubscribe function. No-op if messaging was never initialized
// (e.g. registerRiderPush() failed or hasn't run yet).
export function onForegroundPush(callback) {
  if (!messagingInstance) return () => {};
  return onMessage(messagingInstance, callback);
}
