import { authenticate } from "../shopify.server";
import { processOrderCreatedWebhook } from "../features/orders/order-notification.service.server";

export async function action({ request }) {
  const { shop, payload, topic } = await authenticate.webhook(request);
  await processOrderCreatedWebhook({ shop, payload, topic });

  return new Response("ok");
}
