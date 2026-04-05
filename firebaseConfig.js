import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAJ8S_cK-Pd59nTH2cdA1gMlFcO68bnl2w",
  authDomain: "trisee-one.firebaseapp.com",
  projectId: "trisee-one",
  storageBucket: "trisee-one.firebasestorage.app",
  messagingSenderId: "995524196062",
  appId: "1:995524196062:web:193a3f5a9b55ad2198744f",
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

export { auth, db, storage };