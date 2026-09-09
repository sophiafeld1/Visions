const { createCheckoutSession } = require("../lib/checkout");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const origin =
      req.headers.origin ||
      (req.headers.host ? `https://${req.headers.host}` : null);
    const { items } = req.body || {};
    const result = await createCheckoutSession({ items, origin });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
