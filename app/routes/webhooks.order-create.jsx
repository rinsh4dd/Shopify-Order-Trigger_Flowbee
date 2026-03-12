import { authenticate } from "../shopify.server";
import { getFlowbeeSettings } from "../firebase.server";
import { sendWhatsAppNotification } from "../flowbee.server";
import { logToFile } from "../utils/logger.server";

export async function action({ request }) {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`[WEBHOOK] Received ${topic} for ${shop} (Firebase Mode)`);

  // 1. Get Flowbee settings from Firebase Firestore
  // Logic: Use the actual shop from webhook, or fallback to dev shop if testing with CLI
  const settingsShop = shop === "shop.myshopify.com" ? "flowbee-dev.myshopify.com" : shop;
  const settings = await getFlowbeeSettings(settingsShop);

  if (!settings) {
    console.log(`[WEBHOOK] No Flowbee settings found in Firebase for ${shop}. Skipping.`);
    return new Response("ok");
  }

  // 2. Extract customer details and order info
  const customerName = payload.customer?.first_name || "Customer";
  const orderNumber = payload.name;
  const totalAmount = payload.total_price;

  // Extract products and quantity
  const productNames = payload.line_items?.map(item => item.title).join(", ") || "N/A";
  const totalQuantity = payload.line_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const recipientPhone = settings.flowbeeNotifyPhone;

  if (!recipientPhone) {
    console.log(`[WEBHOOK] No notification phone found in Firebase settings for ${shop}. Skipping.`);
    return new Response("ok");
  }

  // 3. Trigger WhatsApp notification
  const logData = {
    shop: settingsShop,
    customerName,
    orderNumber,
    productNames,
    totalQuantity,
    totalAmount,
    recipientPhone,
    timestamp: new Date().toISOString()
  };

  console.log(`[WEBHOOK] Order Details:`, logData);
  logToFile(logData, "orders.log");

  try {
    await sendWhatsAppNotification({
      settings,
      recipientPhone: recipientPhone,
      bodyValues: [
        customerName,    // {{1}} Customer
        orderNumber,     // {{2}} Order ID
        productNames,    // {{3}} Product
        totalQuantity,   // {{4}} Quantity
        totalAmount      // {{5}} Total
      ]
    });
  } catch (error) {
    console.error(`[WEBHOOK] Failed to send Firebase-based notification for ${orderNumber}:`, error.message);
  }

  return new Response("ok");
}
