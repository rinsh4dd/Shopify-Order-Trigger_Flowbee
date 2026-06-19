import { authenticate } from "../shopify.server";
import { processCheckoutWebhook } from "../features/orders/checkout-notification.service.server";

export async function action({ request }) {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    await processCheckoutWebhook({ shop, payload, topic });
    return new Response("ok");
  } catch (error) {
    console.error("[WEBHOOK] HMAC signature validation failed for checkout:", error.message);
    return new Response("Unauthorized", { status: 401 });
  }
}
