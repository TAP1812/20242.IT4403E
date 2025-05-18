// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: "taskmanager-f1752.firebaseapp.com",
  projectId: "taskmanager-f1752",
  storageBucket: "taskmanager-f1752.firebasestorage.app",
  messagingSenderId: "677689607543",
  appId: "1:677689607543:web:2d3a932f4eca0a6752cd72"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);