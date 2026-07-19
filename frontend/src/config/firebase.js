import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Staff-only Firebase project (email/password auth). Customers never touch this —
// public pages (Home/Shop/Track) talk to our own backend, not Firebase directly,
// EXCEPT for a lean read-only Firestore subscription on Track.jsx (Phase 5B) that
// picks up live order-status updates the backend mirrors via
// backend/utils/firestoreSync.js. That collection only ever holds status/riderName,
// never customer contact details, so an anonymous-read Firestore rule on it is safe.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
