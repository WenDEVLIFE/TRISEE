import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJ8S_cK-Pd59nTH2cdA1gMlFcO68bnl2w",
  authDomain: "trisee-one.firebaseapp.com",
  projectId: "trisee-one",
  storageBucket: "trisee-one.firebasestorage.app",
  messagingSenderId: "995524196062",
  appId: "1:995524196062:web:193a3f5a9b55ad2198744f",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);