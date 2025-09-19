import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  // Add your Firebase config here
  // You'll need to replace these with your actual Firebase project credentials
  apiKey: "AIzaSyBDs4OChjOifEz8h2C6cUfM7O7uAcWifa0",
  authDomain: "lekizrm.firebaseapp.com",
  projectId: "lekizrm",
  storageBucket: "lekizrm.firebasestorage.app",
  messagingSenderId: "403371430194",
  appId: "1:403371430194:web:57362f1704480634b7472b",
  measurementId: "G-RK5MH0XKSH"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)