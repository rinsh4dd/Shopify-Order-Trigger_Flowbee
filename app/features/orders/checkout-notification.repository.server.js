import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
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

export async function getRecentCheckouts(shop, limitCount = 5) {
  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where("shop", "==", shop)
    );
    const querySnapshot = await getDocs(q);
    const records = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== "last_debug_payload") {
        records.push({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return records
      .sort((a, b) => {
        const t1 = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const t2 = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return t2 - t1;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error(`[FIREBASE] Get recent checkouts error for ${shop}:`, error.message);
    return [];
  }
}
