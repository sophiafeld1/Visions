require("dotenv").config();
const { getCheckoutSessionSummary } = require("../lib/get-checkout-session");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const sessionId = req.query.session_id;
    const summary = await getCheckoutSessionSummary(sessionId);
    res.status(200).json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
