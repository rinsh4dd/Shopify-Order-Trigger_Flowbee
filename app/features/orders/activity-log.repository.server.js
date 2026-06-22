import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../../infrastructure/firebase/firestore.server";

const COLLECTION_NAME = "activity_logs";

/**
 * Save an activity log entry to Firestore.
 * @param {Object} data - Activity log data
 * @param {string} data.shop - Shop domain
 * @param {string} data.type - Event type: "order_created", "order_paid", "order_fulfilled", "order_cancelled", "checkout_recovery", "checkout_recovered"
 * @param {string} data.status - "success", "failed", "pending", "skipped"
 * @param {string} data.title - Human-readable title
 * @param {string} data.detail - Short detail line
 * @param {Object} [data.meta] - Optional metadata (orderNumber, phone, templateId, etc.)
 */
export async function saveActivityLog(data) {
  try {
    const logId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const documentRef = doc(firestore, COLLECTION_NAME, logId);
    await setDoc(documentRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`[ACTIVITY LOG] Saved activity: ${data.type} — ${data.title}`);
    return logId;
  } catch (error) {
    console.error(`[ACTIVITY LOG] Failed to save activity log:`, error.message);
    return null;
  }
}

/**
 * Get recent activity logs for a shop.
 * @param {string} shop - Shop domain
 * @param {number} [limitCount=10] - Max number of logs to fetch
 * @returns {Promise<Array>} Activity log entries sorted by most recent first
 */
export async function getRecentActivityLogs(shop, limitCount = 10) {
  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where("shop", "==", shop)
    );
    const querySnapshot = await getDocs(q);
    const records = [];
    querySnapshot.forEach((docSnap) => {
      records.push({ id: docSnap.id, ...docSnap.data() });
    });
    return records
      .sort((a, b) => {
        const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return t2 - t1;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error(`[ACTIVITY LOG] Get recent logs error for ${shop}:`, error.message);
    return [];
  }
}
