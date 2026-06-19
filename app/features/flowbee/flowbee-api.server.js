import {
  FLOWBEE_COMPANY_FALLBACK,
  FLOWBEE_LIST_TEMPLATES_URL,
  FLOWBEE_SEND_TEMPLATE_URL,
  TEMPLATE_PARAMETER_NAMES,
} from "./flowbee.constants";
import { logToFile } from "../../utils/logger.server";

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || "").replace(/\D/g, "");
}


function buildTemplatePayload({
  settings,
  recipientPhone,
  bodyValues,
  templateId,
  fetchedTemplates = [],
}) {
  const registeredPhone = normalizePhoneNumber(settings.flowbeeRegisteredPhone);
  const targetRecipient = normalizePhoneNumber(recipientPhone);
  const activeTemplateId = templateId || settings.flowbeeTemplateId;

  // Try to find the template in fetched list
  const matchedTemplate = fetchedTemplates.find(
    t => String(t.template_id || t.id) === String(activeTemplateId)
  );

  let parameters = [];

  if (matchedTemplate) {
    console.log(`[FLOWBEE] Found matched template ${activeTemplateId} dynamically.`);
    let bodyText = "";
    if (Array.isArray(matchedTemplate.components)) {
      const bodyComp = matchedTemplate.components.find(
        c => String(c.type).toUpperCase() === "BODY"
      );
      if (bodyComp && bodyComp.text) {
        bodyText = bodyComp.text;
      }
    }
    if (!bodyText) {
      bodyText =
        matchedTemplate.template_text ||
        matchedTemplate.body ||
        matchedTemplate.text ||
        matchedTemplate.template_body ||
        "";
    }

    const regex = /\{\{([^}]+)\}\}/g;
    const placeholders = [];
    let match;
    while ((match = regex.exec(bodyText)) !== null) {
      const name = match[1].trim();
      if (!placeholders.includes(name)) {
        placeholders.push(name);
      }
    }

    console.log(`[FLOWBEE] Parsed template placeholders:`, placeholders);

    parameters = placeholders.map((name, index) => {
      let value = "";
      
      // If placeholder name is numeric (e.g. {{1}}, {{2}})
      if (/^\d+$/.test(name)) {
        const valIdx = parseInt(name, 10) - 1;
        value = bodyValues[valIdx] !== undefined ? bodyValues[valIdx] : "";
      } else {
        // Find index of the placeholder name in TEMPLATE_PARAMETER_NAMES
        const matchedIdx = TEMPLATE_PARAMETER_NAMES.indexOf(name);
        if (matchedIdx !== -1) {
          value = bodyValues[matchedIdx] !== undefined ? bodyValues[matchedIdx] : "";
        } else {
          // Fall back to case/character insensitive matching or index position
          const lowerName = name.toLowerCase();
          const backupIdx = TEMPLATE_PARAMETER_NAMES.findIndex(
            n => n.toLowerCase() === lowerName || n.toLowerCase().replace(/_/g, "") === lowerName.replace(/_/g, "")
          );
          if (backupIdx !== -1) {
            value = bodyValues[backupIdx] !== undefined ? bodyValues[backupIdx] : "";
          } else {
            value = bodyValues[index] !== undefined ? bodyValues[index] : "";
          }
        }
      }

      return {
        type: "TEXT",
        name: name,
        value: String(value),
      };
    });
  } else {
    console.log(`[FLOWBEE] Template ${activeTemplateId} not found in fetched templates. Falling back to default parameter mapping.`);
    // Fallback: use default naming / sizing
    const fallbackNames = TEMPLATE_PARAMETER_NAMES;

    // Build values using the index
    parameters = fallbackNames.map((name, index) => {
      return {
        type: "TEXT",
        name: name,
        value: String(bodyValues[index] !== undefined ? bodyValues[index] : ""),
      };
    });
  }

  return {
    company: settings.flowbeeCompany || FLOWBEE_COMPANY_FALLBACK,
    phoneno: registeredPhone,
    templatE_ID: activeTemplateId,
    section: [
      {
        section: "BODY",
        parameter: parameters,
      },
    ],
    to: [{ number: targetRecipient }],
  };
}

async function parseJsonResponse(response) {
  const responseText = await response.text();
  console.log(
    `[FLOWBEE] Response Status: ${response.status} ${response.statusText}`,
  );
  console.log("[FLOWBEE] Raw Response:", responseText);

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error("[FLOWBEE] Failed to parse response as JSON:", responseText);
    throw new Error(
      `Flowbee API returned a non-JSON response (Status: ${response.status}).`,
    );
  }
}

export async function sendFlowbeeTemplateMessage({
  settings,
  recipientPhone,
  bodyValues,
  templateId,
}) {
  let payload;

  try {
    let fetchedTemplates = [];
    try {
      if (settings?.flowbeeApiKey) {
        fetchedTemplates = await fetchFlowbeeTemplates(
          settings.flowbeeApiKey,
          settings.flowbeeRegisteredPhone
        );
      }
    } catch (e) {
      console.error("[FLOWBEE] Failed to fetch templates at runtime, falling back:", e.message);
    }

    payload = buildTemplatePayload({
      settings,
      recipientPhone,
      bodyValues,
      templateId,
      fetchedTemplates,
    });

    logToFile(
      {
        type: "FLOWBEE_REQUEST",
        templateId: templateId || settings.flowbeeTemplateId,
        recipientPhone,
        bodyValues,
        payload,
        timestamp: new Date().toISOString(),
      },
      "orders.log",
    );

    console.log("[FLOWBEE] Final Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(FLOWBEE_SEND_TEMPLATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.flowbeeApiKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await parseJsonResponse(response);

    if (!response.ok) {
      console.error("[FLOWBEE] Error response:", JSON.stringify(result));
      throw new Error(result.message || "Failed to send WhatsApp notification");
    }

    console.log(
      "[FLOWBEE] Notification sent successfully:",
      JSON.stringify(result),
    );
    return result;
  } catch (error) {
    logToFile(
      {
        type: "FLOWBEE_EXCEPTION",
        templateId: settings?.flowbeeTemplateId,
        recipientPhone,
        bodyValues,
        payload,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      "orders.log",
    );
    throw error;
  }
}

export async function fetchFlowbeeTemplates(apiKey, phone) {
  console.log("[FLOWBEE] Fetching all templates for phone:", phone);

  const response = await fetch(FLOWBEE_LIST_TEMPLATES_URL, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    console.error("[FLOWBEE] Template fetch error:", JSON.stringify(result));
    throw new Error(result.message || "Failed to fetch templates");
  }

  return result.data || (Array.isArray(result) ? result : []);
}
