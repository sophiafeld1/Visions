#!/usr/bin/env node
/** Ensure test checkout products have Stripe prices for the current STRIPE_SECRET_KEY mode. */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

async function ensureStripePrice(stripe, product, { isLive, force }) {
  const priceField = isLive ? "price_id" : "test_price_id";
  const productField = isLive ? "stripe_product_id" : "test_stripe_product_id";

  if (product[priceField] && !force) {
    console.log(`Skip ${product.id} — ${priceField} already set`);
    return;
  }

  let stripeProductId = product[productField];
  if (!stripeProductId) {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: { shop_id: product.id },
    });
    stripeProductId = stripeProduct.id;
    product[productField] = stripeProductId;
  }

  const stripePrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: Math.round(product.price * 100),
    currency: "usd",
  });

  product[priceField] = stripePrice.id;
  console.log(`Created ${isLive ? "LIVE" : "TEST"} price ${stripePrice.id} for ${product.id}`);
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Set STRIPE_SECRET_KEY first.");
  }

  const isLive = secretKey.startsWith("sk_live_");
  const force = process.argv.includes("--force");
  const requestedIds = process.argv.filter((arg) => !arg.startsWith("--") && !arg.endsWith(".js"));
  const stripe = new Stripe(secretKey);
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));

  const targets = products.filter((product) => {
    if (requestedIds.length) {
      return requestedIds.includes(product.id);
    }
    return product.id.startsWith("checkout-test-item");
  });

  if (!targets.length) {
    throw new Error("No matching test products found in data/products.json");
  }

  for (const product of targets) {
    await ensureStripePrice(stripe, product, { isLive, force });
  }

  fs.writeFileSync(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`Updated ${PRODUCTS_FILE}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
