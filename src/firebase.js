import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAb9SyRsDmMLDDKDNJspALcK4dbIi-BJ98",
  authDomain: "e-tracker-a6f1f.firebaseapp.com",
  projectId: "e-tracker-a6f1f",
  storageBucket: "e-tracker-a6f1f.firebasestorage.app",
  messagingSenderId: "130909034505",
  appId: "1:130909034505:web:4705f3aa305f91010980d8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
