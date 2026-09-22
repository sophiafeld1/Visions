const PENDING_CHECKOUT_KEY = "visions-pending-checkout-session";

async function releasePendingCheckoutSession() {
  const sessionId = localStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!sessionId) {
    return;
  }

  try {
    await fetch("/api/release-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // Best-effort cleanup for older checkout sessions that still held inventory.
  } finally {
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
  }
}

async function startCheckout(cartItems) {
  await releasePendingCheckoutSession();

  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cartItems }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to start checkout.");
  }

  if (!data.url) {
    throw new Error("Unable to start checkout.");
  }

  if (data.sessionId) {
    localStorage.setItem(PENDING_CHECKOUT_KEY, data.sessionId);
  }

  window.location.href = data.url;
}

function clearCartAfterCheckout() {
  localStorage.removeItem("visions-cart");
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }
}
