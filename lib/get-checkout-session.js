const Stripe = require("stripe");

async function getCheckoutSessionSummary(sessionId) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Missing session ID.");
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "payment_intent.latest_charge"],
  });

  if (session.payment_status !== "paid") {
    throw new Error("This order is not paid yet.");
  }

  const charge = session.payment_intent?.latest_charge;
  const receiptUrl = typeof charge === "object" ? charge.receipt_url : null;

  const lineItems = (session.line_items?.data || []).map((item) => ({
    name: item.description || item.price?.product?.name || "Item",
    quantity: item.quantity,
    amount: item.amount_total,
  }));

  const shipping = session.customer_details?.address;
  const shippingLabel = shipping
    ? [
        session.customer_details?.name,
        shipping.line1,
        shipping.line2,
        [shipping.city, shipping.state, shipping.postal_code].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  return {
    email: session.customer_details?.email || null,
    shippingLabel,
    amountTotal: session.amount_total,
    currency: session.currency || "usd",
    receiptUrl,
    lineItems,
  };
}

module.exports = {
  getCheckoutSessionSummary,
};
