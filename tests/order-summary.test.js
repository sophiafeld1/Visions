const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeCheckoutSession } = require("../lib/order-summary");

describe("order summary", () => {
  it("formats a paid checkout session for merchant email", () => {
    const summary = summarizeCheckoutSession({
      id: "cs_test_123",
      amount_total: 50,
      currency: "usd",
      customer_details: {
        email: "buyer@example.com",
        name: "Buyer Name",
      },
      shipping_details: {
        name: "Buyer Name",
        address: {
          line1: "123 Main St",
          city: "Reston",
          state: "VA",
          postal_code: "20190",
          country: "US",
        },
      },
      line_items: {
        data: [
          {
            description: "Checkout Test Item",
            quantity: 1,
            amount_total: 50,
            price: { product: { name: "Checkout Test Item" } },
          },
        ],
      },
      payment_intent: {
        latest_charge: {
          receipt_url: "https://stripe.com/receipt",
        },
      },
    });

    assert.equal(summary.totalLabel, "$0.50");
    assert.equal(summary.email, "buyer@example.com");
    assert.match(summary.textBody, /123 Main St/);
    assert.match(summary.textBody, /Checkout Test Item/);
    assert.match(summary.htmlBody, /buyer@example.com/);
  });
});
