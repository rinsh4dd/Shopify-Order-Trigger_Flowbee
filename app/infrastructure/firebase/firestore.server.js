import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseFallbackConfig = {
  apiKey: "AIzaSyCMiAtztVPErzHNe1NW_QhHHXiD25CkEqY",
  authDomain: "shopifynotifier-6cb51.firebaseapp.com",
  projectId: "shopifynotifier-6cb51",
  storageBucket: "shopifynotifier-6cb51.firebasestorage.app",
  messagingSenderId: "701961286690",
  appId: "1:701961286690:web:a62497eed24a340600067b",
  measurementId: "G-WV7X5RDDT4",
};

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length === Object.keys(config).length) {
    return firebaseFallbackConfig;
  }

  if (missingKeys.length > 0) {
    console.warn(
      `[FIREBASE] Partial environment config detected. Falling back to bundled config. Missing: ${missingKeys.join(", ")}`,
    );
    return firebaseFallbackConfig;
  }

  return config;
}

const firebaseConfig = {
  ...getFirebaseConfig(),
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firestore = getFirestore(firebaseApp);
