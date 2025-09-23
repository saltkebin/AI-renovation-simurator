import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBY8v33wDi-NWolGNzqUemRO3zH8r7q2Hk",
  authDomain: "airenovation2.firebaseapp.com",
  projectId: "airenovation2",
  storageBucket: "airenovation2.firebasestorage.app",
  messagingSenderId: "864979476179",
  appId: "1:864979476179:web:68161effff80e56a45fe26"
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

export { db, storage };
