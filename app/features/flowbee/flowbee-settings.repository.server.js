import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../infrastructure/firebase/firestore.server";
import { FLOWBEE_SETTINGS_COLLECTION } from "./flowbee.constants";

export async function getFlowbeeSettingsRecord(shop) {
  try {
    const documentRef = doc(firestore, FLOWBEE_SETTINGS_COLLECTION, shop);
    const snapshot = await getDoc(documentRef);

    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error(`[FIREBASE] Get error for ${shop}:`, error.message);
    return null;
  }
}

export async function saveFlowbeeSettingsRecord(shop, data) {
  try {
    const documentRef = doc(firestore, FLOWBEE_SETTINGS_COLLECTION, shop);

    await setDoc(
      documentRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error(`[FIREBASE] Save error for ${shop}:`, error.message);
    throw error;
  }
}
