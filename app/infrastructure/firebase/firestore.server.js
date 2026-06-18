import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

  if (missingKeys.length > 0) {
    throw new Error(
      `[FIREBASE] Missing required environment variables: ${missingKeys.join(", ")}. ` +
      "Please set them in your .env file or hosting environment."
    );
  }

  return config;
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());

export const firestore = getFirestore(firebaseApp);
