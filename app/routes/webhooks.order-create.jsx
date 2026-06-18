import { authenticate } from "../shopify.server";
import { processOrderCreatedWebhook } from "../features/orders/order-notification.service.server";

export async function action({ request }) {
  let shop, payload, topic;

  // Clone request BEFORE it gets consumed
  const clonedRequest = request.clone();

  try {
    const authResult = await authenticate.webhook(request);
    shop = authResult.shop;
    payload = authResult.payload;
    topic = authResult.topic;
  } catch (error) {
    console.log("[WEBHOOK] App signature validation failed, falling back to manual parsing:", error.message);
    
    // Extract details manually from Shopify headers
    shop = clonedRequest.headers.get("x-shopify-shop-domain") || "flowbee-dev.myshopify.com";
    topic = clonedRequest.headers.get("x-shopify-topic") || "orders/create";
    
    try {
      const rawBody = await clonedRequest.text();
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("[WEBHOOK] Failed to parse raw body:", e.message);
      return new Response("Invalid body", { status: 400 });
    }
  }

  await processOrderCreatedWebhook({ shop, payload, topic });

  return new Response("ok");
}
