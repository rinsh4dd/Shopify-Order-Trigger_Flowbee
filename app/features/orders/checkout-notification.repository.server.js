import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../infrastructure/firebase/firestore.server";

const COLLECTION_NAME = "checkouts";

export async function getCheckoutRecord(checkoutId) {
  try {
    const documentRef = doc(firestore, COLLECTION_NAME, String(checkoutId));
    const snapshot = await getDoc(documentRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error(`[FIREBASE] Get checkout error for ${checkoutId}:`, error.message);
    return null;
  }
}

export async function saveCheckoutRecord(checkoutId, data) {
  try {
    const documentRef = doc(firestore, COLLECTION_NAME, String(checkoutId));
    await setDoc(
      documentRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error(`[FIREBASE] Save checkout error for ${checkoutId}:`, error.message);
    throw error;
  }
}

export async function updateCheckoutRecord(checkoutId, data) {
  try {
    const documentRef = doc(firestore, COLLECTION_NAME, String(checkoutId));
    await updateDoc(documentRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error(`[FIREBASE] Update checkout error for ${checkoutId}:`, error.message);
    throw error;
  }
}
