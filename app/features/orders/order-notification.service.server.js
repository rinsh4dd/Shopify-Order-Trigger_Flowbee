import { sendFlowbeeTemplateMessage } from "../flowbee/flowbee-api.server";
import { getFlowbeeSettings } from "../flowbee/flowbee-settings.service.server";
import {
  FLOWBEE_DEV_STORE,
  SHOPIFY_CLI_WEBHOOK_STORE,
} from "../flowbee/flowbee.constants";
import { mapShopifyOrderToNotificationDetails } from "./order.mapper";
import { logToFile } from "../../utils/logger.server";
import { saveCheckoutRecord } from "./checkout-notification.repository.server";

const processedWebhooks = new Set();
setInterval(() => {
  processedWebhooks.clear();
}, 10 * 60 * 1000);

function resolveSettingsShop(shop) {
  return shop === SHOPIFY_CLI_WEBHOOK_STORE ? FLOWBEE_DEV_STORE : shop;
}

export async function processOrderWebhook({ shop, topic, payload, webhookId }) {
  if (webhookId) {
    if (processedWebhooks.has(webhookId)) {
      console.log(`[WEBHOOK] Duplicate webhook detected: ${webhookId}. Skipping.`);
      return { ok: true, skipped: "duplicate" };
    }
    processedWebhooks.add(webhookId);
  }

  const normalizedTopic = (topic || "").toUpperCase().replace("/", "_");

  // Prevent double messaging: if an order is created and already paid, orders/paid will handle it.
  if (normalizedTopic === "ORDERS_CREATE" && payload.financial_status === "paid") {
    console.log(`[WEBHOOK] Order ${payload.name} is already paid. Skipping orders/create notification.`);
    return { ok: true, skipped: "already_paid" };
  }

  const settingsShop = resolveSettingsShop(shop);
  const settings = await getFlowbeeSettings(settingsShop);

  console.log(`[WEBHOOK] Received ${topic} for ${shop} (Firebase Mode)`);

  const checkoutId = payload.checkout_id || payload.cart_token;
  if (checkoutId) {
    try {
      await saveCheckoutRecord(checkoutId, { completed: true });
      console.log(`[WEBHOOK] Marked checkout ${checkoutId} as completed.`);
    } catch (e) {
      console.error(`[WEBHOOK] Failed to mark checkout ${checkoutId} as completed:`, e.message);
    }
  }

  if (!settings) {
    console.log(`[WEBHOOK] No Flowbee settings found in Firebase for ${shop}. Skipping.`);
    return { ok: true, skipped: "missing_settings" };
  }

  if (!settings.flowbeeNotifyPhone) {
    console.log(`[WEBHOOK] No notification phone found in Firebase settings for ${shop}. Skipping.`);
    return { ok: true, skipped: "missing_recipient_phone" };
  }

  const orderDetails = mapShopifyOrderToNotificationDetails(payload);
  
  let templateId = "";
  let bodyValues = [];

  const customerNameVal = orderDetails.customerName || "Customer";
  const orderNoVal = orderDetails.orderNumber || "N/A";
  const productsVal = orderDetails.productNames || "N/A";
  const qtyVal = String(orderDetails.totalQuantity || 0);
  const totalVal = orderDetails.totalAmount || "0.00";

  if (normalizedTopic === "ORDERS_CREATE") {
    templateId = settings.flowbeeTemplateOrderCreated || settings.flowbeeTemplateId;
    bodyValues = [
      customerNameVal,
      orderNoVal,
      productsVal,
      qtyVal,
      totalVal,
      "Created"
    ];
  } else if (normalizedTopic === "ORDERS_PAID") {
    templateId = settings.flowbeeTemplateOrderPaid;
    bodyValues = [
      customerNameVal,
      orderNoVal,
      productsVal,
      qtyVal,
      totalVal,
      "Paid"
    ];
  } else if (normalizedTopic === "ORDERS_FULFILLED") {
    templateId = settings.flowbeeTemplateOrderFulfilled;
    bodyValues = [
      customerNameVal,
      orderNoVal,
      productsVal,
      qtyVal,
      totalVal,
      "Fulfilled"
    ];
  } else if (normalizedTopic === "ORDERS_CANCELLED") {
    templateId = settings.flowbeeTemplateOrderCancelled;
    bodyValues = [
      customerNameVal,
      orderNoVal,
      productsVal,
      qtyVal,
      totalVal,
      "Cancelled"
    ];
  } else {
    console.log(`[WEBHOOK] Topic ${topic} not handled. Skipping.`);
    return { ok: true, skipped: "unhandled_topic" };
  }

  if (!templateId) {
    console.log(`[WEBHOOK] No template configured in Firebase for topic ${topic}. Skipping.`);
    return { ok: true, skipped: "missing_template_id" };
  }

  const logData = {
    shop: settingsShop,
    topic,
    templateId,
    ...orderDetails,
    recipientPhone: settings.flowbeeNotifyPhone,
    timestamp: new Date().toISOString(),
  };

  console.log("[WEBHOOK] Order Event Details:", logData);
  logToFile(logData, "orders.log");

  try {
    const result = await sendFlowbeeTemplateMessage({
      settings,
      recipientPhone: settings.flowbeeNotifyPhone,
      bodyValues,
      templateId,
    });

    logToFile(
      {
        type: "RESPONSE_SUCCESS",
        topic,
        templateId,
        orderNumber: orderDetails.orderNumber,
        response: result,
        timestamp: new Date().toISOString(),
      },
      "orders.log",
    );

    return { ok: true, skipped: null, result };
  } catch (error) {
    console.error(
      `[WEBHOOK] Failed to send Firebase-based notification for ${orderDetails.orderNumber}:`,
      error.message,
    );

    logToFile(
      {
        type: "RESPONSE_ERROR",
        topic,
        templateId,
        orderNumber: orderDetails.orderNumber,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      "orders.log",
    );

    return { ok: false, skipped: null, error };
  }
}

export async function processOrderCreatedWebhook({ shop, topic, payload, webhookId }) {
  return processOrderWebhook({ shop, topic, payload, webhookId });
}
