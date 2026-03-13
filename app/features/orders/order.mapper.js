export function mapShopifyOrderToNotificationDetails(payload) {
  const customerName = payload.customer?.first_name || "Customer";
  const customerId =
    payload.customer?.id ||
    payload.customer?.email ||
    payload.customer?.phone ||
    customerName;
  const orderNumber = String(payload.name || "").replace("#", "");
  const totalAmount = payload.total_price || "0";
  const productNames =
    payload.line_items?.map((item) => item.title)?.join(", ") || "N/A";
  const totalQuantity =
    payload.line_items?.reduce((quantity, item) => quantity + item.quantity, 0) || 0;

  return {
    customerId,
    customerName,
    orderNumber,
    totalAmount,
    productNames,
    totalQuantity,
  };
}
