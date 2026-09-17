const { getProductById } = require("../../../lib/products-store");
const { getQuantity } = require("../../../lib/inventory-store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const product = getProductById(req.query.productId);
    const size = req.query.size;
    const hasSize = product?.inventory?.some((entry) => entry.size === size);

    if (!hasSize) {
      res.status(404).json({ error: "Size not found" });
      return;
    }

    const quantity = await getQuantity(req.query.productId, size);
    res.status(200).json({ quantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
