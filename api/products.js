const { loadProductsFromFile } = require("../lib/products-store");
const { mergeLiveInventory } = require("../lib/inventory-store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const products = await mergeLiveInventory(loadProductsFromFile());
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
