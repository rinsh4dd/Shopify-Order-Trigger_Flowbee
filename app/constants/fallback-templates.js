/**
 * Fallback WhatsApp message templates used when the Flowbee API
 * has not been synced yet or the synced list is empty.
 *
 * These mirror the Meta Business API template structure so the
 * preview drawer can render them identically to real templates.
 */
export const FALLBACK_TEMPLATES = [
  {
    template_id: "order_confirmation_v1",
    template_name: "order_confirmation",
    category: "UTILITY",
    status: "APPROVED",
    language: "en",
    parameter_format: "Positional",
    components: [
      { type: "HEADER", format: "TEXT", text: "Order Confirmed! 🎉" },
      {
        type: "BODY",
        text: "Hi {{1}}, thanks for shopping with us! Your order #{{2}} of {{3}} is confirmed. We will notify you when it ships.",
      },
      { type: "FOOTER", text: "Thank you for choosing Flowbee Shop." },
      {
        type: "BUTTONS",
        buttons: [
          { type: "URL", text: "View Order", url: "https://flowbee.io/orders" },
          { type: "QUICK_REPLY", text: "Support" },
        ],
      },
    ],
    samples: ["Rinshad", "FL-9921", "$120.00"],
  },
  {
    template_id: "payment_reminder_v2",
    template_name: "payment_reminder",
    category: "UTILITY",
    status: "PENDING",
    language: "en",
    parameter_format: "Positional",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, this is a friendly reminder that invoice {{2}} is due on {{3}}.",
      },
      { type: "FOOTER", text: "Ignore if already paid." },
      {
        type: "BUTTONS",
        buttons: [
          { type: "URL", text: "Pay Now", url: "https://flowbee.io/pay" },
        ],
      },
    ],
    samples: ["Jane", "INV-4402", "June 30"],
  },
  {
    template_id: "delivery_update_v1",
    template_name: "delivery_update",
    category: "UTILITY",
    status: "APPROVED",
    language: "en",
    parameter_format: "Named",
    components: [
      {
        type: "HEADER",
        format: "IMAGE",
        example: {
          header_handle: [
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
          ],
        },
      },
      {
        type: "BODY",
        text: "Good news, your order is out for delivery! The courier will arrive shortly. Please ensure someone is available at the shipping address.",
      },
      { type: "FOOTER", text: "Flowbee Delivery Service" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "URL", text: "Track Live Delivery", url: "https://flowbee.io/track" },
        ],
      },
    ],
    samples: [],
  },
  {
    template_id: "order_cancelled_v1",
    template_name: "order_cancelled",
    category: "UTILITY",
    status: "APPROVED",
    language: "en",
    parameter_format: "Positional",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, your order #{{2}} has been successfully cancelled. A refund of {{3}} has been initiated.",
      },
      { type: "FOOTER", text: "Refunds take 3-5 business days." },
      {
        type: "BUTTONS",
        buttons: [{ type: "QUICK_REPLY", text: "Contact Support" }],
      },
    ],
    samples: ["David", "FL-8890", "$45.00"],
  },
  {
    template_id: "abandoned_cart_v1",
    template_name: "abandoned_cart_recovery",
    category: "MARKETING",
    status: "APPROVED",
    language: "en",
    parameter_format: "Positional",
    components: [
      { type: "HEADER", format: "TEXT", text: "Did you forget something? 🛒" },
      {
        type: "BODY",
        text: "Hey {{1}}, we noticed you left some items in your cart. Grab them now and use code {{2}} for a 10% discount!",
      },
      { type: "FOOTER", text: "Offer valid for 48 hours" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "URL", text: "Checkout Now", url: "https://flowbee.io/cart" },
        ],
      },
    ],
    samples: ["Alex", "FLOW10"],
  },
];
