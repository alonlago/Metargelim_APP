import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBysVQkKlX4CkK8Sgm7bAq3jvKV5sQr5XU",
    authDomain: "metargelimelementaryschool.firebaseapp.com",
    projectId: "metargelimelementaryschool",
    storageBucket: "metargelimelementaryschool.firebasestorage.app",
    messagingSenderId: "260885991646",
    appId: "1:260885991646:web:8c55f291b9382c94a0b24f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);