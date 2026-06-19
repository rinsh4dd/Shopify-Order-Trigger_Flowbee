import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);
    console.log(`Received GDPR webhook ${topic} for shop ${shop}`);
    
    // Flowbee does not store PII indefinitely on customer level without order contexts.
    // Return empty success.
    return new Response(JSON.stringify({ message: "No stored data found" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GDPR WEBHOOK] Authentication failed for customers/data_request:", error.message);
    return new Response("Unauthorized", { status: 401 });
  }
};
