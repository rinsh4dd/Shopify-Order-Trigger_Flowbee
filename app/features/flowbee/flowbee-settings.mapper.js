export function buildFlowbeeSettingsInput({ shop, formData }) {
  return {
    shop,
    flowbeeApiKey: formData.get("flowbeeApiKey") || "",
    flowbeeCompany: formData.get("flowbeeCompany") || "",
    flowbeeRegisteredPhone: formData.get("flowbeeRegisteredPhone") || "",
    flowbeeNotifyPhone: formData.get("flowbeeNotifyPhone") || "",
    flowbeeTemplateId: formData.get("flowbeeTemplateId") || "",
  };
}
