const Stripe = require("stripe");
const { getProductById, getInventoryQuantity } = require("./products-store");

function getStripePriceId(product) {
  return product.price_id || product.stripePriceId || null;
}

function validateCartItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Your cart is empty.");
  }

  const lineItems = [];
  const metadataItems = [];

  for (const item of items) {
    const id = item?.id;
    const size = item?.size;
    const quantity = Number(item?.quantity);

    if (!id || !size || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Invalid cart item.");
    }

    const product = getProductById(id);
    if (!product) {
      throw new Error(`Product not found: ${id}`);
    }

    const priceId = getStripePriceId(product);
    if (!priceId) {
      throw new Error(`${product.name} is not available for checkout yet.`);
    }

    const available = getInventoryQuantity(id, size);
    if (available === null || available < quantity) {
      throw new Error(`Not enough stock for ${product.name} (${size}).`);
    }

    lineItems.push({ price: priceId, quantity });
    metadataItems.push(`${id}:${size}:${quantity}`);
  }

  return { lineItems, metadataItems };
}

async function createCheckoutSession({ items, origin }) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  if (!origin) {
    throw new Error("Missing site origin.");
  }

  const { lineItems, metadataItems } = validateCartItems(items);
  const stripe = new Stripe(secretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout-cancel.html`,
    metadata: {
      cart: metadataItems.join("|"),
    },
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout.");
  }

  return { url: session.url, sessionId: session.id };
}

module.exports = {
  createCheckoutSession,
};
