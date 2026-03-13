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

function getTemplateParameterNames(templateId) {
  return TEMPLATE_PARAMETER_NAMES[templateId] || TEMPLATE_PARAMETER_NAMES.default;
}

function buildTemplatePayload({ settings, recipientPhone, bodyValues }) {
  const registeredPhone = normalizePhoneNumber(settings.flowbeeRegisteredPhone);
  const targetRecipient = normalizePhoneNumber(recipientPhone);
  const parameterNames = getTemplateParameterNames(settings.flowbeeTemplateId);

  if (!Array.isArray(parameterNames)) {
    throw new Error(`No parameter mapping found for template ${settings.flowbeeTemplateId}`);
  }

  if (!Array.isArray(bodyValues)) {
    throw new Error("bodyValues must be an array");
  }

  return {
    company: settings.flowbeeCompany || FLOWBEE_COMPANY_FALLBACK,
    phoneno: registeredPhone,
    templatE_ID: settings.flowbeeTemplateId,
    section: [
      {
        section: "BODY",
        parameter: bodyValues.map((value, index) => ({
          type: "TEXT",
          name: parameterNames[index] || `param_${index + 1}`,
          value: String(value),
        })),
      },
    ],
    to: [{ number: targetRecipient }],
  };
}

async function parseJsonResponse(response) {
  const responseText = await response.text();
  console.log("[FLOWBEE] Raw Response:", responseText);

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error("[FLOWBEE] Failed to parse response as JSON:", responseText);
    throw new Error("Flowbee API returned a non-JSON response.");
  }
}

export async function sendFlowbeeTemplateMessage({ settings, recipientPhone, bodyValues }) {
  let payload;

  try {
    payload = buildTemplatePayload({ settings, recipientPhone, bodyValues });

    logToFile(
      {
        type: "FLOWBEE_REQUEST",
        templateId: settings.flowbeeTemplateId,
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

    console.log("[FLOWBEE] Notification sent successfully:", JSON.stringify(result));
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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      COMPANY: phone || "",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[FLOWBEE] Template fetch error:", JSON.stringify(result));
    throw new Error(result.message || "Failed to fetch templates");
  }

  return result.data || (Array.isArray(result) ? result : []);
}
