import { authenticate } from "../shopify.server";
import { processOrderCreatedWebhook } from "../features/orders/order-notification.service.server";

export async function action({ request }) {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);
    const webhookId = request.headers.get("x-shopify-webhook-id") || "";

    await processOrderCreatedWebhook({ shop, payload, topic, webhookId });
    return new Response("ok");
  } catch (error) {
    console.error("[WEBHOOK] HMAC signature validation failed for orders/create:", error.message);
    return new Response("Unauthorized", { status: 401 });
  }
}
