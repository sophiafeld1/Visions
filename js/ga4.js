(function () {
  const measurementId = window.VISIONS_GA4_ID;

  if (!measurementId || !measurementId.startsWith("G-")) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
  });

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
