import { saveCheckoutRecord, getCheckoutRecord } from "./checkout-notification.repository.server";
import { getFlowbeeSettings } from "../flowbee/flowbee-settings.service.server";
import { sendFlowbeeTemplateMessage } from "../flowbee/flowbee-api.server";

export async function processCheckoutWebhook({ shop, payload, topic }) {
  const checkoutId = payload.id || payload.cart_token;
  if (!checkoutId) return;

  const phone = payload.phone || payload.customer?.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
  if (!phone) {
    console.log(`[WEBHOOK] Checkout ${checkoutId} has no customer phone number. Skipping.`);
    return;
  }

  const normalizedPhone = String(phone).replace(/\D/g, "");

  const customerName = payload.customer?.first_name || "Customer";
  const checkoutUrl = payload.abandoned_checkout_url || "";
  const products = payload.line_items?.map(item => item.title).join(", ") || "N/A";
  const quantity = payload.line_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const totalPrice = payload.total_price || "0.00";

  console.log(`[WEBHOOK] Received checkout event: ${topic} for checkout ${checkoutId}`);

  // 1. Store/update checkout record
  const existing = await getCheckoutRecord(checkoutId);
  if (existing && existing.completed) {
    console.log(`[WEBHOOK] Checkout ${checkoutId} is already completed. Skipping.`);
    return;
  }

  await saveCheckoutRecord(checkoutId, {
    checkoutId,
    shop,
    phone: normalizedPhone,
    customerName,
    checkoutUrl,
    products,
    quantity,
    totalPrice,
    completed: false,
    notified: false
  });

  // 2. Schedule the notification (e.g. after 30 minutes)
  const delayMs = 10 * 1000; // 10 seconds for testing

  setTimeout(async () => {
    try {
      const freshCheckout = await getCheckoutRecord(checkoutId);
      if (!freshCheckout) return;

      if (!freshCheckout.completed && !freshCheckout.notified) {
        console.log(`[ABANDONED CHECKOUT] Checkout ${checkoutId} remains uncompleted. Sending WhatsApp recovery...`);
        
        const settings = await getFlowbeeSettings(shop);
        if (!settings || !settings.flowbeeTemplateAbandonedCart) {
          console.log(`[ABANDONED CHECKOUT] No abandoned cart template configured for ${shop}. Skipping.`);
          return;
        }

        // Send to customer phone!
        await sendFlowbeeTemplateMessage({
          settings,
          recipientPhone: freshCheckout.phone,
          bodyValues: [
            freshCheckout.customerName,
            String(freshCheckout.checkoutId),
            freshCheckout.products,
            String(freshCheckout.quantity),
            freshCheckout.totalPrice,
            freshCheckout.checkoutUrl
          ],
          templateId: settings.flowbeeTemplateAbandonedCart
        });

        // Mark as notified
        await saveCheckoutRecord(checkoutId, { notified: true });
      }
    } catch (err) {
      console.error(`[ABANDONED CHECKOUT] Failed to run scheduled checkout task for ${checkoutId}:`, err.message);
    }
  }, delayMs);
}
