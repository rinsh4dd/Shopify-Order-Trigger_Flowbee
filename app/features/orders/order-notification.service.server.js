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

export async function processOrderCreatedWebhook({ shop, topic, payload }) {
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
  const logData = {
    shop: settingsShop,
    ...orderDetails,
    recipientPhone: settings.flowbeeNotifyPhone,
    timestamp: new Date().toISOString(),
  };

  console.log("[WEBHOOK] Order Details:", logData);
  logToFile(logData, "orders.log");

  try {
    const result = await sendFlowbeeTemplateMessage({
      settings,
      recipientPhone: settings.flowbeeNotifyPhone,
      bodyValues: [
        orderDetails.customerId,
        orderDetails.orderNumber,
        orderDetails.productNames,
        orderDetails.totalQuantity,
        orderDetails.totalAmount,
      ],
    });

    logToFile(
      {
        type: "RESPONSE_SUCCESS",
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
        orderNumber: orderDetails.orderNumber,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      "orders.log",
    );

    return { ok: false, skipped: null, error };
  }
}
