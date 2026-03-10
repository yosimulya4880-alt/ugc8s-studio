import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4t70kPmV8zy8Rk0lNRZmyiQ5DO7StpvA",
  authDomain: "studio-2740779394-e22ec.firebaseapp.com",
  projectId: "studio-2740779394-e22ec",
  storageBucket: "studio-2740779394-e22ec.firebasestorage.app",
  messagingSenderId: "702621865024",
  appId: "1:702621865024:web:58d2a86d28a8eed5d17ba5"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
