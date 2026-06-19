import {
  saveCheckoutRecord,
  getCheckoutRecord,
} from "./checkout-notification.repository.server";
import { getFlowbeeSettings } from "../flowbee/flowbee-settings.service.server";
import { sendFlowbeeTemplateMessage } from "../flowbee/flowbee-api.server";

import { logToFile } from "../../utils/logger.server";

export async function processCheckoutWebhook({ shop, payload, topic }) {
  console.log(`[WEBHOOK] Received checkout event: ${topic} for shop: ${shop}`);
  logToFile(payload, "checkouts.log");

  try {
    await saveCheckoutRecord("last_debug_payload", { rawPayload: payload });
    console.log("[WEBHOOK] Saved last raw payload to Firestore checkouts/last_debug_payload for debugging.");
  } catch (err) {
    console.error("[WEBHOOK] Failed to save debug payload to Firestore:", err.message);
  }

  const checkoutId = payload.id || payload.cart_token;
  if (!checkoutId) {
    console.log("[WEBHOOK] No checkout ID or cart token found in payload.");
    return;
  }

  const phone = payload.phone || payload.customer?.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
  if (!phone) {
    console.log(`[WEBHOOK] Checkout ${checkoutId} has no customer phone number. Skipping notification.`);
    console.log("[DEBUG] Payload phone keys:", {
      directPhone: payload.phone,
      customerPhone: payload.customer?.phone,
      shippingPhone: payload.shipping_address?.phone,
      billingPhone: payload.billing_address?.phone,
      email: payload.email,
      shippingName: payload.shipping_address?.name
    });
    return;
  }

  const normalizedPhone = String(phone).replace(/\D/g, "");
  console.log(`[WEBHOOK] Checkout ${checkoutId} has phone: ${normalizedPhone}`);

  const customerName = payload.customer?.first_name || "Customer";
  const checkoutUrl = payload.abandoned_checkout_url || "";
  const products = payload.line_items?.map(item => item.title).join(", ") || "N/A";
  const quantity = payload.line_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const totalPrice = payload.total_price || "0.00";

  console.log(
    `[WEBHOOK] Received checkout event: ${topic} for checkout ${checkoutId}`,
  );

  // 1. Store/update checkout record
  const existing = await getCheckoutRecord(checkoutId);
  if (existing && existing.completed) {
    console.log(
      `[WEBHOOK] Checkout ${checkoutId} is already completed. Skipping.`,
    );
    return;
  }

  const settings = await getFlowbeeSettings(shop);
  const delaySeconds = parseInt(settings?.flowbeeAbandonedCartDelay || "1800", 10);
  const recoveryChainId = Date.now().toString();

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
    attemptsSent: 0,
    recoveryChainId,
  });

  // 2. Schedule the notification
  const delayMs = delaySeconds * 1000;
  console.log(
    `[WEBHOOK] Scheduled recovery chain ${recoveryChainId} for checkout ${checkoutId} in ${delaySeconds}s.`
  );

  setTimeout(() => {
    executeRecovery(checkoutId, shop, recoveryChainId);
  }, delayMs);
}

async function executeRecovery(checkoutId, shop, recoveryChainId) {
  try {
    const freshCheckout = await getCheckoutRecord(checkoutId);
    if (!freshCheckout) return;

    // Check if completed, or if this timeout was superseded by a newer one
    if (freshCheckout.completed) {
      console.log(`[ABANDONED CHECKOUT] Checkout ${checkoutId} is completed. Stopping recovery.`);
      return;
    }
    if (freshCheckout.recoveryChainId !== recoveryChainId) {
      console.log(`[ABANDONED CHECKOUT] Timeout chain for checkout ${checkoutId} is superseded. Exiting.`);
      return;
    }

    const settings = await getFlowbeeSettings(shop);
    if (!settings || !settings.flowbeeTemplateAbandonedCart) {
      console.log(`[ABANDONED CHECKOUT] No template configured for ${shop}. Skipping.`);
      return;
    }

    const maxAttempts = parseInt(settings.flowbeeAbandonedCartCount || "1", 10);
    const intervalSeconds = parseInt(settings.flowbeeAbandonedCartInterval || "86400", 10);
    const currentAttempts = freshCheckout.attemptsSent || 0;

    if (currentAttempts >= maxAttempts) {
      console.log(`[ABANDONED CHECKOUT] Max attempts (${maxAttempts}) reached for checkout ${checkoutId}.`);
      return;
    }

    console.log(
      `[ABANDONED CHECKOUT] Sending recovery message (Attempt ${currentAttempts + 1}/${maxAttempts}) for checkout ${checkoutId}...`
    );

    const templateId = settings.flowbeeTemplateAbandonedCart;
    const bodyValues = [
      freshCheckout.customerName,
      String(freshCheckout.checkoutId),
      freshCheckout.products,
      String(freshCheckout.quantity),
      freshCheckout.totalPrice,
      freshCheckout.checkoutUrl,
    ];

    // Send to customer phone!
    await sendFlowbeeTemplateMessage({
      settings,
      recipientPhone: freshCheckout.phone,
      bodyValues,
      templateId,
    });

    const newAttempts = currentAttempts + 1;
    // Mark as notified and update attemptsSent
    await saveCheckoutRecord(checkoutId, {
      attemptsSent: newAttempts,
      notified: true,
    });

    if (newAttempts < maxAttempts) {
      const intervalMs = intervalSeconds * 1000;
      console.log(`[ABANDONED CHECKOUT] Scheduling next recovery attempt for ${checkoutId} in ${intervalSeconds}s.`);
      setTimeout(() => {
        executeRecovery(checkoutId, shop, recoveryChainId);
      }, intervalMs);
    }
  } catch (err) {
    console.error(
      `[ABANDONED CHECKOUT] Failed to run scheduled checkout task for ${checkoutId}:`,
      err.message,
    );
  }
}
