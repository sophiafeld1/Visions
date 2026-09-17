const { releaseCheckoutSessionById } = require("../lib/stripe-webhook-handlers");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const sessionId = req.body?.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: "Missing session ID." });
      return;
    }

    const session = await releaseCheckoutSessionById(sessionId);
    res.status(200).json({
      released: session.payment_status !== "paid",
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
