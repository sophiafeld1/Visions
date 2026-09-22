const Stripe = require("stripe");
const { summarizeCheckoutSession } = require("./order-summary");
const { maybeFinalizeCheckoutInventory } = require("./stripe-webhook-handlers");

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

  await maybeFinalizeCheckoutInventory(session);

  return summarizeCheckoutSession(session);
}

module.exports = {
  getCheckoutSessionSummary,
};
