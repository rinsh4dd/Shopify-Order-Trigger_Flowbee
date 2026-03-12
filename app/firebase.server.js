import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMiAtztVPErzHNe1NW_QhHHXiD25CkEqY",
  authDomain: "shopifynotifier-6cb51.firebaseapp.com",
  projectId: "shopifynotifier-6cb51",
  storageBucket: "shopifynotifier-6cb51.firebasestorage.app",
  messagingSenderId: "701961286690",
  appId: "1:701961286690:web:a62497eed24a340600067b",
  measurementId: "G-WV7X5RDDT4"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Get Flowbee settings for a specific shop from Firestore
 * @param {string} shop
 * @returns {Promise<object|null>}
 */
export async function getFlowbeeSettings(shop) {
  try {
    const docRef = doc(db, "flowbeeSettings", shop);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error(`[FIREBASE] Get error for ${shop}:`, error.message);
    return null;
  }
}

/**
 * Save Flowbee settings for a specific shop to Firestore
 * @param {string} shop
 * @param {object} data
 * @returns {Promise<boolean>}
 */
export async function saveFlowbeeSettings(shop, data) {
  try {
    const docRef = doc(db, "flowbeeSettings", shop);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error(`[FIREBASE] Save error for ${shop}:`, error.message);
    throw error;
  }
}

export default db;
