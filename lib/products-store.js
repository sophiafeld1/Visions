const fs = require("fs");
const path = require("path");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

const PRODUCT_ID_ALIASES = {
  "checkout-test-item-2": "checkout-test-item",
  "checkout-test-item-3": "checkout-test-item",
  "checkout-test-item-4": "checkout-test-item",
};

function resolveProductId(id) {
  return PRODUCT_ID_ALIASES[id] || id;
}

function loadProductsFromFile() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));

  if (!Array.isArray(products)) {
    throw new Error("data/products.json must be a JSON array");
  }

  return products.map(normalizeProduct);
}

function normalizeProduct(product) {
  const inventory = product.inventory || [];
  const sizes = product.sizes?.length
    ? product.sizes
    : inventory.map((entry) => entry.size);

  return {
    ...product,
    inventory,
    sizes,
  };
}

function getProductById(id) {
  return loadProductsFromFile().find((product) => product.id === id) || null;
}

function getInventoryQuantity(productId, size) {
  const product = getProductById(productId);
  if (!product) return null;

  const entry = product.inventory.find((item) => item.size === size);
  return entry ? entry.quantity : null;
}

module.exports = {
  PRODUCTS_FILE,
  PRODUCT_ID_ALIASES,
  resolveProductId,
  loadProductsFromFile,
  getProductById,
  getInventoryQuantity,
};
