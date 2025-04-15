// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBE9Ff4WO8kL32xnsZ2gJV8kD96VOCL6N0",
  authDomain: "wordcat-8db06.firebaseapp.com",
  projectId: "wordcat-8db06",
  storageBucket: "wordcat-8db06.appspot.com",
  messagingSenderId: "508775730700",
  appId: "1:508775730700:web:1953b0e6e02cf228532829",
  measurementId: "G-F10NN0FTC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };