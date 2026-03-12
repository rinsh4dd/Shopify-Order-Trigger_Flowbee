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

  // Ensure phone numbers are in correct format
  const cleanPhone = recipientPhone.replace(/\D/g, "");
  const registeredPhone = flowbeeRegisteredPhone.replace(/\D/g, "");

  const url = "https://flowb.io/flowbee/SendWhatsappTemplate";
  
  // Map bodyValues to the expected parameter structure
  // Based on index.js reference:
  // bodyValues[0] -> customer_name
  // bodyValues[1] -> order_id
  // bodyValues[2] -> product_name
  // bodyValues[3] -> product_quantity
  // bodyValues[4] -> order_total
  const paramNames = ["customer_name", "order_id", "product_name", "product_quantity", "order_total"];

  const payload = {
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
        number: cleanPhone
      }
    ]
  };

  console.log(`[FLOWBEE] Sending notification to ${cleanPhone} via ${url}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": flowbeeApiKey
      },
      body: JSON.stringify(payload)
    });

    // Check if the response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error("[FLOWBEE] Non-JSON response:", text);
      throw new Error("Flowbee API returned a non-JSON response. Check your API credentials and endpoint.");
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
