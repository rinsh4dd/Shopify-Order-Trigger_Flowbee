import { Session } from "@shopify/shopify-api";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const SESSIONS_COLLECTION = "shopifySessions";

/**
 * Custom Firestore session storage for Shopify App.
 * Implements the SessionStorage interface from @shopify/shopify-api.
 * Sessions are stored in the `shopifySessions` Firestore collection.
 */
export class FirestoreSessionStorage {
  constructor(firestoreInstance) {
    this.db = firestoreInstance;
  }

  async storeSession(session) {
    try {
      const docRef = doc(this.db, SESSIONS_COLLECTION, session.id);
      const sessionData = Object.fromEntries(session.toPropertyArray());

      await setDoc(docRef, {
        ...sessionData,
        _updatedAt: serverTimestamp(),
      });

      console.log(`[FIRESTORE SESSION] Stored session: ${session.id}`);
      return true;
    } catch (error) {
      console.error("[FIRESTORE SESSION] storeSession error:", error.message);
      return false;
    }
  }

  async loadSession(id) {
    try {
      const docRef = doc(this.db, SESSIONS_COLLECTION, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.log(`[FIRESTORE SESSION] Session not found: ${id}`);
        return undefined;
      }

      const data = snapshot.data();
      const sessionData = Object.entries(data).filter(([key]) => key !== "_updatedAt");
      return Session.fromPropertyArray(sessionData);
    } catch (error) {
      console.error("[FIRESTORE SESSION] loadSession error:", error.message);
      return undefined;
    }
  }

  async deleteSession(id) {
    try {
      const docRef = doc(this.db, SESSIONS_COLLECTION, id);
      await deleteDoc(docRef);
      console.log(`[FIRESTORE SESSION] Deleted session: ${id}`);
      return true;
    } catch (error) {
      console.error("[FIRESTORE SESSION] deleteSession error:", error.message);
      return false;
    }
  }

  async deleteSessions(ids) {
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(this.db, SESSIONS_COLLECTION, id)))
      );
      console.log(`[FIRESTORE SESSION] Deleted ${ids.length} sessions`);
      return true;
    } catch (error) {
      console.error("[FIRESTORE SESSION] deleteSessions error:", error.message);
      return false;
    }
  }

  async findSessionsByShop(shop) {
    try {
      const colRef = collection(this.db, SESSIONS_COLLECTION);
      const q = query(colRef, where("shop", "==", shop));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const sessionData = Object.entries(data).filter(([key]) => key !== "_updatedAt");
        return Session.fromPropertyArray(sessionData);
      });
    } catch (error) {
      console.error("[FIRESTORE SESSION] findSessionsByShop error:", error.message);
      return [];
    }
  }
}
