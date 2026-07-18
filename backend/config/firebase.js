const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

// Expects FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL env vars.
// Private key usually needs its literal \n sequences converted to real newlines.
function initFirebase() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin not configured - staff auth/FCM routes will fail until env vars are set.");
    return;
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function firebaseAuth() {
  return getAuth();
}

function firebaseMessaging() {
  return getMessaging();
}

function firestore() {
  return getFirestore();
}

module.exports = { initFirebase, firebaseAuth, firebaseMessaging, firestore };
