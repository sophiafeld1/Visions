import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Stripe = require("stripe");
const { handleStripeWebhookEvent } = require("../lib/stripe-webhook-handlers");

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json(
      { error: "No stripe-signature header value was provided." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    try {
      await handleStripeWebhookEvent(event);
    } catch (handlerError) {
      console.error("[stripe:webhook:handler]", handlerError);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("[stripe:webhook]", error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
