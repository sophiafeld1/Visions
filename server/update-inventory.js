require("dotenv").config();

const { pool } = require("./db");
const {
  loadProductsFile,
  saveProductsFile,
  syncProducts,
  fetchInventoryFromDb,
  printProductsSummary,
  updateProductStock,
} = require("./sync-products");

function printHelp() {
  console.log(`
Update Visions inventory in PostgreSQL from data/products.json

Usage:
  npm run db:update
      Sync every product and stock level from data/products.json

  npm run db:update -- --show
      Print current stock in the database

  npm run db:update -- --set <product-id> <size> <quantity>
      Quick update for one size, then sync to the database
      Example: npm run db:update -- --set v-neck-tie-top XS 8

  npm run db:update -- --dry-run
      Validate data/products.json without writing to the database

Edit stock in: data/products.json
`);
}

function parseSetArgs(args) {
  if (args.length !== 3) {
    throw new Error('Usage: --set <product-id> <size> <quantity>');
  }

  const [productId, size, quantityRaw] = args;
  const quantity = Number(quantityRaw);

  if (!productId || !size) {
    throw new Error('Usage: --set <product-id> <size> <quantity>');
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a whole number greater than or equal to 0");
  }

  return { productId, size, quantity };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--show")) {
    const products = await fetchInventoryFromDb();
    if (!products.length) {
      console.log("No products in the database yet. Run npm run db:setup first.");
      return;
    }
    console.log("Current database inventory:\n");
    printProductsSummary(
      products.map((product) => ({
        ...product,
        inventory: product.inventory,
      }))
    );
    return;
  }

  const dryRun = args.includes("--dry-run");
  const setIndex = args.indexOf("--set");

  if (setIndex !== -1) {
    const { productId, size, quantity } = parseSetArgs(args.slice(setIndex + 1));
    const products = loadProductsFile();
    updateProductStock(products, productId, size, quantity);
    saveProductsFile(products);
    console.log(`Updated data/products.json: ${productId} / ${size} -> ${quantity}\n`);
    await syncProducts(products, { dryRun });
    return;
  }

  const products = loadProductsFile();
  await syncProducts(products, { dryRun });
}

main()
  .catch((error) => {
    console.error("Inventory update failed:", error.message);
    process.exit(1);
  })
  .finally(() => pool.end());
