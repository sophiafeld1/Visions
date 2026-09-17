const { getProductById } = require("../../lib/products-store");
const { mergeLiveInventory } = require("../../lib/inventory-store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const product = getProductById(req.query.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [withInventory] = await mergeLiveInventory([product]);
    res.status(200).json(withInventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
