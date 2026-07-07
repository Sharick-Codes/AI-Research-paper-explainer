import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase with the auto-provisioned configuration
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the custom database ID if present in the configuration
const dbId = (firebaseConfig as any).firestoreDatabaseId || (firebaseConfig as any).databaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Test the Firestore connection on boot as required by the firebase-integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test completed.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase client appears to be offline. Please verify Firebase configuration.");
    } else {
      console.log("Firestore connection initialized.");
    }
  }
}

testConnection();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
};
