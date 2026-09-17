const Stripe = require("stripe");
const { parseCartMetadata } = require("./cart-metadata");
const { releaseCheckoutSession } = require("./inventory-store");

async function handleStripeWebhookEvent(event) {
  const session = event.data.object;

  switch (event.type) {
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await maybeReleaseCheckoutInventory(session);
      break;
    default:
      break;
  }
}

async function maybeReleaseCheckoutInventory(session) {
  if (!session?.metadata?.inventory_reserved) {
    return;
  }

  if (session.payment_status === "paid") {
    return;
  }

  const items = parseCartMetadata(session.metadata.cart);
  await releaseCheckoutSession(session.id, items);
}

async function releaseCheckoutSessionById(sessionId) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  await maybeReleaseCheckoutInventory(session);
  return session;
}

module.exports = {
  handleStripeWebhookEvent,
  maybeReleaseCheckoutInventory,
  releaseCheckoutSessionById,
};
