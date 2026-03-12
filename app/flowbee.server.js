/**
 * Sends a WhatsApp notification via Flowbee API.
 * 
 * @param {Object} params - The notification parameters.
 * @param {Object} params.settings - Flowbee settings (apiKey, companyId, registeredPhone, templateId).
 * @param {string} params.recipientPhone - The customer's phone number.
 * @param {Array} params.bodyValues - Values to populate in the WhatsApp template body.
 */
export async function sendWhatsAppNotification({ settings, recipientPhone, bodyValues }) {
  const { flowbeeApiKey, flowbeeRegisteredPhone, flowbeeTemplateId } = settings;

  // Ensure phone numbers are cleaned of spaces/special chars but keep prefix if present
  const registeredPhone = flowbeeRegisteredPhone.replace(/\D/g, "");
  const targetRecipient = recipientPhone.replace(/\D/g, "");

  const url = "https://flowb.io/flowbee/SendWhatsappTemplate";
  
  // Map bodyValues to the expected parameter structure based on the template ID
  let paramNames;
  if (flowbeeTemplateId === "1503347681154835") {
    // Shopify Template Params
    paramNames = ["customer_id", "order_id", "product", "quantity", "total"];
  } else {
    // Default / WooCommerce Template Params (1637339700628261)
    paramNames = ["customer_name", "order_id", "product_name", "product_quantity", "order_total"];
  }

  const payload = {
    company: settings.flowbeeCompany || "flowbee.io",
    phoneno: registeredPhone,
    templatE_ID: flowbeeTemplateId,
    section: [
      {
        section: "BODY",
        parameter: bodyValues.map((value, index) => ({
          type: "TEXT",
          name: paramNames[index] || `param_${index + 1}`,
          value: String(value)
        }))
      }
    ],
    to: [
      {
        number: targetRecipient
      }
    ]
  };

  console.log(`[FLOWBEE] Using Settings:`, {
    registeredPhone,
    templateId: flowbeeTemplateId,
    recipient: targetRecipient
  });
  console.log(`[FLOWBEE] Final Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": flowbeeApiKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("[FLOWBEE] Raw Response:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("[FLOWBEE] Failed to parse response as JSON:", responseText);
      throw new Error("Flowbee API returned a non-JSON response.");
    }

    if (!response.ok) {
      console.error("[FLOWBEE] Error response:", JSON.stringify(result));
      throw new Error(result.message || "Failed to send WhatsApp notification");
    }

    console.log("[FLOWBEE] Notification sent successfully:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[FLOWBEE] API Error:", error.message);
    throw error;
  }
}

/**
 * Fetches all available WhatsApp templates from Flowbee.
 * 
 * @param {string} apiKey - The Flowbee API Key.
 * @param {string} phone - The registered phone number (used as COMPANY).
 * @returns {Promise<Array>} - List of templates.
 */
export async function getAllFlowbeeTemplates(apiKey, phone) {
  // Use the URL provided by the user
  const url = "https://flowb.io/flowbee/GetAllTemplate";
  
  console.log("[FLOWBEE] Fetching all templates for phone:", phone);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        COMPANY: phone || ""
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[FLOWBEE] Template fetch error:", JSON.stringify(result));
      throw new Error(result.message || "Failed to fetch templates");
    }

    // Returning the result data
    // Based on user screenshot, it might contain a list of objects with template names and IDs
    return result.data || (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error("[FLOWBEE] Template Fetch API Error:", error.message);
    throw error;
  }
}
