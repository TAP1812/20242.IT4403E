// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: "taskmanager-2da29.firebaseapp.com",
  projectId: "taskmanager-2da29",
  storageBucket: "taskmanager-2da29.firebasestorage.app",
  messagingSenderId: "542431321844",
  appId: "1:542431321844:web:0a96633a7a6467f806c8a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);