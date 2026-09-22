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
    // Ignore release failures; newer checkouts no longer hold inventory.
  } finally {
    localStorage.removeItem("visions-pending-checkout-session");
  }
}

document.addEventListener("DOMContentLoaded", releaseCancelledCheckoutSession);
