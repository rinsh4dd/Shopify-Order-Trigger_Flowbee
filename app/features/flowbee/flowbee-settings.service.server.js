import { fetchFlowbeeTemplates } from "./flowbee-api.server";
import {
  getFlowbeeSettingsRecord,
  saveFlowbeeSettingsRecord,
} from "./flowbee-settings.repository.server";
import { buildFlowbeeSettingsInput } from "./flowbee-settings.mapper";

export async function getFlowbeeSettings(shop) {
  return getFlowbeeSettingsRecord(shop);
}

export async function saveFlowbeeSettings(shop, data) {
  await saveFlowbeeSettingsRecord(shop, data);
  return data;
}

export async function getFlowbeeTemplates({ apiKey, phone }) {
  return fetchFlowbeeTemplates(apiKey, phone);
}

export function createFlowbeeSettingsInput({ shop, formData }) {
  return buildFlowbeeSettingsInput({ shop, formData });
}
