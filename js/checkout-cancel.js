async function releaseCancelledCheckoutSession() {
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
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
    // Inventory will be restored when the Stripe session expires.
  }
}

document.addEventListener("DOMContentLoaded", releaseCancelledCheckoutSession);
