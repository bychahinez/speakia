import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Values come from .env (EXPO_PUBLIC_FIREBASE_*). This config identifies the project; it is not a
// secret. What protects data is Firebase Auth plus the rules in firestore.rules.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False when .env has no Firebase config: the app then keeps everything on the phone. */
export const firebaseReady = !!(config.apiKey && config.projectId && config.appId);

const app = firebaseReady ? (getApps().length ? getApp() : initializeApp(config)) : null;

function makeAuth(): Auth | null {
  if (!app) return null;
  if (Platform.OS === 'web') return getAuth(app);
  try {
    // Keep the learner signed in between app launches.
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (e) {
    // Fast refresh runs this file again: the auth made the first time is still there and still persistent.
    if ((e as { code?: string })?.code !== 'auth/already-initialized') {
      console.warn('[speakia] sign-in will NOT be remembered between launches:', e);
    }
    return getAuth(app);
  }
}

export const auth = makeAuth();
export const db = app ? getFirestore(app) : null;
