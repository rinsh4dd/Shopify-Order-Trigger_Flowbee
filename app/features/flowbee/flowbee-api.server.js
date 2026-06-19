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
  return (
    TEMPLATE_PARAMETER_NAMES[templateId] || TEMPLATE_PARAMETER_NAMES.default
  );
}

function buildTemplatePayload({
  settings,
  recipientPhone,
  bodyValues,
  templateId,
}) {
  const registeredPhone = normalizePhoneNumber(settings.flowbeeRegisteredPhone);
  const targetRecipient = normalizePhoneNumber(recipientPhone);
  const activeTemplateId = templateId || settings.flowbeeTemplateId;
  const parameterNames = getTemplateParameterNames(activeTemplateId);

  if (!Array.isArray(parameterNames)) {
    throw new Error(
      `No parameter mapping found for template ${activeTemplateId}`,
    );
  }

  if (!Array.isArray(bodyValues)) {
    throw new Error("bodyValues must be an array");
  }

  const defaultNames = TEMPLATE_PARAMETER_NAMES.default;

  // Map default parameter names to values by index
  const valueMap = {};
  defaultNames.forEach((name, index) => {
    valueMap[name] = bodyValues[index] !== undefined ? bodyValues[index] : "";
  });

  // Generate parameter objects matching the active template parameter names
  const parameters = parameterNames.map((name, index) => {
    const value = valueMap[name] !== undefined ? valueMap[name] : (bodyValues[index] !== undefined ? bodyValues[index] : "");
    return {
      type: "TEXT",
      name: name,
      value: String(value),
    };
  });

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
    payload = buildTemplatePayload({
      settings,
      recipientPhone,
      bodyValues,
      templateId,
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
