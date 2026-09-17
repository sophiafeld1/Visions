const Stripe = require("stripe");
const { getProductById, getInventoryQuantity } = require("./products-store");

function isStripeTestMode() {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
}

function getStripePriceId(product) {
  if (isStripeTestMode() && product.test_price_id) {
    return product.test_price_id;
  }
  return product.price_id || product.stripePriceId || null;
}

function getStripeProductId(product) {
  if (isStripeTestMode() && product.test_stripe_product_id) {
    return product.test_stripe_product_id;
  }
  return product.stripe_product_id || null;
}

async function resolveStripePriceId(stripe, product) {
  const stripeProductId = getStripeProductId(product);

  if (stripeProductId) {
    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      throw new Error(`${product.name} has no active Stripe price.`);
    }
    return price.id;
  }

  const priceId = getStripePriceId(product);
  if (!priceId) {
    throw new Error(`${product.name} is not available for checkout yet.`);
  }
  return priceId;
}

function getShippingOptions() {
  const isTest = isStripeTestMode();
  const groundRateId = isTest
    ? process.env.STRIPE_TEST_SHIPPING_RATE_GROUND
    : process.env.STRIPE_SHIPPING_RATE_GROUND;
  const expressRateId = isTest
    ? process.env.STRIPE_TEST_SHIPPING_RATE_EXPRESS
    : process.env.STRIPE_SHIPPING_RATE_EXPRESS;

  const shippingOptions = [];

  if (groundRateId) {
    shippingOptions.push({ shipping_rate: groundRateId });
  }

  if (expressRateId) {
    shippingOptions.push({ shipping_rate: expressRateId });
  }

  return shippingOptions;
}

async function validateCartItems(items, stripe) {
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

    const priceId = await resolveStripePriceId(stripe, product);

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

  const stripe = new Stripe(secretKey);
  const { lineItems, metadataItems } = await validateCartItems(items, stripe);

  const shippingOptions = getShippingOptions();
  const sessionConfig = {
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
  };

  if (shippingOptions.length) {
    sessionConfig.shipping_options = shippingOptions;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  if (!session.url) {
    throw new Error("Unable to start checkout.");
  }

  return { url: session.url, sessionId: session.id };
}

module.exports = {
  createCheckoutSession,
};
