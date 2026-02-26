
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRcd_L-6wxhMqZMf2HnClCHwk1XgqNih0",
  authDomain: "sd-budget-simulator-73816746.firebaseapp.com",
  projectId: "sd-budget-simulator-73816746",
  storageBucket: "sd-budget-simulator-73816746.appspot.com",
  messagingSenderId: "695745414882",
  appId: "1:695745414882:web:36b90857c53a9fb21f00bb"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
