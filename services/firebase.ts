import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

export { db, storage };
