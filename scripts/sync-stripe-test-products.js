#!/usr/bin/env node
/** Create Stripe test-mode products/prices from data/products.json */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("Set STRIPE_SECRET_KEY to a test key (sk_test_...) in .env first.");
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  const stripe = new Stripe(secretKey);

  for (const product of products) {
    if (product.test_price_id) {
      console.log(`Skip ${product.id} — already has test_price_id`);
      continue;
    }

    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: { shop_id: product.id },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: "usd",
    });

    product.test_price_id = stripePrice.id;
    console.log(`${product.id} → ${stripePrice.id} ($${product.price})`);
  }

  fs.writeFileSync(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log("\nUpdated data/products.json with test_price_id fields.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
