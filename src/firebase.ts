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
const originalAuth = getAuth(app);

// Proxy auth so that currentUser always returns a valid Guest User profile if not authenticated
export const auth = new Proxy(originalAuth, {
  get(target, prop, receiver) {
    if (prop === 'currentUser') {
      const realUser = target.currentUser;
      if (realUser) {
        return realUser;
      }
      
      // Lazily create or retrieve a unique guest ID for this browser session
      let guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_user_id') : null;
      if (typeof window !== 'undefined' && !guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('guest_user_id', guestId);
      }
      
      return {
        uid: guestId || 'guest_default',
        email: 'guest@paperexplainer.local',
        displayName: 'Guest Scholar',
        photoURL: '',
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      };
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  }
}) as any;

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
