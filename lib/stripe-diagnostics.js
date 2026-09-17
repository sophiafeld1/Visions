function getStripeKeyFingerprint(secretKey) {
  if (!secretKey) {
    return null;
  }

  if (secretKey.length < 16) {
    return "too_short";
  }

  return `${secretKey.slice(0, 12)}…${secretKey.slice(-4)}`;
}

function getStripeModeFromKey(secretKey) {
  if (!secretKey) {
    return "missing";
  }
  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }
  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }
  if (secretKey.startsWith("rk_live_")) {
    return "restricted_live";
  }
  if (secretKey.startsWith("rk_test_")) {
    return "restricted_test";
  }
  return "unknown";
}

function getStripeDiagnostics() {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripeMode = getStripeModeFromKey(secretKey);

  return {
    stripeMode,
    keyPresent: Boolean(secretKey),
    keyLength: secretKey.length,
    keyFingerprint: getStripeKeyFingerprint(secretKey),
    vercelEnv: process.env.VERCEL_ENV || "local",
    vercelDeploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    vercelRegion: process.env.VERCEL_REGION || null,
    nodeEnv: process.env.NODE_ENV || null,
  };
}

async function verifyStripeModeWithApi(secretKey) {
  if (!secretKey) {
    return { verified: false, error: "STRIPE_SECRET_KEY is not set" };
  }

  const Stripe = require("stripe");
  const stripe = new Stripe(secretKey);

  try {
    const balance = await stripe.balance.retrieve();
    return {
      verified: true,
      stripeApiLivemode: balance.livemode,
      keyPrefixMode: getStripeModeFromKey(secretKey),
      modesMatch:
        balance.livemode === secretKey.startsWith("sk_live_") ||
        balance.livemode === secretKey.startsWith("rk_live_"),
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message,
      keyPrefixMode: getStripeModeFromKey(secretKey),
    };
  }
}

function logStripeDiagnostics(context) {
  const diagnostics = getStripeDiagnostics();
  console.log(`[stripe:${context}]`, JSON.stringify(diagnostics));
  return diagnostics;
}

module.exports = {
  getStripeDiagnostics,
  getStripeModeFromKey,
  verifyStripeModeWithApi,
  logStripeDiagnostics,
};
