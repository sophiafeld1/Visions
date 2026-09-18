function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function buildShippingLabel(session) {
  const shippingDetails =
    session.shipping_details || session.collected_information?.shipping_details;
  const shippingAddress = shippingDetails?.address || session.customer_details?.address;
  const shippingName = shippingDetails?.name || session.customer_details?.name;

  if (!shippingAddress) {
    return null;
  }

  return [
    shippingName,
    shippingAddress.line1,
    shippingAddress.line2,
    [shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
      .filter(Boolean)
      .join(", "),
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join("\n");
}

function summarizeCheckoutSession(session) {
  const charge = session.payment_intent?.latest_charge;
  const receiptUrl = typeof charge === "object" ? charge.receipt_url : null;
  const currency = session.currency || "usd";

  const lineItems = (session.line_items?.data || []).map((item) => ({
    name: item.description || item.price?.product?.name || "Item",
    quantity: item.quantity,
    amount: item.amount_total,
  }));

  const shippingLabel = buildShippingLabel(session);
  const customerEmail = session.customer_details?.email || null;
  const totalLabel = formatMoney(session.amount_total, currency);

  const itemLines = lineItems.map(
    (item) =>
      `- ${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}: ${formatMoney(item.amount, currency)}`
  );

  const textBody = [
    "New Visions Studio order",
    "",
    `Total: ${totalLabel}`,
    customerEmail ? `Customer: ${customerEmail}` : null,
    "",
    "Items:",
    ...itemLines,
    shippingLabel ? `\nShip to:\n${shippingLabel}` : null,
    receiptUrl ? `\nStripe receipt: ${receiptUrl}` : null,
    `\nDashboard: https://dashboard.stripe.com/payments`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlBody = `
    <h2>New Visions Studio order</h2>
    <p><strong>Total:</strong> ${totalLabel}</p>
    ${customerEmail ? `<p><strong>Customer:</strong> ${customerEmail}</p>` : ""}
    <h3>Items</h3>
    <ul>
      ${lineItems
        .map(
          (item) =>
            `<li>${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""} — ${formatMoney(item.amount, currency)}</li>`
        )
        .join("")}
    </ul>
    ${
      shippingLabel
        ? `<h3>Ship to</h3><pre style="font-family:inherit;white-space:pre-wrap">${shippingLabel}</pre>`
        : ""
    }
    ${receiptUrl ? `<p><a href="${receiptUrl}">View Stripe receipt</a></p>` : ""}
    <p><a href="https://dashboard.stripe.com/payments">Open Stripe dashboard</a></p>
  `.trim();

  return {
    sessionId: session.id,
    email: customerEmail,
    shippingLabel,
    amountTotal: session.amount_total,
    currency,
    receiptUrl,
    lineItems,
    totalLabel,
    textBody,
    htmlBody,
  };
}

module.exports = {
  buildShippingLabel,
  formatMoney,
  summarizeCheckoutSession,
};
