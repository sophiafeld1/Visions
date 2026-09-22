#!/usr/bin/env node
/** Force-sync live inventory for checkout-test-item* products. */

require("dotenv").config();
const { loadProductsFromFile } = require("../lib/products-store");
const { setQuantity } = require("../lib/inventory-store");

function parseOverrides(argv) {
  const overrides = new Map();

  for (const arg of argv) {
    const match = arg.match(/^([^=]+)=(\d+)$/);
    if (!match) continue;
    overrides.set(match[1], Number(match[2]));
  }

  return overrides;
}

async function main() {
  const overrides = parseOverrides(process.argv.slice(2));
  const products = loadProductsFromFile().filter((product) =>
    product.id.startsWith("checkout-test-item")
  );

  if (!products.length) {
    throw new Error("No checkout test products found.");
  }

  for (const product of products) {
    for (const entry of product.inventory || []) {
      const quantity = overrides.has(product.id)
        ? overrides.get(product.id)
        : entry.quantity;
      await setQuantity(product.id, entry.size, quantity);
      console.log(`${product.id} (${entry.size}): ${quantity}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
