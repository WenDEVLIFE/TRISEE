import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD2iEMxXnavxhH0KeazzgEPTMc3Y8kvOlM",
  authDomain: "reclaimit-89017.firebaseapp.com",
  projectId: "reclaimit-89017",
  storageBucket: "reclaimit-89017.firebasestorage.app",
  messagingSenderId: "356842255584",
  appId: "1:356842255584:web:575033be87c96e17708c85",
  measurementId: "G-D423J943K0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** @type {import("firebase/auth").Auth} */
let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
