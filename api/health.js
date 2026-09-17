const {
  getStripeDiagnostics,
  verifyStripeModeWithApi,
} = require("../lib/stripe-diagnostics");
const { USE_KV } = require("../lib/inventory-store");

module.exports = async (_req, res) => {
  const diagnostics = getStripeDiagnostics();
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripeVerification = await verifyStripeModeWithApi(secretKey);

  res.status(200).json({
    ok: true,
    source: "products.json",
    inventoryBackend: USE_KV ? "redis" : process.env.VERCEL ? "missing" : "file",
    ...diagnostics,
    stripeVerification,
    summary:
      stripeVerification.verified && stripeVerification.stripeApiLivemode
        ? "LIVE — real charges"
        : stripeVerification.verified && !stripeVerification.stripeApiLivemode
          ? "TEST — sandbox checkout"
          : diagnostics.stripeMode === "live"
            ? "Key looks live but Stripe API check failed"
            : diagnostics.stripeMode === "test"
              ? "TEST — sandbox checkout (from key prefix)"
              : "Stripe key missing or unrecognized",
  });
};
