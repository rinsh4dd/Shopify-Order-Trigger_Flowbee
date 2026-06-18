export function buildFlowbeeSettingsInput({ shop, formData }) {
  return {
    shop,
    flowbeeApiKey: formData.get("flowbeeApiKey") || "",
    flowbeeCompany: formData.get("flowbeeCompany") || "",
    flowbeeRegisteredPhone: formData.get("flowbeeRegisteredPhone") || "",
    flowbeeNotifyPhone: formData.get("flowbeeNotifyPhone") || "",
    flowbeeTemplateId: formData.get("flowbeeTemplateId") || "",
    flowbeeTemplateOrderCreated: formData.get("flowbeeTemplateOrderCreated") || "",
    flowbeeTemplateOrderPaid: formData.get("flowbeeTemplateOrderPaid") || "",
    flowbeeTemplateOrderFulfilled: formData.get("flowbeeTemplateOrderFulfilled") || "",
    flowbeeTemplateOrderCancelled: formData.get("flowbeeTemplateOrderCancelled") || "",
    flowbeeTemplateAbandonedCart: formData.get("flowbeeTemplateAbandonedCart") || "",
  };
}
