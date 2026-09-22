const Stripe = require("stripe");
const { getProductById, resolveProductId } = require("./products-store");
const { getQuantity } = require("./inventory-store");
const { logStripeDiagnostics } = require("./stripe-diagnostics");

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
  if (isStripeTestMode()) {
    return product.test_stripe_product_id || null;
  }
  return product.stripe_product_id || null;
}

async function resolveStripePriceId(stripe, product) {
  const directPriceId = getStripePriceId(product);
  if (directPriceId) {
    return directPriceId;
  }

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

  throw new Error(`${product.name} is not available for checkout yet.`);
}

const SHIPPING_RATES = {
  live: {
    ground: "shr_1UDZwyBN7SXhPCp6IaO35zNo",
    express: "shr_1UDZxrBN7SXhPCp607EtTSzE",
  },
};

function getShippingOptions() {
  if (isStripeTestMode()) {
    return [];
  }

  const rates = SHIPPING_RATES.live;
  return [rates.ground, rates.express]
    .filter(Boolean)
    .map((shipping_rate) => ({ shipping_rate }));
}

function cartRequiresShipping(items) {
  return items.some((item) => {
    const product = getProductById(item?.id);
    return product && !product.noShipping;
  });
}

async function validateCartItems(items, stripe) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Your cart is empty.");
  }

  const lineItems = [];
  const metadataItems = [];
  const reservationItems = [];

  for (const item of items) {
    const id = resolveProductId(item?.id);
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

    const available = await getQuantity(id, size);
    if (available < quantity) {
      throw new Error(`Not enough stock for ${product.name} (${size}).`);
    }

    lineItems.push({ price: priceId, quantity });
    metadataItems.push(`${id}:${size}:${quantity}`);
    reservationItems.push({ id, size, quantity });
  }

  return { lineItems, metadataItems, reservationItems };
}

async function createCheckoutSession({ items, origin }) {
  const diagnostics = logStripeDiagnostics("checkout");
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  if (!origin) {
    throw new Error("Missing site origin.");
  }

  const stripe = new Stripe(secretKey);
  const { lineItems, metadataItems, reservationItems } = await validateCartItems(items, stripe);

  const chargeShipping = cartRequiresShipping(items);
  const shippingOptions = chargeShipping ? getShippingOptions() : [];
  const sessionConfig = {
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout-cancel.html?session_id={CHECKOUT_SESSION_ID}`,
    customer_creation: "always",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: "Visions Studio order",
      },
    },
    wallet_options: {
      link: {
        display: "never",
      },
    },
    metadata: {
      cart: metadataItems.join("|"),
    },
  };

  if (shippingOptions.length) {
    sessionConfig.shipping_options = shippingOptions;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  console.log(
    "[stripe:checkout:session]",
    JSON.stringify({
      sessionId: session.id,
      sessionLivemode: session.livemode,
      stripeMode: diagnostics.stripeMode,
      keyFingerprint: diagnostics.keyFingerprint,
      vercelEnv: diagnostics.vercelEnv,
    })
  );

  if (!session.url) {
    throw new Error("Unable to start checkout.");
  }

  return { url: session.url, sessionId: session.id };
}

module.exports = {
  createCheckoutSession,
  validateCartItems,
  cartRequiresShipping,
};
