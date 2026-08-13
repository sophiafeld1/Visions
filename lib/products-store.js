const fs = require("fs");
const path = require("path");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

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
  loadProductsFromFile,
  getProductById,
  getInventoryQuantity,
};
