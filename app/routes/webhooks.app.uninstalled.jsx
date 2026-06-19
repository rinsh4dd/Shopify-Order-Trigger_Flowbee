import { authenticate, sessionStorage } from "../shopify.server";
import { deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../infrastructure/firebase/firestore.server";
import { FLOWBEE_SETTINGS_COLLECTION } from "../features/flowbee/flowbee.constants";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    await sessionStorage.deleteSessions(sessions.map((s) => s.id));
  }

  try {
    const settingsDocRef = doc(firestore, FLOWBEE_SETTINGS_COLLECTION, shop);
    await deleteDoc(settingsDocRef);
    console.log(`[FIREBASE] Deleted flowbee settings for ${shop} on uninstall`);
  } catch (error) {
    console.error(`[FIREBASE] Error deleting flowbee settings for ${shop}:`, error.message);
  }

  return new Response();
};
