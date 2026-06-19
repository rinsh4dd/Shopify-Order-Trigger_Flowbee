import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);
    console.log(`Received GDPR webhook ${topic} for shop ${shop}`);
    
    // Perform any redact action if needed. 
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GDPR WEBHOOK] Authentication failed for customers/redact:", error.message);
    return new Response("Unauthorized", { status: 401 });
  }
};
