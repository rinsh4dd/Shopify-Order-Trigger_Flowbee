import { sendFlowbeeTemplateMessage } from "../flowbee/flowbee-api.server";
import { getFlowbeeSettings } from "../flowbee/flowbee-settings.service.server";
import {
  FLOWBEE_DEV_STORE,
  SHOPIFY_CLI_WEBHOOK_STORE,
} from "../flowbee/flowbee.constants";
import { mapShopifyOrderToNotificationDetails } from "./order.mapper";
import { logToFile } from "../../utils/logger.server";

function resolveSettingsShop(shop) {
  return shop === SHOPIFY_CLI_WEBHOOK_STORE ? FLOWBEE_DEV_STORE : shop;
}

export async function processOrderWebhook({ shop, topic, payload }) {
  const settingsShop = resolveSettingsShop(shop);
  const settings = await getFlowbeeSettings(settingsShop);

  console.log(`[WEBHOOK] Received ${topic} for ${shop} (Firebase Mode)`);

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

  if (topic === "orders/create") {
    templateId = settings.flowbeeTemplateOrderCreated || settings.flowbeeTemplateId;
    bodyValues = [
      orderDetails.customerId,
      orderDetails.orderNumber,
      orderDetails.productNames,
      orderDetails.totalQuantity,
      orderDetails.totalAmount,
    ];
  } else if (topic === "orders/paid") {
    templateId = settings.flowbeeTemplateOrderPaid;
    bodyValues = [
      orderDetails.customerId,
      orderDetails.orderNumber,
      orderDetails.totalAmount,
    ];
  } else if (topic === "orders/fulfilled") {
    templateId = settings.flowbeeTemplateOrderFulfilled;
    bodyValues = [
      orderDetails.customerId,
      orderDetails.orderNumber,
      orderDetails.productNames,
      orderDetails.trackingNumber,
    ];
  } else if (topic === "orders/cancelled") {
    templateId = settings.flowbeeTemplateOrderCancelled;
    bodyValues = [
      orderDetails.customerId,
      orderDetails.orderNumber,
      orderDetails.totalAmount,
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

export async function processOrderCreatedWebhook({ shop, topic, payload }) {
  return processOrderWebhook({ shop, topic, payload });
}
