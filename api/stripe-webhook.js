const Stripe = require("stripe");
const { handleStripeWebhookEvent } = require("../lib/stripe-webhook-handlers");

async function readRequestBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Buffer.from(req.body);
  }

  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    res.status(500).json({ error: "Stripe webhook is not configured." });
    return;
  }

  const stripe = new Stripe(secretKey);

  try {
    const payload = await readRequestBody(req);
    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    await handleStripeWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe:webhook]", error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
