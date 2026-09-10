(function () {
  if (typeof window.gtag !== "function") {
    return;
  }

  if (new URLSearchParams(window.location.search).has("ga_debug")) {
    window.gtag("config", "G-5VRDK2R76M", { debug_mode: true });
  }

  window.trackGa4Event = function trackGa4Event(eventName, params) {
    window.gtag("event", eventName, params || {});
  };

  window.trackGa4AddToCart = function trackGa4AddToCart(product, quantity) {
    if (!product) return;
    window.trackGa4Event("add_to_cart", {
      currency: "USD",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity,
        },
      ],
    });
  };

  window.trackGa4BeginCheckout = function trackGa4BeginCheckout(cartItems) {
    if (!cartItems?.length || typeof getProductById !== "function") return;

    const items = cartItems
      .map((entry) => {
        const product = getProductById(entry.id);
        if (!product) return null;
        return {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: entry.quantity,
        };
      })
      .filter(Boolean);

    const value = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    window.trackGa4Event("begin_checkout", {
      currency: "USD",
      value,
      items,
    });
  };

  window.trackGa4Purchase = function trackGa4Purchase(summary) {
    if (!summary) return;

    window.trackGa4Event("purchase", {
      transaction_id: summary.sessionId,
      currency: (summary.currency || "usd").toUpperCase(),
      value: summary.amountTotal / 100,
      items: (summary.lineItems || []).map((item) => ({
        item_name: item.name,
        price: item.amount / 100 / Math.max(item.quantity, 1),
        quantity: item.quantity,
      })),
    });
  };
})();
