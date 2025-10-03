import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service and storage service
const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Verifies the provided PIN against the one stored in Firestore.
 * @param pin The 6-digit PIN to verify.
 * @returns True if the PIN is correct, false otherwise.
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'config', 'auth');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure the PIN from Firestore is treated as a string for comparison
      const storedPin = String(data.pin);
      return storedPin === pin;
    } else {
      // If the document doesn't exist, log an error and deny access.
      console.error("PIN configuration document not found in Firestore at 'config/auth'.");
      return false;
    }
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return false;
  }
};

export { db, storage, app };
