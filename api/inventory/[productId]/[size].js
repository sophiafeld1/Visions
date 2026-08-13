const { getInventoryQuantity } = require("../../../lib/products-store");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const quantity = getInventoryQuantity(req.query.productId, req.query.size);
    if (quantity === null) {
      res.status(404).json({ error: "Size not found" });
      return;
    }

    res.status(200).json({ quantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
