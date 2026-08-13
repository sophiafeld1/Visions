const { loadProductsFromFile } = require("../lib/products-store");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    res.status(200).json(loadProductsFromFile());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
