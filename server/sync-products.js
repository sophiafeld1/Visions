const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

function loadProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    throw new Error(`Missing ${PRODUCTS_FILE}`);
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  if (!Array.isArray(products)) {
    throw new Error("data/products.json must be a JSON array");
  }

  return products;
}

function saveProductsFile(products) {
  fs.writeFileSync(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

function validateProduct(product, index) {
  const label = `Product #${index + 1}`;

  if (!product.id || typeof product.id !== "string") {
    throw new Error(`${label}: "id" is required`);
  }
  if (!product.name || typeof product.name !== "string") {
    throw new Error(`${label}: "name" is required`);
  }
  if (typeof product.price !== "number" || Number.isNaN(product.price)) {
    throw new Error(`${label} (${product.id}): "price" must be a number`);
  }
  if (!product.image || typeof product.image !== "string") {
    throw new Error(`${label} (${product.id}): "image" is required`);
  }
  if (!product.description || typeof product.description !== "string") {
    throw new Error(`${label} (${product.id}): "description" is required`);
  }
  if (!Array.isArray(product.inventory) || !product.inventory.length) {
    throw new Error(`${label} (${product.id}): "inventory" must be a non-empty array`);
  }

  for (const entry of product.inventory) {
    if (!entry.size || typeof entry.size !== "string") {
      throw new Error(`${label} (${product.id}): each inventory item needs a "size"`);
    }
    if (!Number.isInteger(entry.quantity) || entry.quantity < 0) {
      throw new Error(
        `${label} (${product.id}, size ${entry.size}): "quantity" must be a whole number >= 0`
      );
    }
  }
}

async function upsertProduct(client, product) {
  await client.query(
    `
      INSERT INTO products (id, name, color, color_swatch, price, image, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        color = EXCLUDED.color,
        color_swatch = EXCLUDED.color_swatch,
        price = EXCLUDED.price,
        image = EXCLUDED.image,
        description = EXCLUDED.description
    `,
    [
      product.id,
      product.name,
      product.color || null,
      product.colorSwatch || null,
      product.price,
      product.image,
      product.description,
    ]
  );
}

async function upsertInventory(client, product) {
  const inventory = product.inventory || [];

  for (const entry of inventory) {
    await client.query(
      `
        INSERT INTO inventory (product_id, size, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_id, size) DO UPDATE SET
          quantity = EXCLUDED.quantity
      `,
      [product.id, entry.size, entry.quantity]
    );
  }

  const sizes = inventory.map((entry) => entry.size);
  await client.query(
    `
      DELETE FROM inventory
      WHERE product_id = $1
        AND NOT (size = ANY($2::text[]))
    `,
    [product.id, sizes]
  );
}

async function syncProducts(products, { dryRun = false } = {}) {
  products.forEach(validateProduct);

  if (dryRun) {
    console.log("Dry run — no database changes made.\n");
    printProductsSummary(products);
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const product of products) {
      await upsertProduct(client, product);
      await upsertInventory(client, product);
    }

    await client.query("COMMIT");
    console.log("Inventory updated.\n");
    printProductsSummary(products);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function printProductsSummary(products) {
  for (const product of products) {
    console.log(`${product.name} (${product.id})`);
    for (const entry of product.inventory) {
      console.log(`  ${entry.size}: ${entry.quantity} in stock`);
    }
  }
}

async function fetchInventoryFromDb() {
  const result = await pool.query(`
    SELECT
      p.id,
      p.name,
      i.size,
      i.quantity
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.name, i.size
  `);

  const grouped = new Map();
  for (const row of result.rows) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, { id: row.id, name: row.name, inventory: [] });
    }
    if (row.size) {
      grouped.get(row.id).inventory.push({ size: row.size, quantity: row.quantity });
    }
  }

  return [...grouped.values()];
}

function updateProductStock(products, productId, size, quantity) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    throw new Error(`Product "${productId}" not found in data/products.json`);
  }

  const entry = product.inventory.find((item) => item.size === size);
  if (entry) {
    entry.quantity = quantity;
  } else {
    product.inventory.push({ size, quantity });
  }

  if (Array.isArray(product.sizes) && !product.sizes.includes(size)) {
    product.sizes.push(size);
  }

  return products;
}

module.exports = {
  PRODUCTS_FILE,
  loadProductsFile,
  saveProductsFile,
  syncProducts,
  fetchInventoryFromDb,
  printProductsSummary,
  updateProductStock,
};
