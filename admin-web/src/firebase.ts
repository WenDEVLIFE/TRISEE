import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env["VITE_FIREBASE_API_KEY"] ?? "AIzaSyD2iEMxNnavxhH0KeazzgEPTMc3Y8kvOlM",
  authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "reclaimit-89017.firebaseapp.com",
  projectId: env["VITE_FIREBASE_PROJECT_ID"] ?? "reclaimit-89017",
  storageBucket: env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "reclaimit-89017.firebasestorage.app",
  messagingSenderId:
    env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "356842255584",
  appId: env["VITE_FIREBASE_APP_ID"] ?? "1:356842255584:web:575033be87c96e17708c85",
  measurementId: env["VITE_FIREBASE_MEASUREMENT_ID"] ?? "G-D423J943K0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
