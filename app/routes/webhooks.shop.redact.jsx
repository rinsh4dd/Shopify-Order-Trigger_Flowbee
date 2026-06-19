import { authenticate } from "../shopify.server";
import { deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../infrastructure/firebase/firestore.server";
import { FLOWBEE_SETTINGS_COLLECTION } from "../features/flowbee/flowbee.constants";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);
    console.log(`Received GDPR webhook ${topic} for shop ${shop}`);
    
    try {
      const settingsDocRef = doc(firestore, FLOWBEE_SETTINGS_COLLECTION, shop);
      await deleteDoc(settingsDocRef);
      console.log(`[FIREBASE] Deleted flowbee settings for ${shop} on shop/redact GDPR webhook`);
    } catch (error) {
      console.error(`[FIREBASE] Error deleting flowbee settings for ${shop} in shop/redact:`, error.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GDPR WEBHOOK] Authentication failed for shop/redact:", error.message);
    return new Response("Unauthorized", { status: 401 });
  }
};
